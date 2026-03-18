"""Unit tests for auto_git module."""

import time
import threading
from unittest.mock import patch, MagicMock
import pytest  # type: ignore[import-untyped]

# We need to mock yaml.safe_load before importing AutoGit
MOCK_CONFIG = {
    "git": {
        "enabled": True,
        "idle_minutes": 5,
        "commit_prefix": "auto:",
    },
    "vault": {
        "path": "/tmp/test-vault",
    },
}


@pytest.fixture
def auto_git():
    """Create AutoGit with mocked config."""
    with patch("builtins.open", MagicMock()), \
         patch("yaml.safe_load", return_value=MOCK_CONFIG):
        from auto_git import AutoGit
        ag = AutoGit()
    return ag


class TestHasChanges:
    def test_has_changes_true(self, auto_git):
        """Should return True when git status shows uncommitted files."""
        with patch.object(auto_git, "run_git_command", return_value=(True, " M file.md\n")):
            assert auto_git.has_changes() is True

    def test_has_changes_false_empty(self, auto_git):
        """Should return False when working tree is clean."""
        with patch.object(auto_git, "run_git_command", return_value=(True, "")):
            assert auto_git.has_changes() is False

    def test_has_changes_git_error(self, auto_git):
        """Should return False when git command fails."""
        with patch.object(auto_git, "run_git_command", return_value=(False, "error")):
            assert auto_git.has_changes() is False


class TestSync:
    def test_sync_full_flow(self, auto_git):
        """Should execute add → commit → push sequence."""
        calls = []

        def mock_git(*args):
            calls.append(args)
            return True, "ok"

        with patch.object(auto_git, "run_git_command", side_effect=mock_git), \
             patch.object(auto_git, "has_changes", return_value=True):
            result = auto_git.sync()

        assert result is True
        assert len(calls) == 3
        assert calls[0][0] == "add"      # git add .
        assert calls[1][0] == "commit"   # git commit -m "auto: ..."
        assert calls[2][0] == "push"     # git push

    def test_sync_no_changes(self, auto_git):
        """Should skip sync when no changes."""
        with patch.object(auto_git, "has_changes", return_value=False):
            result = auto_git.sync()

        assert result is False

    def test_sync_add_fails(self, auto_git):
        """Should abort if git add fails."""
        with patch.object(auto_git, "has_changes", return_value=True), \
             patch.object(auto_git, "run_git_command", return_value=(False, "error")):
            result = auto_git.sync()

        assert result is False

    def test_sync_increments_count(self, auto_git):
        """Sync count should increase on success."""
        assert auto_git._sync_count == 0

        with patch.object(auto_git, "run_git_command", return_value=(True, "ok")), \
             patch.object(auto_git, "has_changes", return_value=True):
            auto_git.sync()

        assert auto_git._sync_count == 1


class TestNotify:
    def test_notify_starts_timer(self, auto_git):
        """Notify should start a background timer."""
        assert auto_git._timer is None
        auto_git.notify()
        assert auto_git._timer is not None
        assert auto_git._timer.is_alive()

        # Cleanup
        auto_git._timer.cancel()

    def test_notify_resets_timer(self, auto_git):
        """Multiple notify calls should reset (replace) the timer."""
        auto_git.notify()
        timer1 = auto_git._timer

        auto_git.notify()
        timer2 = auto_git._timer

        # Timer should be replaced
        assert timer1 is not timer2
        assert not timer1.is_alive()  # old timer cancelled
        assert timer2.is_alive()      # new timer alive

        # Cleanup
        timer2.cancel()

    def test_notify_updates_last_notify(self, auto_git):
        """Should track last notify timestamp."""
        assert auto_git._last_notify == 0.0
        auto_git.notify()
        assert auto_git._last_notify > 0
        auto_git._timer.cancel()


class TestStartStop:
    def test_start_sets_running(self, auto_git):
        """Start should set running flag."""
        with patch.object(auto_git, "has_changes", return_value=False):
            auto_git.start()
        assert auto_git._running is True

    def test_stop_does_final_sync(self, auto_git):
        """Stop should attempt a final sync."""
        with patch.object(auto_git, "has_changes", return_value=True), \
             patch.object(auto_git, "sync") as mock_sync:
            auto_git.stop()
        mock_sync.assert_called_once()

    def test_stop_cancels_timer(self, auto_git):
        """Stop should cancel any pending timer."""
        auto_git.notify()
        assert auto_git._timer.is_alive()

        with patch.object(auto_git, "has_changes", return_value=False):
            auto_git.stop()

        assert auto_git._timer is None


class TestStatus:
    def test_status_returns_dict(self, auto_git):
        """Status should return a well-formed dict."""
        status = auto_git.status
        assert isinstance(status, dict)
        assert "enabled" in status
        assert "running" in status
        assert "sync_count" in status
        assert "vault_path" in status


class TestRunGitCommand:
    def test_git_not_found(self, auto_git):
        """Should handle missing git gracefully."""
        with patch("subprocess.run", side_effect=FileNotFoundError("git")):
            success, output = auto_git.run_git_command("status")
        assert success is False
        assert "not found" in output

    def test_git_timeout(self, auto_git):
        """Should handle git timeout."""
        import subprocess
        with patch("subprocess.run", side_effect=subprocess.TimeoutExpired("git", 30)):
            success, output = auto_git.run_git_command("push")
        assert success is False
        assert "timed out" in output
