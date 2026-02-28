"""
Obsidian Watcher: Monitors vault for new images, converts to WebP,
uploads to R2, and updates markdown links.

Also watches for markdown changes in publish folder for CMS sync.

Part of the Linkdinger daemon.
"""

import os
import re
import time
import uuid
import json
import logging
from pathlib import Path
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
import boto3
from PIL import Image
import yaml
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


class Config:
    def __init__(self, config_path: str = "config.yaml"):
        with open(config_path, "r", encoding="utf-8") as f:
            cfg = yaml.safe_load(f)

        self.vault_path = cfg["vault"]["path"]
        self.assets_dir = os.path.join(self.vault_path, cfg["vault"]["assets_dir"])
        self.r2_endpoint = os.getenv("R2_ENDPOINT")
        self.r2_access_key = os.getenv("R2_ACCESS_KEY")
        self.r2_secret_key = os.getenv("R2_SECRET_KEY")
        self.r2_bucket = os.getenv("R2_BUCKET")
        self.r2_public_url = os.getenv("R2_PUBLIC_URL")
        self.debounce_sec = cfg["watcher"]["debounce_sec"]
        self.formats = cfg["watcher"]["formats"]
        self.output_format = cfg["watcher"]["output_format"]
        self.quality = cfg["watcher"]["quality"]

        # Publish config (for CMS sync)
        publish = cfg.get("publish", {})
        self.publish_folder = os.path.join(
            self.vault_path, publish.get("folder", "publish")
        )

        # Upload log path (for image link rewriting)
        self.upload_log_path = os.path.join(
            self.assets_dir, ".upload_log.json"
        )

        self._validate()

    def _validate(self):
        if not self.vault_path:
            raise ValueError("vault.path is required in config.yaml")
        if not all([self.r2_endpoint, self.r2_access_key, self.r2_secret_key, self.r2_bucket]):
            raise ValueError("Missing R2 credentials in .env")


class R2Uploader:
    def __init__(self, config: Config):
        self.config = config
        self.client = boto3.client(
            "s3",
            endpoint_url=config.r2_endpoint,
            aws_access_key_id=config.r2_access_key,
            aws_secret_access_key=config.r2_secret_key,
        )

    def upload(self, filepath: str, filename: str) -> str:
        content_type = f"image/{self.config.output_format}"
        self.client.upload_file(
            filepath,
            self.config.r2_bucket,
            filename,
            ExtraArgs={"ContentType": content_type}
        )
        return f"{self.config.r2_public_url}/{filename}"


class ImageProcessor:
    def __init__(self, config: Config):
        self.config = config

    def convert_to_webp(self, filepath: str) -> tuple[str, str]:
        original_ext = os.path.splitext(filepath)[1].lower()
        original_name = os.path.basename(filepath)
        
        # Determine output format and name based on input
        # Don't convert gifs
        out_format = "gif" if original_ext == ".gif" else self.config.output_format
        new_name = f"{uuid.uuid4().hex}.{out_format}"
        new_path = filepath.replace(original_name, new_name)

        if original_ext in (".webp", ".gif"):
            # Just copy the file over instead of reconverting
            shutil.copy2(filepath, new_path)
            return new_path, new_name

        img = Image.open(filepath)

        if img.mode in ("RGBA", "P"):
            img = img.convert("RGB")

        img.save(new_path, self.config.output_format, optimize=True, quality=self.config.quality)

        return new_path, new_name


class MarkdownUpdater:
    def __init__(self, config: Config):
        self.config = config

    def find_latest_md(self) -> str | None:
        md_files = []
        for root, _, files in os.walk(self.config.vault_path):
            for file in files:
                if file.endswith(".md"):
                    md_files.append(os.path.join(root, file))

        if not md_files:
            return None

        return max(md_files, key=os.path.getmtime)

    def replace_image_link(self, old_filename: str, new_url: str) -> bool:
        latest_md = self.find_latest_md()
        if not latest_md:
            logger.warning("No markdown files found")
            return False

        with open(latest_md, "r", encoding="utf-8") as f:
            content = f.read()

        patterns = [
            r'!\[\[(.*?)' + re.escape(old_filename) + r'\]\]',
            r'!\[.*?\]\(.*?' + re.escape(old_filename) + r'\)',
        ]

        new_content = content
        for pattern in patterns:
            new_content = re.sub(pattern, f"![image]({new_url})", new_content)

        # Replace in frontmatter for coverImage
        # Matches: coverImage: "old_filename.png" or coverImage: old_filename.png or coverImage: "[[old_filename.png]]"
        new_content = re.sub(
            r'(coverImage:\s*["\']?)(?:\[\[)?(.*?' + re.escape(old_filename) + r')(?:\]\])?(["\']?)', 
            rf'\g<1>{new_url}\3', 
            new_content
        )

        if new_content != content:
            with open(latest_md, "w", encoding="utf-8") as f:
                f.write(new_content)
            logger.info(f"Updated markdown: {latest_md}")
            return True

        return False


def _write_upload_log(log_path: str, original_name: str, r2_url: str):
    """Append to upload manifest for CMS image link rewriting."""
    log = {}
    if os.path.exists(log_path):
        try:
            with open(log_path, "r", encoding="utf-8") as f:
                log = json.load(f)
        except (json.JSONDecodeError, OSError):
            log = {}

    log[original_name] = r2_url

    os.makedirs(os.path.dirname(log_path), exist_ok=True)
    with open(log_path, "w", encoding="utf-8") as f:
        json.dump(log, f, indent=2)


