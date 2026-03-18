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
import logging
from collections import defaultdict
from datetime import date, datetime, timezone
from typing import Any, Optional

import yaml  # type: ignore[import-untyped]

logger = logging.getLogger(__name__)
REQUIRED_FRONTMATTER_FIELDS = ("title", "date")
PUBLISH_AT_FIELD = "publishAt"


class SyncConfig:
    """Reads publish + blog config from config.yaml."""

    def __init__(self, config_path: str = "config.yaml"):
        with open(config_path, "r", encoding="utf-8") as f:
            cfg = yaml.safe_load(f)

        self.vault_path = cfg["vault"]["path"]
        publish_cfg = cfg.get("publish", {})
        self.publish_method = publish_cfg.get("method", "both")
        self.publish_folder = publish_cfg.get("folder", "publish")
        self.publish_flag = publish_cfg.get("flag", "publish")
        try:
            schedule_sec = int(publish_cfg.get("schedule_check_sec", 60))
        except (TypeError, ValueError):
            schedule_sec = 60
        self.schedule_check_sec = max(5, schedule_sec)

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


def _parse_frontmatter(content: str) -> dict[str, Any]:
    """Extract YAML frontmatter from markdown content."""
    if not content.startswith("---"):
        return {}
    end = content.find("---", 3)
    if end == -1:
        return {}
    try:
        result: Any = yaml.safe_load(content[3:end])  # type: ignore[index]
        return result if result is not None else {}
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


def _is_valid_frontmatter_date(value: object) -> bool:
    """Validate frontmatter date values for publishable posts."""
    if isinstance(value, (date, datetime)):
        return True
    if not isinstance(value, str) or not value.strip():
        return False
    try:
        datetime.fromisoformat(value.replace("Z", "+00:00"))  # type: ignore[union-attr]
        return True
    except ValueError:
        return False


def _local_timezone():
    tz = datetime.now().astimezone().tzinfo
    return tz if tz is not None else timezone.utc


def _as_utc(value: datetime | None = None) -> datetime:
    """Normalize datetime values to timezone-aware UTC."""
    if value is None:
        return datetime.now(timezone.utc)
    if value.tzinfo is None:
        return value.replace(tzinfo=_local_timezone()).astimezone(timezone.utc)
    return value.astimezone(timezone.utc)


def _parse_datetime_value(value: object) -> datetime | None:
    """Parse date/datetime frontmatter values as UTC datetimes."""
    if isinstance(value, datetime):
        parsed = value
    elif isinstance(value, date):
        parsed = datetime.combine(value, datetime.min.time())
    elif isinstance(value, str):
        raw = value.strip()
        if not raw:
            return None
        try:
            parsed = datetime.fromisoformat(raw.replace("Z", "+00:00"))
        except ValueError:
            return None
    else:
        return None

    return _as_utc(parsed)


def _read_frontmatter_from_file(source_path: str) -> dict:
    """Read and parse markdown frontmatter for a source file."""
    if not os.path.exists(source_path):
        return {}
    try:
        with open(source_path, "r", encoding="utf-8") as f:
            return _parse_frontmatter(f.read())
    except (OSError, UnicodeDecodeError):
        return {}


def _is_source_due_for_publish(
    source_path: str,
    now: datetime | None = None,
) -> tuple[bool, datetime | None]:
    """Check if source is due to publish based on publishAt."""
    frontmatter = _read_frontmatter_from_file(source_path)
    publish_at_raw = frontmatter.get(PUBLISH_AT_FIELD)
    if publish_at_raw is None:
        return True, None

    publish_at = _parse_datetime_value(publish_at_raw)
    if publish_at is None:
        # Validation handles invalid values.
        return True, None

    return _as_utc(now) >= publish_at, publish_at


def _partition_files_by_publish_time(
    files: list[str],
    now: datetime | None = None,
) -> tuple[list[str], dict[str, datetime], list[str]]:
    """Split files into due, future scheduled, and due scheduled files."""
    due_files: list[str] = []
    scheduled_future: dict[str, datetime] = {}
    due_scheduled: list[str] = []

    for source_path in files:
        is_due, publish_at = _is_source_due_for_publish(source_path, now=now)
        if publish_at is None:
            due_files.append(source_path)
            continue

        if is_due:
            due_files.append(source_path)
            due_scheduled.append(source_path)
        else:
            scheduled_future[source_path] = publish_at

    return due_files, scheduled_future, due_scheduled


def _extract_obsidian_image_basenames(content: str) -> list[str]:
    """Extract image file basenames from Obsidian embed syntax."""
    basenames: list[str] = []
    for full in re.findall(r"!\[\[(.+?)\]\]", content):
        filename = full.split("|", 1)[0].strip()
        basename = os.path.basename(filename)
        if basename:
            basenames.append(basename)
    return basenames


