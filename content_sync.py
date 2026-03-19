"""
Content Sync: Syncs markdown files from Obsidian vault to blog.

Part of the Linkdinger CMS pipeline.

Publish modes (from config.yaml):
  - folder: sync all .md in publish/ folder
  - flag:   scan vault .md for frontmatter publish: true
  - both:   combine folder + flag modes
"""

import hashlib
import json
import logging
import os
import re
from collections import defaultdict
from datetime import date, datetime, timezone
from typing import Any, Optional

import yaml  # type: ignore[import-untyped]
from dotenv import load_dotenv  # type: ignore[import-untyped]

from translation_service import (
    OpenAITranslator,
    TranslationError,
    TranslationRequest,
)

load_dotenv()

logger = logging.getLogger(__name__)
REQUIRED_FRONTMATTER_FIELDS = ("title", "date")
PUBLISH_AT_FIELD = "publishAt"
DEFAULT_CONTENT_LOCALE = "en"
INTERNAL_SYNC_SOURCE_ID_FIELD = "_syncSourceId"
TRANSLATION_FLAG_DEFAULT = "autoTranslate"


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

        # Blog output â€” resolve relative to project root
        blog_cfg = cfg.get("blog", {})
        self.content_dir = blog_cfg.get("content_dir", "blog/content/posts")

        # Resolve absolute paths
        self.publish_path = os.path.join(self.vault_path, self.publish_folder)

        # Upload log for image link rewriting (Part B)
        assets_dir = cfg.get("vault", {}).get("assets_dir", "_assets")
        self.upload_log_path = os.path.join(self.vault_path, assets_dir, ".upload_log.json")

        translation_cfg = cfg.get("translation", {})
        self.translation_enabled = bool(translation_cfg.get("enabled", False))
        self.translation_provider = str(translation_cfg.get("provider", "openai")).lower()
        model_from_env = os.getenv("OPENAI_TRANSLATION_MODEL")
        self.translation_model = str(translation_cfg.get("model") or model_from_env or "gpt-5-mini")
        self.translation_frontmatter_flag = str(
            translation_cfg.get("frontmatter_flag", TRANSLATION_FLAG_DEFAULT)
        )
        self.translation_require_review = bool(translation_cfg.get("require_review", True))
        self.translation_overwrite_machine = bool(
            translation_cfg.get("overwrite_machine_translations", True)
        )
        raw_targets = translation_cfg.get("targets", {})
        self.translation_targets = {
            _normalize_locale_value(locale): [
                _normalize_locale_value(target)
                for target in targets
                if _normalize_locale_value(target)
            ]
            for locale, targets in raw_targets.items()
            if isinstance(targets, list)
        }

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


def _split_frontmatter_content(content: str) -> tuple[dict[str, Any], str]:
    """Split markdown into frontmatter dict and body text."""
    if not content.startswith("---"):
        return {}, content

    end = content.find("---", 3)
    if end == -1:
        return {}, content

    frontmatter = _parse_frontmatter(content)
    body = content[end + 3 :].lstrip("\r\n")
    return frontmatter, body


def _render_markdown(frontmatter: dict[str, Any], body: str) -> str:
    """Serialize frontmatter + body back into a markdown document."""
    frontmatter_block = yaml.safe_dump(
        frontmatter,
        allow_unicode=True,
        sort_keys=False,
    ).strip()

    body_block = body.lstrip("\r\n")
    if body_block:
        return f"---\n{frontmatter_block}\n---\n\n{body_block}\n"
    return f"---\n{frontmatter_block}\n---\n"


def _normalize_source_relative_path(source_path: str, config: SyncConfig) -> str:
    """Build a stable vault-relative path for sync bookkeeping."""
    try:
        relative_path = os.path.relpath(source_path, config.vault_path)
    except ValueError:
        relative_path = source_path
    return relative_path.replace("\\", "/")


