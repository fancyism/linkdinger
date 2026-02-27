"""
Content Sync: Syncs markdown files from Obsidian vault to blog.

Part of the Linkdinger CMS pipeline.

Publish modes (from config.yaml):
  - folder: sync all .md in publish/ folder
  - flag:   scan vault .md for frontmatter publish: true
  - both:   combine folder + flag modes
"""

import os
import re
import json
import shutil
import logging
from pathlib import Path
from datetime import datetime
import yaml

logger = logging.getLogger(__name__)


class SyncConfig:
    """Reads publish + blog config from config.yaml."""

    def __init__(self, config_path: str = "config.yaml"):
        with open(config_path, "r", encoding="utf-8") as f:
            cfg = yaml.safe_load(f)

        self.vault_path = cfg["vault"]["path"]
        self.publish_method = cfg.get("publish", {}).get("method", "both")
        self.publish_folder = cfg.get("publish", {}).get("folder", "publish")
        self.publish_flag = cfg.get("publish", {}).get("flag", "publish")

        # Blog output — resolve relative to project root
        blog_cfg = cfg.get("blog", {})
        self.content_dir = blog_cfg.get("content_dir", "blog/content/posts")

        # Resolve absolute paths
        self.publish_path = os.path.join(self.vault_path, self.publish_folder)

        # Upload log for image link rewriting (Part B)
        assets_dir = cfg.get("vault", {}).get("assets_dir", "_assets")
        self.upload_log_path = os.path.join(
            self.vault_path, assets_dir, ".upload_log.json"
        )

    @property
    def abs_content_dir(self) -> str:
        """Resolve content_dir to absolute path relative to project root."""
        if os.path.isabs(self.content_dir):
            return self.content_dir
        # Assume project root is one level above config.yaml's dir
        return os.path.join(os.getcwd(), self.content_dir)


def _parse_frontmatter(content: str) -> dict:
    """Extract YAML frontmatter from markdown content."""
    if not content.startswith("---"):
        return {}
    end = content.find("---", 3)
    if end == -1:
        return {}
    try:
        return yaml.safe_load(content[3:end]) or {}
    except yaml.YAMLError:
        return {}


def _has_publish_flag(filepath: str, flag_key: str = "publish") -> bool:
    """Check if a markdown file has publish: true in frontmatter."""
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read(2048)  # Only need frontmatter
        fm = _parse_frontmatter(content)
        return fm.get(flag_key) is True
    except (OSError, UnicodeDecodeError):
        return False


def _load_upload_log(log_path: str) -> dict:
    """Load image upload manifest for link rewriting."""
    if not os.path.exists(log_path):
        return {}
    try:
        with open(log_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, OSError):
        return {}


def _rewrite_image_links(content: str, upload_log: dict) -> str:
    """Transform Obsidian image syntax to standard markdown with R2 URLs.

    Rewrites:
      ![[image.png]]        → ![image](R2_URL)
      ![[image.png|600]]    → ![image](R2_URL)
      [[internal-link]]     → removed (non-image wiki links)

    Preserves:
      ![alt](url)           → unchanged (standard markdown)
    """
    # Rewrite ![[image.ext]] and ![[image.ext|size]]
    def replace_obsidian_image(match):
        full = match.group(1)
        # Split on | for resize syntax
        parts = full.split("|")
        filename = parts[0].strip()
        basename = os.path.basename(filename)

        # Look up in upload log
        if basename in upload_log:
            url = upload_log[basename]
            alt = os.path.splitext(basename)[0]
            return f"![{alt}]({url})"

        # Not found — leave as standard markdown with warning
        logger.warning(f"Image not in upload log: {basename}")
        alt = os.path.splitext(basename)[0]
        return f"![{alt}]({filename})"

    content = re.sub(r"!\[\[(.+?)\]\]", replace_obsidian_image, content)

    # Remove non-image wiki links [[internal-link]]
    content = re.sub(r"\[\[(.+?)\]\]", r"\1", content)

    return content


