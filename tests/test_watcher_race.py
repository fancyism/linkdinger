"""
Complex unit tests — obsidian_watcher.py race conditions & edge cases.
Focus: concurrent file events, slow I/O error recovery, upload failure,
       callback timing guarantees.

Model: Claude Opus 4 (complex — concurrent state + mocked filesystem)
Run:   python -m pytest tests/test_watcher_race.py -v
"""

import os
import threading
from unittest.mock import patch, MagicMock
import pytest

# ─── Shared mock helpers ─────────────────────────────────────────

def _make_config():
    """Build a minimal Config-like object without file/network I/O."""
    cfg = MagicMock()
    cfg.vault_path      = "/tmp/test-vault"
    cfg.assets_dir      = "/tmp/test-vault/_assets"
    cfg.r2_endpoint     = "https://test.r2.cloudflarestorage.com"
    cfg.r2_access_key   = "test-key"
    cfg.r2_secret_key   = "test-secret"
    cfg.r2_bucket       = "test-bucket"
    cfg.r2_public_url   = "https://test.r2.dev"
    cfg.debounce_sec    = 0.01
    cfg.formats         = [".png", ".jpg", ".jpeg"]
    cfg.output_format   = "webp"
    cfg.quality         = 80
    cfg.publish_folder  = "/tmp/test-vault/publish"
    cfg.upload_log_path = "/tmp/test-vault/_assets/.upload_log.json"
    return cfg


@pytest.fixture
def config():
    return _make_config()


@pytest.fixture
def handler(config):
    from obsidian_watcher import ImageHandler
    return ImageHandler(config)


# ─── _check_and_process: format filtering ────────────────────────

class TestCheckAndProcess:
    """
    _check_and_process sleeps debounce_sec then delegates to process_image.
    It must filter by extension first.
    """

    def test_accepts_png(self, handler):
        with patch.object(handler, "process_image") as mock_proc:
            with patch("obsidian_watcher.time.sleep"):
                handler._check_and_process("/tmp/vault/photo.png")
        mock_proc.assert_called_once_with("/tmp/vault/photo.png")

    def test_accepts_jpg(self, handler):
        with patch.object(handler, "process_image") as mock_proc:
            with patch("obsidian_watcher.time.sleep"):
                handler._check_and_process("/tmp/vault/photo.jpg")
        mock_proc.assert_called_once()

    def test_rejects_pdf(self, handler):
        with patch.object(handler, "process_image") as mock_proc:
            with patch("obsidian_watcher.time.sleep"):
                handler._check_and_process("/tmp/vault/doc.pdf")
        mock_proc.assert_not_called()

    def test_rejects_markdown(self, handler):
        with patch.object(handler, "process_image") as mock_proc:
            with patch("obsidian_watcher.time.sleep"):
                handler._check_and_process("/tmp/vault/note.md")
        mock_proc.assert_not_called()

    def test_case_insensitive_extension(self, handler):
        with patch.object(handler, "process_image") as mock_proc:
            with patch("obsidian_watcher.time.sleep"):
                handler._check_and_process("/tmp/vault/photo.PNG")
        mock_proc.assert_called_once()


# ─── Concurrent event threads ────────────────────────────────────

