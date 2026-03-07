"""
Complex unit tests for linkdinger.py — Unified Daemon Lifecycle.
Tests: run_daemon() flag combinations, graceful shutdown, CMS callback,
       config validation failure paths.

Model: Claude Opus 4 (complex — mocking multiple cooperating processes)
Run:   python -m pytest tests/test_linkdinger.py -v
"""

import os
import sys
import signal
import threading
from unittest.mock import patch, MagicMock, call, PropertyMock
import pytest

# ─── Shared mock env & config ───────────────────────────────────

MOCK_ENV = {
    "R2_ENDPOINT":   "https://test.r2.cloudflarestorage.com",
    "R2_ACCESS_KEY": "test-key",
    "R2_SECRET_KEY": "test-secret",
    "R2_BUCKET":     "test-bucket",
    "R2_PUBLIC_URL": "https://test.r2.dev",
}

MOCK_CONFIG_DATA = {
    "vault": {"path": "/tmp/test-vault", "assets_dir": "_assets"},
    "watcher": {
        "debounce_sec": 0.01,
        "formats": [".png", ".jpg"],
        "output_format": "webp",
        "quality": 80,
    },
}


def _mock_config():
    """Return a minimal mock Config object."""
    cfg = MagicMock()
    cfg.vault_path = "/tmp/test-vault"
    cfg.r2_bucket  = "test-bucket"
    cfg.r2_public_url = "https://test.r2.dev"
    cfg.formats = [".png", ".jpg"]
    cfg.output_format = "webp"
    cfg.quality = 80
    cfg.debounce_sec = 0.01
    cfg.publish_folder = "/tmp/test-vault/publish"
    return cfg


def _mock_auto_git(enabled=True):
    ag = MagicMock()
    ag.enabled = enabled
    ag.idle_minutes = 5
    ag.commit_prefix = "auto:"
    ag.status = {"sync_count": 0}
    return ag


def _mock_sync_config():
    sc = MagicMock()
    sc.publish_method = "folder"
    sc.publish_path = "/tmp/test-vault/publish"
    sc.abs_content_dir = "/tmp/blog/content/posts"
    return sc


# ─── print_status ───────────────────────────────────────────────

class TestPrintStatus:
    def test_prints_vault_info(self, capsys):
        """print_status should output vault path and R2 bucket."""
        from linkdinger import print_status
        config = _mock_config()
        print_status(config)
        out = capsys.readouterr().out
        assert "/tmp/test-vault" in out
        assert "test-bucket" in out

    def test_prints_auto_git_when_provided(self, capsys):
        """print_status should show auto-git section when auto_git is passed."""
        from linkdinger import print_status
        config = _mock_config()
        ag = _mock_auto_git()
        print_status(config, auto_git=ag)
        out = capsys.readouterr().out
        assert "enabled" in out.lower() or "5 min" in out

    def test_prints_cms_when_provided(self, capsys):
        """print_status should show CMS section when sync_config is passed."""
        from linkdinger import print_status
        config = _mock_config()
        sc = _mock_sync_config()
        print_status(config, sync_config=sc)
        out = capsys.readouterr().out
        assert "folder" in out.lower()


# ─── run_daemon — flag combinations ─────────────────────────────

