"""
Auto-git: Event-driven git sync for Obsidian vault.

Can run standalone (polling mode) or integrated with the watcher
daemon (event-driven mode via notify()).
"""

import os
import time
import subprocess
import logging
import threading
from datetime import datetime

import yaml  # type: ignore[import-untyped]

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


class AutoGit:
    """Git sync with event-driven debounce support.
    
    Usage (standalone):
        auto_git = AutoGit()
        auto_git.run()  # polling mode
    
    Usage (integrated):
        auto_git = AutoGit()
        auto_git.start()  # non-blocking, starts background timer
        # ... later ...
        auto_git.notify()  # called by watcher after each image processed
        # ... shutdown ...
        auto_git.stop()
    """

    def __init__(self, config_path: str = "config.yaml"):
        with open(config_path, "r", encoding="utf-8") as f:
            cfg = yaml.safe_load(f)

        self.enabled: bool = cfg["git"]["enabled"]
        self.idle_minutes: int = cfg["git"]["idle_minutes"]
        self.commit_prefix: str = cfg["git"]["commit_prefix"]
        self.vault_path: str = cfg["vault"]["path"]

        # Event-driven state
        self._lock = threading.Lock()
        self._timer: threading.Timer | None = None
        self._running = False
        self._last_notify: float = 0.0
        self._sync_count: int = 0

    # ─── Git Ops ────────────────────────────────────────────────

    def run_git_command(self, *args) -> tuple[bool, str]:
        """Execute a git command in the vault directory."""
        try:
            result = subprocess.run(
                ["git"] + list(args),
                cwd=self.vault_path,
                capture_output=True,
                timeout=30
            )
            # Decode with UTF-8 to handle Thai/Unicode filenames
            stdout = result.stdout.decode('utf-8', errors='replace')
            stderr = result.stderr.decode('utf-8', errors='replace')
            return result.returncode == 0, stdout + stderr
        except subprocess.TimeoutExpired:
            return False, "Command timed out"
        except FileNotFoundError:
            return False, "git not found on PATH"
        except Exception as e:
            return False, str(e)

    def has_changes(self) -> bool:
        """Check if vault has uncommitted changes."""
        success, output = self.run_git_command("status", "--porcelain")
        return success and bool(output.strip())

    def sync(self) -> bool:
        """Stage, commit, and push all changes."""
        if not self.has_changes():
            logger.info("No changes to commit")
            return False

        success, output = self.run_git_command("add", ".")
        if not success:
            logger.error(f"git add failed: {output}")
            return False

        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        message = f"{self.commit_prefix} {timestamp}"

        success, output = self.run_git_command("commit", "-m", message)
        if not success:
            logger.error(f"git commit failed: {output}")
            return False

        success, output = self.run_git_command("push")
        if not success:
            logger.error(f"git push failed: {output}")
            return False

        self._sync_count += 1
        logger.info(f"Synced: {message}")
        print(f"📤 Synced to GitHub: {timestamp}")

        # Log to dashboard activity log
        try:
            from dashboard import log_activity  # type: ignore[import-untyped]
            log_activity("git", "Auto-commit & push", message)
        except ImportError:
            pass

        return True

    # ─── Event-Driven Mode ──────────────────────────────────────

    def notify(self):
        """Called by the watcher after each image is processed.
        
        Resets the idle timer. After `idle_minutes` of silence,
        auto-commits and pushes.
        """
        with self._lock:
            self._last_notify = time.time()

            # Cancel existing timer
            timer = self._timer
            if timer is not None:
                timer.cancel()

            # Start new timer
            delay = self.idle_minutes * 60
            self._timer = threading.Timer(delay, self._timer_fired)
            self._timer.daemon = True
            self._timer.start()

            logger.debug(f"Git timer reset → {self.idle_minutes}m")

    def _timer_fired(self):
        """Called when the idle timer expires."""
        logger.info("Idle timer expired → syncing...")
        try:
            self.sync()
        except Exception as e:
            logger.error(f"Sync error: {e}")

    def start(self):
        """Start event-driven mode (non-blocking).
        
        Does an initial sync if there are pending changes,
        then waits for notify() calls.
        """
        if not self.enabled:
            logger.info("Auto-git is disabled in config.yaml")
            return

        self._running = True
        logger.info(f"Auto-git started (idle: {self.idle_minutes}m)")

        # Initial sync for any pending changes
        if self.has_changes():
            logger.info("Found pending changes on startup → syncing...")
            self.sync()

    def stop(self):
        """Stop event-driven mode and do a final sync."""
        self._running = False

        with self._lock:
            timer = self._timer
            if timer is not None:
                timer.cancel()
                self._timer = None

        # Final sync before shutdown
        if self.has_changes():
            logger.info("Final sync before shutdown...")
            self.sync()

        logger.info("Auto-git stopped")

    @property
    def status(self) -> dict:
        """Return current status for health checks."""
        timer = self._timer
        return {
            "enabled": self.enabled,
            "running": self._running,
            "sync_count": self._sync_count,
            "last_notify": self._last_notify,
            "has_pending_timer": timer is not None and timer.is_alive(),
            "vault_path": self.vault_path,
        }

    # ─── Standalone Polling Mode ────────────────────────────────

    def run(self):
        """Standalone polling mode (backward-compatible)."""
        if not self.enabled:
            print("❌ Auto-git is disabled in config.yaml")
            return

        if not self.vault_path:
            print("❌ vault.path is not set in config.yaml")
            return

        print(f"🔄 Auto-git enabled (idle: {self.idle_minutes} min)")
        print("Press Ctrl+C to stop\n")

        last_change_time = time.time()

        while True:
            try:
                if self.has_changes():
                    last_change_time = time.time()
                    logger.debug("Changes detected")

                idle_seconds = time.time() - last_change_time
                idle_minutes = idle_seconds / 60

                if idle_minutes >= self.idle_minutes:
                    self.sync()
                    last_change_time = time.time()

                time.sleep(30)

            except KeyboardInterrupt:
                print("\n⏹️  Stopping auto-git...")
                break
            except Exception as e:
                logger.error(f"Error: {e}")
                time.sleep(60)


def main():
    auto_git = AutoGit()
    auto_git.run()


if __name__ == "__main__":
    main()