class ImageHandler(FileSystemEventHandler):
    def __init__(self, config: Config, on_processed=None):
        """
        Args:
            config: Linkdinger config
            on_processed: Optional callback after successful image processing.
                          Used by the unified daemon to trigger git sync.
        """
        self.config = config
        self.uploader = R2Uploader(config)
        self.processor = ImageProcessor(config)
        self.md_updater = MarkdownUpdater(config)
        self._on_processed = on_processed
        self._processed_count = 0

    def on_created(self, event):
        if not event.is_directory:
            self._check_and_process(event.src_path)

    def on_moved(self, event):
        if not event.is_directory:
            self._check_and_process(event.dest_path)

    def _check_and_process(self, filepath):
        ext = os.path.splitext(filepath)[1].lower()
        if ext not in self.config.formats:
            return

        time.sleep(self.config.debounce_sec)
        self.process_image(filepath)

    def process_image(self, filepath: str):
        original_name = os.path.basename(filepath)

        try:
            logger.info(f"Processing: {original_name}")

            webp_path, webp_name = self.processor.convert_to_webp(filepath)
            logger.info(f"Converted to WebP: {webp_name}")

            url = self.uploader.upload(webp_path, webp_name)
            logger.info(f"Uploaded to R2: {url}")

            self.md_updater.replace_image_link(original_name, url)

            # Write upload log for CMS image link rewriting
            _write_upload_log(self.config.upload_log_path, original_name, url)

            os.remove(filepath)
            os.remove(webp_path)
            logger.info(f"Deleted local files")

            self._processed_count += 1
            print(f"✅ {original_name} → {url}")

            # Notify git module
            if self._on_processed:
                self._on_processed()

        except Exception as e:
            logger.error(f"Error processing {original_name}: {e}")
            print(f"❌ Error: {original_name} - {str(e)}")

    @property
    def processed_count(self) -> int:
        return self._processed_count


class MarkdownHandler(FileSystemEventHandler):
    """Watches markdown file changes for CMS content sync.

    Triggers content_sync.notify() when .md files in the publish
    folder are created, modified, or deleted.
    """

    def __init__(self, config: Config, on_change=None):
        """
        Args:
            config: Linkdinger config
            on_change: Callback(source_path, deleted=bool) for CMS sync
        """
        self.config = config
        self._on_change = on_change
        self._sync_count = 0

    def _is_publish_md(self, filepath: str) -> bool:
        """Check if file is a .md in the publish folder."""
        if not filepath.endswith(".md"):
            return False
        return filepath.startswith(self.config.publish_folder)

    def on_created(self, event):
        if not event.is_directory and self._is_publish_md(event.src_path):
            time.sleep(self.config.debounce_sec)
            self._handle_change(event.src_path, deleted=False)

    def on_modified(self, event):
        if not event.is_directory and self._is_publish_md(event.src_path):
            time.sleep(self.config.debounce_sec)
            self._handle_change(event.src_path, deleted=False)

    def on_deleted(self, event):
        if not event.is_directory and self._is_publish_md(event.src_path):
            self._handle_change(event.src_path, deleted=True)

    def on_moved(self, event):
        if not event.is_directory:
            # Moved out of publish/ = delete
            if self._is_publish_md(event.src_path):
                self._handle_change(event.src_path, deleted=True)
            # Moved into publish/ = create
            if self._is_publish_md(event.dest_path):
                time.sleep(self.config.debounce_sec)
                self._handle_change(event.dest_path, deleted=False)

    def _handle_change(self, filepath: str, deleted: bool):
        action = "deleted" if deleted else "synced"
        logger.info(f"CMS {action}: {os.path.basename(filepath)}")

        if self._on_change:
            self._on_change(filepath, deleted)

        self._sync_count += 1

    @property
    def sync_count(self) -> int:
        return self._sync_count


def create_watcher(
    config: Config,
    on_processed=None,
    cms_callback=None,
) -> tuple[Observer, ImageHandler, MarkdownHandler | None]:
    """Create and return a watcher (not yet started).

    Args:
        config: Linkdinger config
        on_processed: Optional callback for git notification (images)
        cms_callback: Optional callback(filepath, deleted) for CMS sync

    Returns:
        (observer, image_handler, md_handler) tuple
    """
    observer = Observer()

    # Image handler — watches entire vault
    image_handler = ImageHandler(config, on_processed=on_processed)
    observer.schedule(image_handler, config.vault_path, recursive=True)

    # Markdown handler — watches publish folder for CMS
    md_handler = None
    if cms_callback and os.path.isdir(config.publish_folder):
        md_handler = MarkdownHandler(config, on_change=cms_callback)
        observer.schedule(md_handler, config.publish_folder, recursive=True)

    return observer, image_handler, md_handler


def main():
    try:
        config = Config()
    except ValueError as e:
        print(f"❌ Configuration error: {e}")
        return

    observer, handler, _ = create_watcher(config)
    observer.start()

    print(f"👁️  Watching: {config.vault_path}")
    print("Press Ctrl+C to stop\n")

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()

    observer.join()


if __name__ == "__main__":
    main()

