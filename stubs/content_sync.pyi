"""Type stubs for content_sync module."""

from typing import Any, Optional
from dataclasses import dataclass
from pathlib import Path

@dataclass
class SyncConfig:
    """Configuration for content sync."""
    vault_path: str
    publish_folder: str
    blog_content_path: str
    assets_path: str
    upload_log_path: str
    publish_method: str  # "folder", "flag", or "both"
    
@dataclass  
class SyncResult:
    """Result of a sync operation."""
    success: bool
    posts_published: int
    posts_skipped: int
    errors: list[str]

def has_due_scheduled_posts(vault_path: str, publish_folder: str) -> bool:
    """Check if there are scheduled posts due for publishing."""
    ...

def notify(message: str, level: str = "info") -> None:
    """Send notification."""
    ...

def sync_all(
    vault_path: str,
    publish_folder: str,
    blog_content_path: str,
    assets_path: str,
    upload_log_path: str,
    publish_method: str = "folder",
    dry_run: bool = False,
) -> SyncResult:
    """Sync all content from vault to blog."""
    ...

def validate_post(
    post_path: Path,
    upload_log_path: str,
) -> tuple[bool, list[str]]:
    """Validate a post for publishing."""
    ...

def process_markdown(
    content: str,
    upload_log: dict[str, str],
) -> tuple[str, list[str]]:
    """Process markdown content and replace image links."""
    ...