def _slug_key_from_path(filepath: str) -> str:
    """Normalize post slug key from markdown filename."""
    basename = os.path.basename(filepath)
    return os.path.splitext(basename)[0].lower()


def validate_file_for_publish(
    source_path: str,
    config: SyncConfig,
    upload_log: dict | None = None,
) -> list[str]:
    """Return validation errors for a candidate publish file."""
    issues: list[str] = []
    if not source_path.endswith(".md"):
        return ["file is not markdown (.md)"]
    if not os.path.exists(source_path):
        return ["source file does not exist"]

    try:
        with open(source_path, "r", encoding="utf-8") as f:
            content = f.read()
    except OSError as e:
        return [f"cannot read source file: {e}"]

    frontmatter = _parse_frontmatter(content)
    for key in REQUIRED_FRONTMATTER_FIELDS:
        value = frontmatter.get(key)
        if value is None or (isinstance(value, str) and not value.strip()):
            issues.append(f"missing required frontmatter: {key}")

    if "date" in frontmatter and not _is_valid_frontmatter_date(frontmatter["date"]):
        issues.append("invalid frontmatter date (expected ISO-8601)")

    publish_at_raw = frontmatter.get(PUBLISH_AT_FIELD)
    if publish_at_raw is not None and _parse_datetime_value(publish_at_raw) is None:
        issues.append("invalid frontmatter publishAt (expected ISO-8601 datetime)")

    if upload_log is None:
        upload_log = _load_upload_log(config.upload_log_path)

    missing_images = sorted(
        {
            basename
            for basename in _extract_obsidian_image_basenames(content)
            if basename not in upload_log
        }
    )
    for basename in missing_images:
        issues.append(f"image not found in upload log: {basename}")

    return issues


def validate_publish_files(
    files: list[str],
    config: SyncConfig,
) -> tuple[list[str], dict[str, list[str]]]:
    """Validate publish candidates and return (valid_files, errors)."""
    errors: dict[str, list[str]] = {}
    upload_log = _load_upload_log(config.upload_log_path)

    slug_to_paths: dict[str, list[str]] = defaultdict(list)
    for source_path in files:
        slug_to_paths[_slug_key_from_path(source_path)].append(source_path)
        issues = validate_file_for_publish(
            source_path=source_path,
            config=config,
            upload_log=upload_log,
        )
        if issues:
            errors[source_path] = issues

    for slug, paths in slug_to_paths.items():
        if len(paths) > 1:
            for path in paths:
                errs = errors.setdefault(path, [])
                errs.append(f"duplicate slug '{slug}' from multiple files")

    valid_files = [f for f in files if f not in errors]
    return valid_files, errors


def has_due_scheduled_posts(config: SyncConfig, now: datetime | None = None) -> bool:
    """Return True when any scheduled post is due and not yet synced."""
    files = _collect_publish_files(config)
    valid_files, _ = validate_publish_files(files, config)
    _, _, due_scheduled = _partition_files_by_publish_time(valid_files, now=now)

    for source_path in due_scheduled:
        dest_path = os.path.join(
            config.abs_content_dir,
            os.path.basename(source_path),
        )
        if not os.path.exists(dest_path):
            return True

    return False


def _log_validation_errors(errors: dict[str, list[str]]):
    """Log validation errors in a readable grouped format."""
    for source_path, issues in errors.items():
        filename = os.path.basename(source_path)
        logger.error(f"Validation failed: {filename}")
        print(f"❌ Validation failed: {filename}")
        for issue in issues:
            logger.error(f"  - {issue}")
            print(f"   - {issue}")