class TestRunDaemonFlags:
    """
    Test that run_daemon() starts the correct set of services
    depending on the watch/git/cms/dashboard flags.
    Uses threading to run daemon briefly, then shuts it down.
    """

    def _run_daemon_briefly(self, **kwargs):
        """Launch run_daemon in a thread, stop it via SIGINT after a moment."""
        import linkdinger

        results = {}
        exc_holder = []

        def daemon_thread():
            try:
                with patch("linkdinger.Config", return_value=_mock_config()), \
                     patch("linkdinger.SyncConfig", return_value=_mock_sync_config()), \
                     patch("linkdinger.AutoGit", return_value=_mock_auto_git()), \
                     patch("linkdinger.create_watcher") as mock_cw, \
                     patch("linkdinger.start_dashboard"), \
                     patch("linkdinger.set_daemon_state"), \
                     patch("linkdinger.sync_all", return_value=5), \
                     patch("linkdinger.time.sleep", side_effect=KeyboardInterrupt):

                    mock_observer = MagicMock()
                    mock_handler = MagicMock()
                    mock_handler.processed_count = 0
                    mock_md_handler = MagicMock()
                    mock_md_handler.sync_count = 0
                    mock_cw.return_value = (mock_observer, mock_handler, mock_md_handler)

                    linkdinger.run_daemon(**kwargs)
                    results["create_watcher_called"] = mock_cw.called
            except SystemExit as e:
                results["exit_code"] = e.code
            except Exception as e:
                exc_holder.append(e)

        t = threading.Thread(target=daemon_thread, daemon=True)
        t.start()
        t.join(timeout=3)

        if exc_holder:
            raise exc_holder[0]

        return results

    def test_watch_only_does_not_start_autogit(self):
        """watch=True, git=False: AutoGit.start() should NOT be called."""
        with patch("linkdinger.Config", return_value=_mock_config()), \
             patch("linkdinger.SyncConfig", return_value=_mock_sync_config()), \
             patch("linkdinger.AutoGit", return_value=_mock_auto_git()) as MockAG, \
             patch("linkdinger.create_watcher") as mock_cw, \
             patch("linkdinger.start_dashboard"), \
             patch("linkdinger.set_daemon_state"), \
             patch("linkdinger.sync_all", return_value=0), \
             patch("linkdinger.time.sleep", side_effect=KeyboardInterrupt):

            mock_observer = MagicMock()
            mock_handler = MagicMock()
            mock_handler.processed_count = 0
            mock_md_handler = MagicMock()
            mock_md_handler.sync_count = 0
            mock_cw.return_value = (mock_observer, mock_handler, mock_md_handler)

            ag_instance = MockAG.return_value
            ag_instance.enabled = True

            import linkdinger
            try:
                linkdinger.run_daemon(watch=True, git=False, cms=False, dashboard=False)
            except (KeyboardInterrupt, SystemExit):
                pass

            ag_instance.start.assert_not_called()

    def test_git_only_does_not_create_watcher(self):
        """watch=False, git=True: create_watcher() should NOT be called."""
        with patch("linkdinger.Config", return_value=_mock_config()), \
             patch("linkdinger.SyncConfig", return_value=_mock_sync_config()), \
             patch("linkdinger.AutoGit", return_value=_mock_auto_git()) as MockAG, \
             patch("linkdinger.create_watcher") as mock_cw, \
             patch("linkdinger.start_dashboard"), \
             patch("linkdinger.set_daemon_state"), \
             patch("linkdinger.sync_all", return_value=0), \
             patch("linkdinger.time.sleep", side_effect=KeyboardInterrupt):

            ag_instance = MockAG.return_value
            ag_instance.enabled = True

            import linkdinger
            try:
                linkdinger.run_daemon(watch=False, git=True, cms=False, dashboard=False)
            except (KeyboardInterrupt, SystemExit):
                pass

            mock_cw.assert_not_called()

    def test_no_services_exits_with_error(self):
        """watch=False + git=False + no enabled auto-git: should sys.exit(1)."""
        with patch("linkdinger.Config", return_value=_mock_config()), \
             patch("linkdinger.SyncConfig", return_value=_mock_sync_config()), \
             patch("linkdinger.AutoGit", return_value=_mock_auto_git(enabled=False)), \
             patch("linkdinger.create_watcher") as mock_cw, \
             patch("linkdinger.start_dashboard"), \
             patch("linkdinger.set_daemon_state"), \
             patch("linkdinger.sync_all", return_value=0):

            import linkdinger
            with pytest.raises(SystemExit) as exc:
                linkdinger.run_daemon(watch=False, git=True, cms=False, dashboard=False)
            assert exc.value.code == 1

    def test_config_error_exits_with_error(self):
        """Invalid Config should cause sys.exit(1)."""
        with patch("linkdinger.Config", side_effect=ValueError("missing vault.path")):
            import linkdinger
            with pytest.raises(SystemExit) as exc:
                linkdinger.run_daemon(watch=True, git=True, cms=True, dashboard=False)
            assert exc.value.code == 1

    def test_dashboard_starts_when_flag_true(self):
        """dashboard=True should call start_dashboard()."""
        with patch("linkdinger.Config", return_value=_mock_config()), \
             patch("linkdinger.SyncConfig", return_value=_mock_sync_config()), \
             patch("linkdinger.AutoGit", return_value=_mock_auto_git()), \
             patch("linkdinger.create_watcher") as mock_cw, \
             patch("linkdinger.start_dashboard") as mock_dash, \
             patch("linkdinger.set_daemon_state"), \
             patch("linkdinger.sync_all", return_value=0), \
             patch("linkdinger.time.sleep", side_effect=KeyboardInterrupt):

            mock_observer = MagicMock()
            mock_handler = MagicMock()
            mock_handler.processed_count = 0
            mock_md_handler = MagicMock()
            mock_md_handler.sync_count = 0
            mock_cw.return_value = (mock_observer, mock_handler, mock_md_handler)

            import linkdinger
            try:
                linkdinger.run_daemon(watch=True, git=True, cms=False, dashboard=True)
            except (KeyboardInterrupt, SystemExit):
                pass

            mock_dash.assert_called_once_with(port=9999)

    def test_dashboard_skipped_when_flag_false(self):
        """dashboard=False should NOT call start_dashboard()."""
        with patch("linkdinger.Config", return_value=_mock_config()), \
             patch("linkdinger.SyncConfig", return_value=_mock_sync_config()), \
             patch("linkdinger.AutoGit", return_value=_mock_auto_git()), \
             patch("linkdinger.create_watcher") as mock_cw, \
             patch("linkdinger.start_dashboard") as mock_dash, \
             patch("linkdinger.set_daemon_state"), \
             patch("linkdinger.sync_all", return_value=0), \
             patch("linkdinger.time.sleep", side_effect=KeyboardInterrupt):

            mock_observer = MagicMock()
            mock_handler = MagicMock()
            mock_handler.processed_count = 0
            mock_md_handler = MagicMock()
            mock_md_handler.sync_count = 0
            mock_cw.return_value = (mock_observer, mock_handler, mock_md_handler)

            import linkdinger
            try:
                linkdinger.run_daemon(watch=True, git=True, cms=False, dashboard=False)
            except (KeyboardInterrupt, SystemExit):
                pass

            mock_dash.assert_not_called()


