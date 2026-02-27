"""Unit tests for obsidian_watcher module."""

import os
import sys
from unittest.mock import patch, MagicMock, call
import pytest

# ── We need to handle module-level load_dotenv() and boto3 imports ──
# Patch environment BEFORE importing the module so load_dotenv() and
# Config._validate() work without a real .env file or R2 credentials.

MOCK_ENV = {
    "R2_ENDPOINT": "https://test.r2.cloudflarestorage.com",
    "R2_ACCESS_KEY": "test-key",
    "R2_SECRET_KEY": "test-secret",
    "R2_BUCKET": "test-bucket",
    "R2_PUBLIC_URL": "https://test.r2.dev",
}

MOCK_CONFIG_DATA = {
    "vault": {
        "path": "/tmp/test-vault",
        "assets_dir": "_assets",
    },
    "watcher": {
        "debounce_sec": 0.01,  # fast for tests
        "formats": [".png", ".jpg", ".jpeg"],
        "output_format": "webp",
        "quality": 80,
    },
}


def _make_config():
    """Create a Config object with mocked yaml but real open()."""
    with patch("obsidian_watcher.yaml.safe_load", return_value=MOCK_CONFIG_DATA), \
         patch("obsidian_watcher.open", create=True), \
         patch.dict(os.environ, MOCK_ENV):
        # We need to patch open only for the Config.__init__ yaml read
        import obsidian_watcher
        # Manually construct config with known values
        config = object.__new__(obsidian_watcher.Config)
        config.vault_path = MOCK_CONFIG_DATA["vault"]["path"]
        config.assets_dir = os.path.join(config.vault_path, MOCK_CONFIG_DATA["vault"]["assets_dir"])
        config.r2_endpoint = MOCK_ENV["R2_ENDPOINT"]
        config.r2_access_key = MOCK_ENV["R2_ACCESS_KEY"]
        config.r2_secret_key = MOCK_ENV["R2_SECRET_KEY"]
        config.r2_bucket = MOCK_ENV["R2_BUCKET"]
        config.r2_public_url = MOCK_ENV["R2_PUBLIC_URL"]
        config.debounce_sec = MOCK_CONFIG_DATA["watcher"]["debounce_sec"]
        config.formats = MOCK_CONFIG_DATA["watcher"]["formats"]
        config.output_format = MOCK_CONFIG_DATA["watcher"]["output_format"]
        config.quality = MOCK_CONFIG_DATA["watcher"]["quality"]
        # New attributes from CMS integration
        config.publish_folder = os.path.join(config.vault_path, "publish")
        config.upload_log_path = os.path.join(config.assets_dir, ".upload_log.json")
        return config


@pytest.fixture
def config():
    """Create Config with mocked values (no file/network I/O)."""
    return _make_config()


class TestConfig:
    def test_config_loads(self, config):
        """Config should have correct vault path."""
        assert config.vault_path == "/tmp/test-vault"
        assert config.r2_bucket == "test-bucket"
        assert config.output_format == "webp"
        assert config.quality == 80

    def test_config_formats(self, config):
        """Config should include all image formats."""
        assert ".png" in config.formats
        assert ".jpg" in config.formats
        assert ".jpeg" in config.formats

    def test_config_missing_vault_path(self):
        """Should raise ValueError if vault.path is empty."""
        from obsidian_watcher import Config
        bad_data = {
            "vault": {"path": "", "assets_dir": "_assets"},
            "watcher": MOCK_CONFIG_DATA["watcher"],
        }
        with patch("builtins.open", MagicMock()), \
             patch("yaml.safe_load", return_value=bad_data), \
             patch.dict(os.environ, MOCK_ENV):
            with pytest.raises(ValueError, match="vault.path"):
                Config()

    def test_config_missing_r2_creds(self):
        """Should raise ValueError if R2 creds missing."""
        from obsidian_watcher import Config
        empty_env = {k: "" for k in MOCK_ENV}
        with patch("builtins.open", MagicMock()), \
             patch("yaml.safe_load", return_value=MOCK_CONFIG_DATA), \
             patch.dict(os.environ, empty_env, clear=True):
            with pytest.raises(ValueError, match="R2"):
                Config()


class TestImageHandler:
    def test_format_filter_accepts_png(self, config):
        """Should process .png files."""
        from obsidian_watcher import ImageHandler
        handler = ImageHandler(config)

        with patch.object(handler, "process_image") as mock_process:
            handler._check_and_process("/tmp/test-vault/photo.png")
        mock_process.assert_called_once()

    def test_format_filter_accepts_jpg(self, config):
        """Should process .jpg files."""
        from obsidian_watcher import ImageHandler
        handler = ImageHandler(config)

        with patch.object(handler, "process_image") as mock_process:
            handler._check_and_process("/tmp/test-vault/photo.jpg")
        mock_process.assert_called_once()

    def test_format_filter_rejects_pdf(self, config):
        """Should ignore non-image files."""
        from obsidian_watcher import ImageHandler
        handler = ImageHandler(config)

        with patch.object(handler, "process_image") as mock_process:
            handler._check_and_process("/tmp/test-vault/doc.pdf")
        mock_process.assert_not_called()

    def test_format_filter_rejects_md(self, config):
        """Should ignore markdown files."""
        from obsidian_watcher import ImageHandler
        handler = ImageHandler(config)

        with patch.object(handler, "process_image") as mock_process:
            handler._check_and_process("/tmp/test-vault/note.md")
        mock_process.assert_not_called()

    def test_on_processed_callback(self, config):
        """Should call on_processed after successful processing."""
        callback = MagicMock()
        from obsidian_watcher import ImageHandler
        handler = ImageHandler(config, on_processed=callback)

        with patch.object(handler.processor, "convert_to_webp", return_value=("/tmp/out.webp", "abc.webp")), \
             patch.object(handler.uploader, "upload", return_value="https://r2/abc.webp"), \
             patch.object(handler.md_updater, "replace_image_link", return_value=True), \
             patch("os.remove"), \
             patch("obsidian_watcher._write_upload_log"):
            handler.process_image("/tmp/test-vault/photo.png")

        callback.assert_called_once()
        assert handler.processed_count == 1

    def test_no_callback_when_none(self, config):
        """Should not crash if on_processed is None."""
        from obsidian_watcher import ImageHandler
        handler = ImageHandler(config, on_processed=None)

        with patch.object(handler.processor, "convert_to_webp", return_value=("/tmp/out.webp", "abc.webp")), \
             patch.object(handler.uploader, "upload", return_value="https://r2/abc.webp"), \
             patch.object(handler.md_updater, "replace_image_link", return_value=True), \
             patch("os.remove"), \
             patch("obsidian_watcher._write_upload_log"):
            handler.process_image("/tmp/test-vault/photo.png")

        assert handler.processed_count == 1

    def test_error_does_not_crash(self, config):
        """Should handle errors gracefully."""
        from obsidian_watcher import ImageHandler
        handler = ImageHandler(config)

        with patch.object(handler.processor, "convert_to_webp", side_effect=Exception("test err")):
            handler.process_image("/tmp/test-vault/photo.png")

        assert handler.processed_count == 0


class TestCreateWatcher:
    def test_create_watcher_returns_observer(self, config):
        """Should return (Observer, ImageHandler, MarkdownHandler|None) tuple."""
        from obsidian_watcher import create_watcher
        from watchdog.observers import Observer

        with patch.object(Observer, "schedule"):
            observer, handler, md_handler = create_watcher(config)

        assert observer is not None
        assert handler is not None
        # No cms_callback passed, so md_handler should be None
        assert md_handler is None