class TestConcurrentEvents:
    """
    Simulate watchdog firing callbacks from multiple concurrent threads.
    """

    def test_concurrent_threads_different_files_all_processed(self, config):
        """
        5 threads each process a unique file → should count all 5.
        """
        from obsidian_watcher import ImageHandler
        handler = ImageHandler(config)

        call_log = []
        lock = threading.Lock()

        def fake_convert(path):
            return ("/tmp/out.webp", "out.webp")

        def fake_upload(path, name):
            return "https://r2/out.webp"

        with patch.object(handler.processor, "convert_to_webp", side_effect=fake_convert), \
             patch.object(handler.uploader, "upload", side_effect=fake_upload), \
             patch.object(handler.md_updater, "replace_image_link", return_value=True), \
             patch("os.remove"), \
             patch("obsidian_watcher._write_upload_log"):

            def process_in_thread(path):
                handler.process_image(path)
                with lock:
                    call_log.append(path)

            threads = [
                threading.Thread(
                    target=process_in_thread,
                    args=(f"/tmp/vault/img{i}.png",)
                )
                for i in range(5)
            ]
            for t in threads:
                t.start()
            for t in threads:
                t.join()

        assert len(call_log) == 5
        assert handler.processed_count == 5

    def test_concurrent_threads_same_file_counted_each_time(self, config):
        """
        Each thread independently calls process_image for the same path.
        All should succeed — there's no dedup at the process_image level.
        """
        from obsidian_watcher import ImageHandler
        handler = ImageHandler(config)

        with patch.object(handler.processor, "convert_to_webp",
                          return_value=("/tmp/out.webp", "out.webp")), \
             patch.object(handler.uploader, "upload",
                          return_value="https://r2/out.webp"), \
             patch.object(handler.md_updater, "replace_image_link",
                          return_value=True), \
             patch("os.remove"), \
             patch("obsidian_watcher._write_upload_log"):

            threads = [
                threading.Thread(
                    target=handler.process_image,
                    args=("/tmp/vault/shared.png",)
                )
                for _ in range(3)
            ]
            for t in threads:
                t.start()
            for t in threads:
                t.join()

        assert handler.processed_count == 3


# ─── Upload failure recovery ─────────────────────────────────────

class TestUploadFailure:
    """
    When upload fails, the handler must not crash, not increment count,
    and not delete the original file.
    """

    def test_upload_error_does_not_crash(self, handler):
        with patch.object(handler.processor, "convert_to_webp",
                          return_value=("/tmp/out.webp", "abc.webp")), \
             patch.object(handler.uploader, "upload",
                          side_effect=ConnectionError("R2 down")), \
             patch("os.remove") as mock_rm:
            handler.process_image("/tmp/vault/photo.png")

        assert handler.processed_count == 0

    def test_upload_error_does_not_delete_original(self, handler):
        """
        When upload fails, os.remove should NOT be called with the original file.
        """
        original_path = "/tmp/vault/photo.png"

        with patch.object(handler.processor, "convert_to_webp",
                          return_value=("/tmp/out.webp", "abc.webp")), \
             patch.object(handler.uploader, "upload",
                          side_effect=ConnectionError("R2 down")), \
             patch("os.remove") as mock_rm:
            handler.process_image(original_path)

        # os.remove should not be called at all (upload failed before we get there)
        mock_rm.assert_not_called()

    def test_conversion_error_does_not_crash(self, handler):
        with patch.object(handler.processor, "convert_to_webp",
                          side_effect=OSError("disk full")):
            handler.process_image("/tmp/vault/photo.png")

        assert handler.processed_count == 0

    def test_second_image_processed_after_first_fails(self, config):
        """
        After a failed upload on the first image, the second image
        (a fresh handler call) should still be processed successfully.
        """
        from obsidian_watcher import ImageHandler
        handler = ImageHandler(config)
        call_count = [0]

        def upload_side_effect(path, name):
            call_count[0] += 1
            if call_count[0] == 1:
                raise ConnectionError("flaky first call")
            return "https://r2/success.webp"

        with patch.object(handler.processor, "convert_to_webp",
                          return_value=("/tmp/out.webp", "abc.webp")), \
             patch.object(handler.uploader, "upload",
                          side_effect=upload_side_effect), \
             patch.object(handler.md_updater, "replace_image_link",
                          return_value=True), \
             patch("os.remove"), \
             patch("obsidian_watcher._write_upload_log"):

            handler.process_image("/tmp/vault/first.png")   # fails
            handler.process_image("/tmp/vault/second.png")  # succeeds

        assert handler.processed_count == 1, (
            "Second image should be processed even after first fails"
        )


# ─── on_processed callback timing ────────────────────────────────