def _build_source_identifier(source_path: str, config: SyncConfig) -> str:
    """Hash the source-relative path so synced artifacts can be tracked safely."""
    relative_path = _normalize_source_relative_path(source_path, config)
    return hashlib.sha1(relative_path.encode("utf-8")).hexdigest()[:16]


def _default_translation_key(source_path: str) -> str:
    """Derive a stable translation key from the source filename."""
    stem = os.path.splitext(os.path.basename(source_path))[0].strip().lower()
    normalized = re.sub(r"[^\w]+", "-", stem, flags=re.UNICODE).strip("-")
    return normalized or stem or "post"


def _resolve_target_locales(
    frontmatter: dict[str, Any],
    config: SyncConfig,
    source_locale: str,
) -> list[str]:
    """Determine which locales should be generated from a source post."""
    if not config.translation_enabled:
        return []

    raw_flag = frontmatter.get(config.translation_frontmatter_flag)
    if raw_flag in (None, False, "", []):
        return []

    if raw_flag is True:
        raw_targets: list[object] = config.translation_targets.get(source_locale, [])
    elif isinstance(raw_flag, str):
        lowered = raw_flag.strip().lower()
        if lowered in {"true", "yes", "on"}:
            raw_targets = config.translation_targets.get(source_locale, [])
        else:
            raw_targets = [raw_flag]
    elif isinstance(raw_flag, list):
        raw_targets = raw_flag
    else:
        return []

    targets = []
    for target in raw_targets:
        locale = _normalize_locale_value(target)
        if locale and locale != source_locale and locale not in targets:
            targets.append(locale)

    return targets


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
    frontmatter = _read_frontmatter_from_file(filepath)
    locale = str(frontmatter.get("locale") or DEFAULT_CONTENT_LOCALE).lower()
    return f"{locale}:{os.path.splitext(basename)[0].lower()}"


def _normalize_locale_value(value: object) -> str:
    """Normalize locale values from frontmatter."""
    if isinstance(value, str) and value.strip():
        return value.strip().lower()
    return DEFAULT_CONTENT_LOCALE


def _resolve_output_relative_path(source_path: str) -> str:
    """Resolve the locale-aware relative output path for a markdown file."""
    frontmatter = _read_frontmatter_from_file(source_path)
    locale = _normalize_locale_value(frontmatter.get("locale"))
    return os.path.join(locale, os.path.basename(source_path))


def _resolve_output_path(source_path: str, config: SyncConfig) -> str:
    """Resolve the absolute locale-aware output path for a markdown file."""
    return os.path.join(
        config.abs_content_dir,
        _resolve_output_relative_path(source_path),
    )


def _resolve_output_path_for_locale(
    filename: str,
    locale: str,
    config: SyncConfig,
) -> str:
    """Resolve a locale-aware output path using an explicit filename + locale."""
    return os.path.join(config.abs_content_dir, locale, filename)


def _get_managed_output_paths(
    source_path: str,
    config: SyncConfig,
) -> list[str]:
    """Find synced markdown outputs that belong to a specific source file."""
    source_id = _build_source_identifier(source_path, config)
    managed_paths: list[str] = []

    if not os.path.isdir(config.abs_content_dir):
        return managed_paths

    for root, _, filenames in os.walk(config.abs_content_dir):
        for filename in filenames:
            if not filename.endswith(".md"):
                continue
            candidate_path = os.path.join(root, filename)
            try:
                with open(candidate_path, "r", encoding="utf-8") as handle:
                    candidate_frontmatter = _parse_frontmatter(handle.read(2048))
            except (OSError, UnicodeDecodeError):
                continue

            if candidate_frontmatter.get(INTERNAL_SYNC_SOURCE_ID_FIELD) == source_id:
                managed_paths.append(candidate_path)

    return managed_paths


