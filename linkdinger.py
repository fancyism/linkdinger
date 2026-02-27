#!/usr/bin/env python3
"""
Linkdinger — Unified Daemon
============================
Runs the Obsidian image watcher and auto-git sync in a single process.

Usage:
    python linkdinger.py              # Run both watcher + auto-git
    python linkdinger.py --watch      # Watcher only
    python linkdinger.py --git        # Auto-git only
    python linkdinger.py --status     # Show current config status
"""

import argparse
import signal
import sys
import time
import logging
from obsidian_watcher import Config, create_watcher
from auto_git import AutoGit

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# ─── Banner ─────────────────────────────────────────────────────

BANNER = r"""
 ╔══════════════════════════════════════════╗
 ║     🔗  L I N K D I N G E R  🔗         ║
 ║     Obsidian → R2 → Git Pipeline        ║
 ╚══════════════════════════════════════════╝
"""


def print_status(config: Config, auto_git: AutoGit | None = None):
    """Print current configuration status."""
    print(BANNER)
    print(f"  📂 Vault:        {config.vault_path}")
    print(f"  ☁️  R2 Bucket:    {config.r2_bucket}")
    print(f"  🌐 R2 URL:       {config.r2_public_url}")
    print(f"  🖼️  Formats:      {', '.join(config.formats)}")
    print(f"  📐 Output:       {config.output_format} (q={config.quality})")
    print(f"  ⏱️  Debounce:     {config.debounce_sec}s")

    if auto_git:
        print(f"  🔄 Auto-git:     {'enabled' if auto_git.enabled else 'disabled'}")
        if auto_git.enabled:
            print(f"  ⏳ Idle commit:   {auto_git.idle_minutes} min")
            print(f"  📝 Prefix:       {auto_git.commit_prefix}")
    print()


def run_daemon(watch: bool = True, git: bool = True):
    """Run the unified daemon."""

    # Load config
    try:
        config = Config()
    except ValueError as e:
        print(f"❌ Configuration error: {e}")
        sys.exit(1)

    # Setup auto-git
    auto_git = None
    if git:
        auto_git = AutoGit()
        if not auto_git.enabled:
            print("⚠️  Auto-git disabled in config.yaml, running watcher only")
            auto_git = None

    # Print banner
    print_status(config, auto_git)

    services = []

    # Setup watcher
    observer = None
    handler = None
    if watch:
        git_callback = auto_git.notify if auto_git else None
        observer, handler = create_watcher(config, on_processed=git_callback)
        observer.start()
        services.append("👁️  Watcher")
        print(f"  👁️  Watcher:      RUNNING → {config.vault_path}")

    # Start auto-git
    if auto_git:
        auto_git.start()
        services.append("🔄 Auto-git")
        print(f"  🔄 Auto-git:     RUNNING → idle {auto_git.idle_minutes}m")

    if not services:
        print("❌ No services enabled. Use --watch or --git.")
        sys.exit(1)

    print(f"\n  ⚡ Services:      {' + '.join(services)}")
    print(f"  Press Ctrl+C to stop\n")
    print("  " + "─" * 40)
    print()

    # Graceful shutdown handler
    def shutdown(signum=None, frame=None):
        print("\n\n  ⏹️  Shutting down...")

        if observer:
            observer.stop()
            print("    ✓ Watcher stopped")

        if auto_git:
            auto_git.stop()
            print("    ✓ Auto-git stopped")

        if observer:
            observer.join()

        # Print session stats
        print()
        if handler:
            print(f"  📊 Images processed: {handler.processed_count}")
        if auto_git:
            status = auto_git.status
            print(f"  📊 Git syncs:        {status['sync_count']}")

        print("\n  👋 Goodbye!\n")

    signal.signal(signal.SIGINT, lambda s, f: shutdown(s, f))
    signal.signal(signal.SIGTERM, lambda s, f: shutdown(s, f))

    # Main loop
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        shutdown()


def main():
    parser = argparse.ArgumentParser(
        description="Linkdinger — Obsidian → R2 → Git pipeline",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python linkdinger.py              Run both watcher + auto-git
  python linkdinger.py --watch      Watcher only (no auto-git)
  python linkdinger.py --git        Auto-git only (no watcher)
  python linkdinger.py --status     Show config and exit
        """
    )
    parser.add_argument("--watch", action="store_true", help="Run watcher only")
    parser.add_argument("--git", action="store_true", help="Run auto-git only")
    parser.add_argument("--status", action="store_true", help="Show config status and exit")
    args = parser.parse_args()

    if args.status:
        try:
            config = Config()
            auto_git = AutoGit()
            print_status(config, auto_git)
        except Exception as e:
            print(f"❌ Error: {e}")
        return

    # If neither flag is set, run both
    if not args.watch and not args.git:
        run_daemon(watch=True, git=True)
    else:
        run_daemon(watch=args.watch, git=args.git)


if __name__ == "__main__":
    main()
