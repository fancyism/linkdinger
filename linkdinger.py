#!/usr/bin/env python3
"""
Linkdinger — Unified Daemon
============================
Runs the Obsidian image watcher, auto-git sync, and CMS content sync
in a single process.

Usage:
    python linkdinger.py              # Run all (watcher + auto-git + CMS)
    python linkdinger.py --watch      # Watcher only
    python linkdinger.py --git        # Auto-git only
    python linkdinger.py --cms        # CMS sync only (one-shot)
    python linkdinger.py --status     # Show current config status
"""

import argparse
import os
import signal
import sys
import time
import logging
from datetime import datetime

# Fix Unicode encoding for Windows terminal (cp1252 → UTF-8)
# We cast to io.TextIOWrapper because typeshed's TextIO doesn't include reconfigure
import io
from typing import cast

if sys.stdout.encoding != 'utf-8':
    cast(io.TextIOWrapper, sys.stdout).reconfigure(encoding='utf-8')

if sys.stderr.encoding != 'utf-8':
    cast(io.TextIOWrapper, sys.stderr).reconfigure(encoding='utf-8')
from obsidian_watcher import Config, create_watcher  # pyre-ignore[21]
from auto_git import AutoGit  # pyre-ignore[21]
from content_sync import (  # pyre-ignore[21]
    SyncConfig,
    has_due_scheduled_posts,
    notify as cms_notify,
    sync_all,
)
from dashboard import start_dashboard, set_daemon_state, log_activity  # pyre-ignore[21]

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# ─── Banner ─────────────────────────────────────────────────────

BANNER = r"""
 ╔══════════════════════════════════════════╗
 ║     🔗  L I N K D I N G E R  🔗         ║
 ║     Obsidian → R2 → Git → Blog          ║
 ╚══════════════════════════════════════════╝
"""


def print_status(config: Config, auto_git: AutoGit | None = None, sync_config: SyncConfig | None = None):
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

    if sync_config:
        print(f"  📝 CMS mode:     {sync_config.publish_method}")
        print(f"  📁 Publish:      {sync_config.publish_path}")
        print(f"  📄 Blog dir:     {sync_config.abs_content_dir}")
        print(f"  ✨ Prompt dir:   {sync_config.abs_prompts_dir}")
    print()


def run_cms_only():
    """Run CMS sync one-shot (no daemon)."""
    try:
        sync_config = SyncConfig()
    except Exception as e:
        print(f"❌ Config error: {e}")
        sys.exit(1)

    print(BANNER)
    print(f"  📂 Vault:     {sync_config.vault_path}")
    print(f"  📁 Publish:   {sync_config.publish_path}")
    print(f"  📄 Blog dir:  {sync_config.abs_content_dir}")
    print(f"  ✨ Prompt dir:{sync_config.abs_prompts_dir}")
    print(f"  🔧 Method:    {sync_config.publish_method}")
    print()

    count = sync_all(sync_config)
    sys.exit(0 if count >= 0 else 1)


def run_daemon(watch: bool = True, git: bool = True, cms: bool = True, dashboard: bool = True):
    """Run the unified daemon."""

    # Load config
    try:
        config = Config()
    except ValueError as e:
        print(f"❌ Configuration error: {e}")
        sys.exit(1)

    # Load CMS sync config
    sync_config = None
    if cms:
        try:
            sync_config = SyncConfig()
        except Exception as e:
            print(f"⚠️  CMS sync disabled: {e}")
            sync_config = None

    # Setup auto-git
    auto_git = None
    if git:
        auto_git = AutoGit()
        if not auto_git.enabled:
            print("⚠️  Auto-git disabled in config.yaml, running watcher only")
            auto_git = None

    # Print banner
    print_status(config, auto_git, sync_config)

    # Initialize dashboard state
    set_daemon_state(started_at=datetime.now())

    # Log daemon start
    log_activity("system", "Daemon started", "Watching for changes...")

    services = []

    # CMS callback: sync file + trigger git
    def cms_callback(filepath: str, deleted: bool):
        if sync_config:
            cms_notify(filepath, sync_config, deleted=deleted)
            # Also trigger git sync after content change
            if auto_git:
                auto_git.notify()

    # Setup watcher
    observer = None
    handler = None
    md_handler = None
    if watch:
        git_callback = auto_git.notify if auto_git else None
        cms_cb = cms_callback if sync_config else None
        observer, handler, md_handler = create_watcher(
            config, on_processed=git_callback, cms_callback=cms_cb
        )
        observer.start()
        services.append("👁️  Watcher")
        print(f"  👁️  Watcher:      RUNNING → {config.vault_path}")

        if md_handler:
            services.append("📝 CMS")
            print(f"  📝 CMS:          RUNNING → {config.publish_folder}")

    # Start auto-git
    if auto_git:
        auto_git.start()
        services.append("🔄 Auto-git")
        print(f"  🔄 Auto-git:     RUNNING → idle {auto_git.idle_minutes}m")

    # Start dashboard
    if dashboard:
        start_dashboard(port=9999)
        services.append("🖥️  Dashboard")
        print(f"  🖥️  Dashboard:    RUNNING → http://localhost:9999")

    # Share state references for live dashboard updates
    set_daemon_state(auto_git_ref=auto_git, sync_config_ref=sync_config)

    # Initial sync on startup
    if sync_config:
        print(f"\n  🔄 Running initial CMS sync...")
        count = sync_all(sync_config)
        print(f"  ✓  Initial sync: {count} file(s)")
        set_daemon_state(posts_synced=count)

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
        if md_handler:
            print(f"  📊 Posts synced:      {md_handler.sync_count}")
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
        description="Linkdinger — Obsidian → R2 → Git → Blog pipeline",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python linkdinger.py              Run all (watcher + auto-git + CMS)
  python linkdinger.py --watch      Watcher only (no auto-git, no CMS)
  python linkdinger.py --git        Auto-git only (no watcher, no CMS)
  python linkdinger.py --cms        CMS sync only (one-shot, no daemon)
  python linkdinger.py --status     Show config and exit
        """
    )
    parser.add_argument("--watch", action="store_true", help="Run watcher only")
    parser.add_argument("--no-dashboard", action="store_true", help="Disable web dashboard")
    parser.add_argument("--git", action="store_true", help="Run auto-git only")
    parser.add_argument("--cms", action="store_true", help="Run CMS sync (one-shot)")
    parser.add_argument("--status", action="store_true", help="Show config status and exit")
    args = parser.parse_args()

    if args.status:
        try:
            config = Config()
            auto_git = AutoGit()
            sync_config = SyncConfig()
            print_status(config, auto_git, sync_config)
        except Exception as e:
            print(f"❌ Error: {e}")
        return

    if args.cms:
        run_cms_only()
        return

    # If neither flag is set, run all
    use_dashboard = not args.no_dashboard
    if not args.watch and not args.git:
        run_daemon(watch=True, git=True, cms=True, dashboard=use_dashboard)
    else:
        run_daemon(watch=args.watch, git=args.git, cms=False, dashboard=use_dashboard)


if __name__ == "__main__":
    main()
