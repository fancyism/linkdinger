"""Type stubs for obsidian_watcher module."""

from typing import Any, Optional

class Config:
    vault_path: str
    assets_dir: str
    r2_endpoint: Optional[str]
    r2_access_key: Optional[str]
    r2_secret_key: Optional[str]
    r2_bucket: Optional[str]
    r2_public_url: Optional[str]
    debounce_sec: float
    formats: list[str]
    output_format: str
    quality: int
    publish_folder: str
    upload_log_path: str
    
    def __init__(self, config_path: str = "config.yaml") -> None: ...
    def _validate(self) -> None: ...

class R2Uploader:
    config: Config
    client: Any
    
    def __init__(self, config: Config) -> None: ...
    def upload(self, file_path: str, remote_key: str) -> str: ...
    def delete(self, remote_key: str) -> bool: ...

class ImageHandler:
    config: Config
    uploader: R2Uploader
    debounce_map: dict[str, float]
    
    def __init__(self, config: Config, uploader: R2Uploader) -> None: ...
    def on_created(self, event: Any) -> None: ...
    def on_modified(self, event: Any) -> None: ...
    def process_image(self, src_path: str) -> None: ...

def create_watcher(config: Config) -> Any: ...