def _build_synced_frontmatter(
    frontmatter: dict[str, Any],
    source_path: str,
    config: SyncConfig,
) -> dict[str, Any]:
    """Attach sync metadata and normalize locale pairing fields."""
    normalized = dict(frontmatter)
    locale = _normalize_locale_value(normalized.get("locale"))
    normalized["locale"] = locale
    normalized["translationKey"] = str(
        normalized.get("translationKey") or _default_translation_key(source_path)
    )
    normalized["canonicalLocale"] = str(normalized.get("canonicalLocale") or locale).lower()
    normalized[INTERNAL_SYNC_SOURCE_ID_FIELD] = _build_source_identifier(source_path, config)
    return normalized


def _create_translator(config: SyncConfig) -> OpenAITranslator:
    """Create the configured translation client."""
    if config.translation_provider != "openai":
        raise TranslationError(f"Unsupported translation provider: {config.translation_provider}")

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise TranslationError("OPENAI_API_KEY is not set.")

    return OpenAITranslator(api_key=api_key, model=config.translation_model)


def _build_translation_request(
    frontmatter: dict[str, Any],
    body: str,
    source_locale: str,
    target_locale: str,
) -> TranslationRequest:
    """Prepare the structured translation payload from normalized markdown."""
    return TranslationRequest(
        source_locale=source_locale,
        target_locale=target_locale,
        title=str(frontmatter.get("title") or "").strip(),
        excerpt=str(frontmatter.get("excerpt") or "").strip(),
        category=str(frontmatter.get("category")).strip() if frontmatter.get("category") else None,
        tags=[str(tag).strip() for tag in frontmatter.get("tags", []) if str(tag).strip()],
        body=body,
        faq=frontmatter.get("faq") if isinstance(frontmatter.get("faq"), list) else None,
        how_to=frontmatter.get("howTo") if isinstance(frontmatter.get("howTo"), list) else None,
    )


def _should_write_translation(
    dest_path: str,
    source_id: str,
    config: SyncConfig,
) -> bool:
    """Protect human-edited locale files from being overwritten by automation."""
    if not os.path.exists(dest_path):
        return True

    try:
        with open(dest_path, "r", encoding="utf-8") as handle:
            existing_frontmatter = _parse_frontmatter(handle.read(2048))
    except (OSError, UnicodeDecodeError):
        return False

    existing_source_id = existing_frontmatter.get(INTERNAL_SYNC_SOURCE_ID_FIELD)
    if existing_source_id == source_id:
        if not existing_frontmatter.get("machineTranslated", False):
            return False
        return config.translation_overwrite_machine

    return False