def sync_file(
    source_path: str,
    config: SyncConfig,
    rewrite_links: bool = True,
) -> str | None:
    """Copy a single .md file from vault to blog content dir.

    Args:
        source_path: Absolute path to the source .md file
        config: SyncConfig instance
        rewrite_links: Whether to rewrite Obsidian image links

    Returns:
        Destination path if synced, None if skipped
    """
    if not source_path.endswith(".md"):
        return None

    if not os.path.exists(source_path):
        logger.warning(f"Source not found: {source_path}")
        return None

    # Determine output filename
    filename = os.path.basename(source_path)
    dest_path = os.path.join(config.abs_content_dir, filename)

    # Ensure target directory exists
    os.makedirs(os.path.dirname(dest_path), exist_ok=True)

    # Read content
    with open(source_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Rewrite image links if enabled
    if rewrite_links:
        upload_log = _load_upload_log(config.upload_log_path)
        content = _rewrite_image_links(content, upload_log)

    # Write to blog
    with open(dest_path, "w", encoding="utf-8") as f:
        f.write(content)

    logger.info(f"Synced: {filename} → {dest_path}")
    print(f"📝 Synced: {filename}")
    return dest_path


def remove_synced(source_path: str, config: SyncConfig) -> bool:
    """Remove a synced file from blog content dir.

    Args:
        source_path: Absolute path to the (deleted) source .md file
        config: SyncConfig instance

    Returns:
        True if file was removed, False if not found
    """
    filename = os.path.basename(source_path)
    dest_path = os.path.join(config.abs_content_dir, filename)

    if os.path.exists(dest_path):
        os.remove(dest_path)
        logger.info(f"Removed: {filename} from blog")
        print(f"🗑️  Removed: {filename}")
        return True

    return False


def _collect_publish_files(config: SyncConfig) -> list[str]:
    """Collect all files that should be published based on config method.

    Returns:
        List of absolute paths to .md files that should be synced
    """
    files = set()

    # Folder mode: all .md in publish/ folder
    if config.publish_method in ("folder", "both"):
        if os.path.isdir(config.publish_path):
            for entry in os.scandir(config.publish_path):
                if entry.is_file() and entry.name.endswith(".md"):
                    files.add(entry.path)

    # Flag mode: scan vault for publish: true frontmatter
    if config.publish_method in ("flag", "both"):
        for root, _, filenames in os.walk(config.vault_path):
            # Skip publish folder (already handled) and hidden dirs
            rel = os.path.relpath(root, config.vault_path)
            if rel.startswith(".") or rel.startswith("_"):
                continue
            for fname in filenames:
                if fname.endswith(".md"):
                    fpath = os.path.join(root, fname)
                    if _has_publish_flag(fpath, config.publish_flag):
                        files.add(fpath)

    return sorted(files)


def sync_all(config: SyncConfig) -> int:
    """Full sync: scan vault and sync all publishable files.

    Returns:
        Number of files synced
    """
    files = _collect_publish_files(config)
    count = 0

    for fpath in files:
        result = sync_file(fpath, config)
        if result:
            count += 1

    # Clean up orphaned files in blog that are no longer in vault
    if os.path.isdir(config.abs_content_dir):
        source_basenames = {os.path.basename(f) for f in files}
        for entry in os.scandir(config.abs_content_dir):
            if entry.is_file() and entry.name.endswith(".md"):
                if entry.name not in source_basenames:
                    os.remove(entry.path)
                    logger.info(f"Cleaned orphan: {entry.name}")
                    print(f"🧹 Cleaned orphan: {entry.name}")

    logger.info(f"Sync complete: {count} files")
    print(f"\n✅ Sync complete: {count} file(s)")
    return count


def notify(source_path: str, config: SyncConfig, deleted: bool = False):
    """Event-driven sync trigger (for watcher integration).

    Args:
        source_path: Path to the changed .md file
        config: SyncConfig instance
        deleted: True if file was deleted
    """
    if deleted:
        remove_synced(source_path, config)
    else:
        # Check if file should be published
        should_sync = False

        if config.publish_method in ("folder", "both"):
            if source_path.startswith(config.publish_path):
                should_sync = True

        if config.publish_method in ("flag", "both"):
            if _has_publish_flag(source_path, config.publish_flag):
                should_sync = True

        if should_sync:
            sync_file(source_path, config)
        else:
            # File might have been un-published (flag removed)
            remove_synced(source_path, config)


if __name__ == "__main__":
    import sys

    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(levelname)s - %(message)s",
    )

    try:
        cfg = SyncConfig()
    except Exception as e:
        print(f"❌ Config error: {e}")
        sys.exit(1)

    print(f"📂 Vault: {cfg.vault_path}")
    print(f"📁 Publish folder: {cfg.publish_path}")
    print(f"📄 Blog content: {cfg.abs_content_dir}")
    print(f"🔧 Method: {cfg.publish_method}")
    print()

    count = sync_all(cfg)