def _rewrite_links(content: str, upload_log: dict) -> str:
    """Transform Obsidian image syntax and wiki-links to standard markdown.

    Rewrites:
      ![[image.png]]        → ![image](R2_URL)
      ![[image.png|600]]    → ![image](R2_URL)
      [[Page Name]]         → [Page Name](/blog/page%20name)
      [[Page Name|Alias]]   → [Alias](/blog/page%20name)

    Preserves:
      ![alt](url)           → unchanged (standard markdown)
    """
    import urllib.parse
    
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

    # Process non-image wiki links: [[Filename]] or [[Filename|Alias]]
    def replace_wiki_link(match):
        inner = match.group(1)
        if "|" in inner:
            filename, alias = inner.split("|", 1)
        else:
            filename, alias = inner, inner
            
        # URL encode the stripped filename for the next.js link
        # Our blog routing expects the raw filename (e.g. My%20Page) as the slug
        url_path = urllib.parse.quote(filename.strip())
        return f"[{alias.strip()}](/blog/{url_path})"

    content = re.sub(r"\[\[(.+?)\]\]", replace_wiki_link, content)
    
    # Process YAML frontmatter coverImage replacements
    if content.startswith("---"):
        end_idx = content.find("---", 3)
        if end_idx != -1:
            frontmatter = content[:end_idx+3]  # type: ignore[index]
            body_content = content[end_idx+3:]  # type: ignore[index]
            
            # Find coverImage: "[[filename]]" or just "filename"
            def replace_cover_image(match):
                prefix = match.group(1)
                img_val = match.group(2)
                suffix = match.group(3)
                
                # Strip [[ ]] if present
                clean_img_val = img_val
                if clean_img_val.startswith("[[") and clean_img_val.endswith("]]"):
                    clean_img_val = clean_img_val[2:-2]
                    
                basename = os.path.basename(clean_img_val)
                if basename in upload_log:
                    url = upload_log[basename]
                    return f"{prefix}{url}{suffix}"
                return match.group(0)
                
            new_frontmatter = re.sub(
                r'(coverImage:\s*["\']?)((?:\[\[)?.*?([^"\']+\.(?:png|jpe?g|webp|gif))(?:\]\])?)(["\']?)',
                replace_cover_image,
                frontmatter,
                flags=re.IGNORECASE
            )
            content = new_frontmatter + body_content

    return content


def sync_file(
    source_path: str,
    config: SyncConfig,
    rewrite_links: bool = True,
    validate: bool = True,
    now: datetime | None = None,
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

    if validate:
        issues = validate_file_for_publish(source_path, config)
        if issues:
            _log_validation_errors({source_path: issues})
            return None

    is_due, publish_at = _is_source_due_for_publish(source_path, now=now)
    if not is_due:
        logger.info(
            f"Scheduled post pending: {os.path.basename(source_path)} "
            f"(publishAt: {publish_at.isoformat() if publish_at else 'unknown'})"
        )
        return None

    # Determine output filename
    filename = os.path.basename(source_path)
    dest_path = os.path.join(config.abs_content_dir, filename)

    # Ensure target directory exists
    os.makedirs(os.path.dirname(dest_path), exist_ok=True)

    # Read content
    with open(source_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Rewrite image and wiki links if enabled
    if rewrite_links:
        upload_log = _load_upload_log(config.upload_log_path)
        content = _rewrite_links(content, upload_log)

    # Write to blog
    with open(dest_path, "w", encoding="utf-8") as f:
        f.write(content)

    logger.info(f"Synced: {filename} → {dest_path}")
    print(f"📝 Synced: {filename}")

    # Log to dashboard activity log
    try:
        from dashboard import log_activity  # type: ignore[import-untyped]
        log_activity("cms", f"Synced {filename}", "→ blog/content/posts")
    except ImportError:
        pass

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


def sync_all(config: SyncConfig, now: datetime | None = None) -> int:
    """Full sync: scan vault and sync all publishable files.

    Returns:
        Number of files synced
    """
    files = _collect_publish_files(config)
    valid_files, errors = validate_publish_files(files, config)
    if errors:
        _log_validation_errors(errors)
        print(f"\n⚠️  Validation skipped {len(errors)} file(s)")
    due_files, scheduled_future, _ = _partition_files_by_publish_time(
        valid_files, now=now
    )
    if scheduled_future:
        next_publish_at = min(scheduled_future.values()).isoformat()
        logger.info(
            f"Scheduled posts pending: {len(scheduled_future)} "
            f"(next at {next_publish_at})"
        )

    count = 0

    for fpath in due_files:
        result = sync_file(fpath, config, validate=False, now=now)
        if result:
            count += 1  # type: ignore[operator]

    # Clean up orphaned files in blog that are no longer in vault
    if os.path.isdir(config.abs_content_dir):
        source_basenames = {os.path.basename(f) for f in due_files}
        for entry in os.scandir(config.abs_content_dir):
            if entry.is_file() and entry.name.endswith(".md"):
                if entry.name not in source_basenames:
                    os.remove(entry.path)
                    logger.info(f"Cleaned orphan: {entry.name}")
                    print(f"🧹 Cleaned orphan: {entry.name}")

    logger.info(f"Sync complete: {count} files")
    print(f"\n✅ Sync complete: {count} file(s)")
    return count


def notify(
    source_path: str,
    config: SyncConfig,
    deleted: bool = False,
    now: datetime | None = None,
):
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
            is_due, publish_at = _is_source_due_for_publish(source_path, now=now)
            if is_due:
                sync_file(source_path, config, now=now)
            else:
                logger.info(
                    f"Scheduled post not due yet: {os.path.basename(source_path)} "
                    f"(publishAt: {publish_at.isoformat() if publish_at else 'unknown'})"
                )
                remove_synced(source_path, config)
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
