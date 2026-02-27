"""
Obsidian Watcher: Monitors vault for new images, converts to WebP,
uploads to R2, and updates markdown links.

Part of the Linkdinger daemon.
"""

import os
import re
import time
import uuid
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
        original_name = os.path.basename(filepath)
        new_name = f"{uuid.uuid4().hex}.{self.config.output_format}"
        new_path = filepath.replace(original_name, new_name)

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

        if new_content != content:
            with open(latest_md, "w", encoding="utf-8") as f:
                f.write(new_content)
            logger.info(f"Updated markdown: {latest_md}")
            return True

        return False


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


def create_watcher(config: Config, on_processed=None) -> tuple[Observer, ImageHandler]:
    """Create and return a watcher (not yet started).
    
    Args:
        config: Linkdinger config
        on_processed: Optional callback for git notification
    
    Returns:
        (observer, handler) tuple — call observer.start() to begin.
    """
    handler = ImageHandler(config, on_processed=on_processed)
    observer = Observer()
    observer.schedule(handler, config.vault_path, recursive=True)
    return observer, handler


def main():
    try:
        config = Config()
    except ValueError as e:
        print(f"❌ Configuration error: {e}")
        return

    observer, handler = create_watcher(config)
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