class TestCallbackTiming:
    """
    The on_processed callback (triggers auto-git notify) must only fire
    AFTER a successful upload — not on failures.
    """

    def _with_full_mock_success(self, handler, fn):
        with patch.object(handler.processor, "convert_to_webp",
                          return_value=("/tmp/out.webp", "ok.webp")), \
             patch.object(handler.uploader, "upload",
                          return_value="https://r2/ok.webp"), \
             patch.object(handler.md_updater, "replace_image_link",
                          return_value=True), \
             patch("os.remove"), \
             patch("obsidian_watcher._write_upload_log"):
            fn()

    def test_callback_fires_on_success(self, config):
        callback = MagicMock()
        from obsidian_watcher import ImageHandler
        h = ImageHandler(config, on_processed=callback)

        self._with_full_mock_success(
            h, lambda: h.process_image("/tmp/vault/photo.png")
        )
        callback.assert_called_once()

    def test_callback_not_fired_on_upload_failure(self, config):
        callback = MagicMock()
        from obsidian_watcher import ImageHandler
        h = ImageHandler(config, on_processed=callback)

        with patch.object(h.processor, "convert_to_webp",
                          return_value=("/tmp/out.webp", "ok.webp")), \
             patch.object(h.uploader, "upload",
                          side_effect=ConnectionError("failed")):
            h.process_image("/tmp/vault/photo.png")

        callback.assert_not_called()

    def test_callback_not_fired_on_conversion_failure(self, config):
        callback = MagicMock()
        from obsidian_watcher import ImageHandler
        h = ImageHandler(config, on_processed=callback)

        with patch.object(h.processor, "convert_to_webp",
                          side_effect=OSError("disk full")):
            h.process_image("/tmp/vault/photo.png")

        callback.assert_not_called()

    def test_callback_fires_for_each_successful_image(self, config):
        callback = MagicMock()
        from obsidian_watcher import ImageHandler
        h = ImageHandler(config, on_processed=callback)

        with patch.object(h.processor, "convert_to_webp",
                          return_value=("/tmp/out.webp", "ok.webp")), \
             patch.object(h.uploader, "upload",
                          return_value="https://r2/ok.webp"), \
             patch.object(h.md_updater, "replace_image_link",
                          return_value=True), \
             patch("os.remove"), \
             patch("obsidian_watcher._write_upload_log"):
            h.process_image("/tmp/vault/a.png")
            h.process_image("/tmp/vault/b.png")
            h.process_image("/tmp/vault/c.png")

        assert callback.call_count == 3
        assert h.processed_count == 3

    def test_no_callback_when_none(self, config):
        """Should not crash if on_processed is None (default)."""
        from obsidian_watcher import ImageHandler
        h = ImageHandler(config, on_processed=None)

        self._with_full_mock_success(
            h, lambda: h.process_image("/tmp/vault/photo.png")
        )
        assert h.processed_count == 1

    def test_mixed_success_and_failure_callback_count(self, config):
        """
        3 images: 1st succeeds, 2nd fails (upload), 3rd succeeds.
        callback should fire exactly 2 times.
        """
        callback = MagicMock()
        from obsidian_watcher import ImageHandler
        h = ImageHandler(config, on_processed=callback)

        call_n = [0]

        def upload_side_effect(path, name):
            call_n[0] += 1
            if call_n[0] == 2:
                raise ConnectionError("second upload failed")
            return "https://r2/ok.webp"

        with patch.object(h.processor, "convert_to_webp",
                          return_value=("/tmp/out.webp", "ok.webp")), \
             patch.object(h.uploader, "upload",
                          side_effect=upload_side_effect), \
             patch.object(h.md_updater, "replace_image_link",
                          return_value=True), \
             patch("os.remove"), \
             patch("obsidian_watcher._write_upload_log"):
            h.process_image("/tmp/vault/a.png")  # success
            h.process_image("/tmp/vault/b.png")  # fail
            h.process_image("/tmp/vault/c.png")  # success

        assert callback.call_count == 2
        assert h.processed_count == 2