def _write_translated_post(
    source_path: str,
    source_frontmatter: dict[str, Any],
    source_body: str,
    config: SyncConfig,
    target_locale: str,
) -> str | None:
    """Translate a post and write the generated locale sibling to disk."""
    translator = _create_translator(config)
    translation_request = _build_translation_request(
        frontmatter=source_frontmatter,
        body=source_body,
        source_locale=_normalize_locale_value(source_frontmatter.get("locale")),
        target_locale=target_locale,
    )
    translated = translator.translate_markdown(translation_request)

    translated_frontmatter = dict(source_frontmatter)
    translated_frontmatter["locale"] = target_locale
    translated_frontmatter["title"] = translated.title
    translated_frontmatter["excerpt"] = translated.excerpt
    translated_frontmatter["canonicalLocale"] = str(
        source_frontmatter.get("canonicalLocale")
        or _normalize_locale_value(source_frontmatter.get("locale"))
    ).lower()
    translated_frontmatter["machineTranslated"] = True
    translated_frontmatter["needsReview"] = config.translation_require_review
    translated_frontmatter["translatedFromLocale"] = _normalize_locale_value(
        source_frontmatter.get("locale")
    )
    translated_frontmatter[config.translation_frontmatter_flag] = False

    if translated.category:
        translated_frontmatter["category"] = translated.category
    elif "category" in translated_frontmatter:
        translated_frontmatter.pop("category", None)

    translated_frontmatter["tags"] = translated.tags or []

    if translated.faq is not None:
        translated_frontmatter["faq"] = translated.faq
    elif "faq" in translated_frontmatter:
        translated_frontmatter.pop("faq", None)

    if translated.how_to is not None:
        translated_frontmatter["howTo"] = translated.how_to
    elif "howTo" in translated_frontmatter:
        translated_frontmatter.pop("howTo", None)

    dest_path = _resolve_output_path_for_locale(
        filename=os.path.basename(source_path),
        locale=target_locale,
        config=config,
    )
    source_id = str(source_frontmatter.get(INTERNAL_SYNC_SOURCE_ID_FIELD))
    if not _should_write_translation(dest_path, source_id, config):
        logger.warning(
            "Skipping auto-translation overwrite for %s -> %s",
            os.path.basename(source_path),
            dest_path,
        )
        return None

    os.makedirs(os.path.dirname(dest_path), exist_ok=True)
    translated_content = _render_markdown(translated_frontmatter, translated.body)
    with open(dest_path, "w", encoding="utf-8") as handle:
        handle.write(translated_content)

    logger.info("Translated: %s -> %s", os.path.basename(source_path), dest_path)
    print(f"Translated: {os.path.basename(source_path)} -> {target_locale}")
    return dest_path


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
        dest_path = _resolve_output_path(source_path, config)
        if not os.path.exists(dest_path):
            return True

    return False


def _log_validation_errors(errors: dict[str, list[str]]):
    """Log validation errors in a readable grouped format."""
    for source_path, issues in errors.items():
        filename = os.path.basename(source_path)
        logger.error(f"Validation failed: {filename}")
        print(f"âŒ Validation failed: {filename}")
        for issue in issues:
            logger.error(f"  - {issue}")
            print(f"   - {issue}")