# ─── CMS callback integration ───────────────────────────────────

class TestCMSCallback:
    """
    Test that the cms_callback inside run_daemon correctly
    calls cms_notify AND auto_git.notify when both are active.
    """

    def test_cms_callback_triggers_git_notify(self):
        """When cms_callback fires, auto_git.notify() should also be called."""
        ag = _mock_auto_git()
        sc = _mock_sync_config()

        with patch("linkdinger.Config", return_value=_mock_config()), \
             patch("linkdinger.SyncConfig", return_value=sc), \
             patch("linkdinger.AutoGit", return_value=ag), \
             patch("linkdinger.create_watcher") as mock_cw, \
             patch("linkdinger.start_dashboard"), \
             patch("linkdinger.set_daemon_state"), \
             patch("linkdinger.sync_all", return_value=0), \
             patch("linkdinger.cms_notify") as mock_notify, \
             patch("linkdinger.time.sleep", side_effect=KeyboardInterrupt):

            captured_callback = {}

            def fake_create_watcher(config, on_processed=None, cms_callback=None):
                captured_callback["fn"] = cms_callback
                obs = MagicMock()
                hdl = MagicMock()
                hdl.processed_count = 0
                md_hdl = MagicMock()
                md_hdl.sync_count = 0
                return obs, hdl, md_hdl

            mock_cw.side_effect = fake_create_watcher

            import linkdinger
            try:
                linkdinger.run_daemon(watch=True, git=True, cms=True, dashboard=False)
            except (KeyboardInterrupt, SystemExit):
                pass

            # Now fire the captured callback
            cb = captured_callback.get("fn")
            assert cb is not None, "cms_callback was not passed to create_watcher"
            cb("/tmp/vault/post.md", False)

            mock_notify.assert_called_once()
            ag.notify.assert_called_once()

    def test_cms_callback_skipped_when_no_sync_config(self):
        """When sync_config=None, cms_callback should not call cms_notify."""
        ag = _mock_auto_git()

        with patch("linkdinger.Config", return_value=_mock_config()), \
             patch("linkdinger.SyncConfig", side_effect=Exception("CMS config missing")), \
             patch("linkdinger.AutoGit", return_value=ag), \
             patch("linkdinger.create_watcher") as mock_cw, \
             patch("linkdinger.start_dashboard"), \
             patch("linkdinger.set_daemon_state"), \
             patch("linkdinger.sync_all", return_value=0), \
             patch("linkdinger.cms_notify") as mock_notify, \
             patch("linkdinger.time.sleep", side_effect=KeyboardInterrupt):

            captured_callback = {}

            def fake_create_watcher(config, on_processed=None, cms_callback=None):
                captured_callback["fn"] = cms_callback
                obs = MagicMock()
                hdl = MagicMock()
                hdl.processed_count = 0
                md_hdl = MagicMock()
                md_hdl.sync_count = 0
                return obs, hdl, md_hdl

            mock_cw.side_effect = fake_create_watcher

            import linkdinger
            try:
                linkdinger.run_daemon(watch=True, git=True, cms=True, dashboard=False)
            except (KeyboardInterrupt, SystemExit):
                pass

            cb = captured_callback.get("fn")
            # cms_callback should be None when no sync_config
            assert cb is None

            mock_notify.assert_not_called()