def _rewrite_links(content: str, upload_log: dict) -> str:
    """Transform Obsidian image syntax and wiki-links to standard markdown.

    Rewrites:
      ![[image.png]]        â†’ ![image](R2_URL)
      ![[image.png|600]]    â†’ ![image](R2_URL)
      [[Page Name]]         â†’ [Page Name](/blog/page%20name)
      [[Page Name|Alias]]   â†’ [Alias](/blog/page%20name)

    Preserves:
      ![alt](url)           â†’ unchanged (standard markdown)
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

        # Not found â€” leave as standard markdown with warning
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
            frontmatter = content[: end_idx + 3]  # type: ignore[index]
            body_content = content[end_idx + 3 :]  # type: ignore[index]

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
                flags=re.IGNORECASE,
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
    dest_path = _resolve_output_path(source_path, config)

    # Ensure target directory exists
    os.makedirs(os.path.dirname(dest_path), exist_ok=True)

    # Read content
    with open(source_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Rewrite image and wiki links if enabled
    if rewrite_links:
        upload_log = _load_upload_log(config.upload_log_path)
        content = _rewrite_links(content, upload_log)

    frontmatter, body = _split_frontmatter_content(content)
    synced_frontmatter = _build_synced_frontmatter(frontmatter, source_path, config)
    content = _render_markdown(synced_frontmatter, body)

    # Write to blog
    with open(dest_path, "w", encoding="utf-8") as f:
        f.write(content)

    logger.info(f"Synced: {filename} -> {dest_path}")
    print(f"Synced: {filename}")

    # Log to dashboard activity log
    try:
        from dashboard import log_activity  # type: ignore[import-untyped]

        log_activity(
            "cms",
            f"Synced {filename}",
            f"-> blog/content/posts/{_resolve_output_relative_path(source_path)}",
        )
    except ImportError:
        pass

    target_locales = _resolve_target_locales(
        synced_frontmatter,
        config,
        _normalize_locale_value(synced_frontmatter.get("locale")),
    )
    for target_locale in target_locales:
        try:
            translated_path = _write_translated_post(
                source_path=source_path,
                source_frontmatter=synced_frontmatter,
                source_body=body,
                config=config,
                target_locale=target_locale,
            )
        except TranslationError as exc:
            logger.warning(
                "Auto-translation skipped for %s -> %s: %s",
                filename,
                target_locale,
                exc,
            )
            print(f"Translation skipped for {filename} -> {target_locale}: {exc}")
            break

        if translated_path:
            try:
                from dashboard import log_activity  # type: ignore[import-untyped]

                log_activity(
                    "cms",
                    f"Translated {filename}",
                    f"-> blog/content/posts/{target_locale}/{filename}",
                )
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
    managed_paths = _get_managed_output_paths(source_path, config)
    if not managed_paths:
        return False

    filename = os.path.basename(source_path)
    for dest_path in managed_paths:
        os.remove(dest_path)
        logger.info(f"Removed: {dest_path} from blog")

    print(f"ðŸ—‘ï¸  Removed: {filename}")
    return True


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


def _get_expected_output_paths_for_source(
    source_path: str,
    config: SyncConfig,
) -> set[str]:
    """Compute every managed output path that should exist for a source file."""
    expected_paths = {os.path.normpath(_resolve_output_path(source_path, config))}
    frontmatter = _read_frontmatter_from_file(source_path)
    normalized_frontmatter = _build_synced_frontmatter(frontmatter, source_path, config)
    source_locale = _normalize_locale_value(normalized_frontmatter.get("locale"))

    for target_locale in _resolve_target_locales(
        normalized_frontmatter,
        config,
        source_locale,
    ):
        expected_paths.add(
            os.path.normpath(
                _resolve_output_path_for_locale(
                    filename=os.path.basename(source_path),
                    locale=target_locale,
                    config=config,
                )
            )
        )

    return expected_paths


def sync_all(config: SyncConfig, now: datetime | None = None) -> int:
    """Full sync: scan vault and sync all publishable files.

    Returns:
        Number of files synced
    """
    files = _collect_publish_files(config)
    valid_files, errors = validate_publish_files(files, config)
    if errors:
        _log_validation_errors(errors)
        print(f"\nâš ï¸  Validation skipped {len(errors)} file(s)")
    due_files, scheduled_future, _ = _partition_files_by_publish_time(valid_files, now=now)
    if scheduled_future:
        next_publish_at = min(scheduled_future.values()).isoformat()
        logger.info(f"Scheduled posts pending: {len(scheduled_future)} (next at {next_publish_at})")

    count = 0

    for fpath in due_files:
        result = sync_file(fpath, config, validate=False, now=now)
        if result:
            count += 1  # type: ignore[operator]

    # Clean up orphaned files in blog that are no longer in vault
    if os.path.isdir(config.abs_content_dir):
        expected_paths: set[str] = set()
        for source_path in due_files:
            expected_paths.update(_get_expected_output_paths_for_source(source_path, config))

        for root, _, filenames in os.walk(config.abs_content_dir):
            for filename in filenames:
                if not filename.endswith(".md"):
                    continue
                file_path = os.path.normpath(os.path.join(root, filename))
                if file_path not in expected_paths:
                    os.remove(file_path)
                    logger.info(f"Cleaned orphan: {file_path}")
                    print(f"Cleaned orphan: {filename}")

    logger.info(f"Sync complete: {count} files")
    print(f"\nâœ… Sync complete: {count} file(s)")
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
        print(f"âŒ Config error: {e}")
        sys.exit(1)

    print(f"ðŸ“‚ Vault: {cfg.vault_path}")
    print(f"ðŸ“ Publish folder: {cfg.publish_path}")
    print(f"ðŸ“„ Blog content: {cfg.abs_content_dir}")
    print(f"ðŸ”§ Method: {cfg.publish_method}")
    print()

    count = sync_all(cfg)