# ─── Initial CMS sync on startup ───────────────────────────────

class TestInitialSync:
    def test_initial_sync_called_on_startup(self):
        """sync_all() should be called once on startup when cms=True."""
        with patch("linkdinger.Config", return_value=_mock_config()), \
             patch("linkdinger.SyncConfig", return_value=_mock_sync_config()), \
             patch("linkdinger.AutoGit", return_value=_mock_auto_git()), \
             patch("linkdinger.create_watcher") as mock_cw, \
             patch("linkdinger.start_dashboard"), \
             patch("linkdinger.set_daemon_state"), \
             patch("linkdinger.sync_all") as mock_sync, \
             patch("linkdinger.time.sleep", side_effect=KeyboardInterrupt):

            mock_sync.return_value = 3
            mock_observer = MagicMock()
            mock_handler = MagicMock()
            mock_handler.processed_count = 0
            mock_md_handler = MagicMock()
            mock_md_handler.sync_count = 0
            mock_cw.return_value = (mock_observer, mock_handler, mock_md_handler)

            import linkdinger
            try:
                linkdinger.run_daemon(watch=True, git=True, cms=True, dashboard=False)
            except (KeyboardInterrupt, SystemExit):
                pass

            mock_sync.assert_called_once()

    def test_initial_sync_not_called_when_cms_disabled(self):
        """sync_all() should NOT be called when cms=False."""
        with patch("linkdinger.Config", return_value=_mock_config()), \
             patch("linkdinger.AutoGit", return_value=_mock_auto_git()), \
             patch("linkdinger.create_watcher") as mock_cw, \
             patch("linkdinger.start_dashboard"), \
             patch("linkdinger.set_daemon_state"), \
             patch("linkdinger.sync_all") as mock_sync, \
             patch("linkdinger.time.sleep", side_effect=KeyboardInterrupt):

            mock_observer = MagicMock()
            mock_handler = MagicMock()
            mock_handler.processed_count = 0
            mock_md_handler = MagicMock()
            mock_md_handler.sync_count = 0
            mock_cw.return_value = (mock_observer, mock_handler, None)

            import linkdinger
            try:
                linkdinger.run_daemon(watch=True, git=True, cms=False, dashboard=False)
            except (KeyboardInterrupt, SystemExit):
                pass

            mock_sync.assert_not_called()
