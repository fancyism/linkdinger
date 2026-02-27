"""Tests for content_sync module."""

import os
import json
import tempfile
import shutil
import pytest
from unittest.mock import patch

from content_sync import (
    SyncConfig,
    sync_file,
    sync_all,
    remove_synced,
    notify,
    _parse_frontmatter,
    _has_publish_flag,
    _rewrite_image_links,
    _collect_publish_files,
)


@pytest.fixture
def temp_env():
    """Create a temporary vault and blog content dir."""
    base = tempfile.mkdtemp()
    vault = os.path.join(base, "vault")
    publish = os.path.join(vault, "publish")
    notes = os.path.join(vault, "notes")
    assets = os.path.join(vault, "_assets")
    blog_content = os.path.join(base, "blog", "content", "posts")

    os.makedirs(publish)
    os.makedirs(notes)
    os.makedirs(assets)
    os.makedirs(blog_content)

    # Write config
    config_path = os.path.join(base, "config.yaml")
    config_data = {
        "vault": {"path": vault, "assets_dir": "_assets"},
        "publish": {"method": "both", "folder": "publish", "flag": "publish"},
        "blog": {"content_dir": blog_content},
    }
    with open(config_path, "w") as f:
        import yaml
        yaml.dump(config_data, f)

    yield {
        "base": base,
        "vault": vault,
        "publish": publish,
        "notes": notes,
        "assets": assets,
        "blog_content": blog_content,
        "config_path": config_path,
    }

    shutil.rmtree(base)


@pytest.fixture
def config(temp_env):
    return SyncConfig(temp_env["config_path"])


# ── Part A: Core Sync ──────────────────────────────

class TestSyncFile:
    def test_sync_copies_file(self, temp_env, config):
        """A1/A2: File in publish/ is copied to blog content."""
        src = os.path.join(temp_env["publish"], "my-post.md")
        with open(src, "w") as f:
            f.write("---\ntitle: Test\n---\n\nHello world")

        result = sync_file(src, config, rewrite_links=False)

        assert result is not None
        dest = os.path.join(temp_env["blog_content"], "my-post.md")
        assert os.path.exists(dest)
        with open(dest) as f:
            assert "Hello world" in f.read()

    def test_sync_skips_non_md(self, temp_env, config):
        """A6: Non-md files are skipped."""
        src = os.path.join(temp_env["publish"], "image.png")
        with open(src, "wb") as f:
            f.write(b"fake png")

        result = sync_file(src, config)
        assert result is None

    def test_sync_creates_target_dir(self, temp_env, config):
        """A9: Target directory created if missing."""
        shutil.rmtree(temp_env["blog_content"])
        assert not os.path.exists(temp_env["blog_content"])

        src = os.path.join(temp_env["publish"], "post.md")
        with open(src, "w") as f:
            f.write("# Post")

        result = sync_file(src, config, rewrite_links=False)
        assert result is not None
        assert os.path.exists(temp_env["blog_content"])

    def test_sync_overwrites_existing(self, temp_env, config):
        """A5: Modified file overwrites target."""
        src = os.path.join(temp_env["publish"], "post.md")
        dest = os.path.join(temp_env["blog_content"], "post.md")

        with open(src, "w") as f:
            f.write("Version 1")
        sync_file(src, config, rewrite_links=False)

        with open(src, "w") as f:
            f.write("Version 2")
        sync_file(src, config, rewrite_links=False)

        with open(dest) as f:
            assert f.read() == "Version 2"

    def test_sync_missing_source(self, config):
        """Source file doesn't exist → returns None."""
        result = sync_file("/nonexistent/post.md", config)
        assert result is None


class TestRemoveSynced:
    def test_remove_existing(self, temp_env, config):
        """A4: Delete from publish → delete from blog."""
        dest = os.path.join(temp_env["blog_content"], "post.md")
        with open(dest, "w") as f:
            f.write("content")

        result = remove_synced(
            os.path.join(temp_env["publish"], "post.md"), config
        )
        assert result is True
        assert not os.path.exists(dest)

    def test_remove_nonexistent(self, temp_env, config):
        """Delete file not in blog → returns False."""
        result = remove_synced(
            os.path.join(temp_env["publish"], "nope.md"), config
        )
        assert result is False


class TestSyncAll:
    def test_sync_all_folder_mode(self, temp_env):
        """Folder mode syncs all .md in publish/."""
        # Override to folder mode
        config_path = temp_env["config_path"]
        import yaml
        with open(config_path) as f:
            cfg = yaml.safe_load(f)
        cfg["publish"]["method"] = "folder"
        with open(config_path, "w") as f:
            yaml.dump(cfg, f)

        config = SyncConfig(config_path)

        # Create 2 posts in publish/
        for name in ["a.md", "b.md"]:
            with open(os.path.join(temp_env["publish"], name), "w") as f:
                f.write(f"# {name}")

        count = sync_all(config)
        assert count == 2
        assert os.path.exists(os.path.join(temp_env["blog_content"], "a.md"))
        assert os.path.exists(os.path.join(temp_env["blog_content"], "b.md"))

    def test_sync_all_cleans_orphans(self, temp_env, config):
        """Orphaned files in blog are removed."""
        # Pre-create an orphan in blog
        orphan = os.path.join(temp_env["blog_content"], "old-post.md")
        with open(orphan, "w") as f:
            f.write("old")

        # No source files
        sync_all(config)
        assert not os.path.exists(orphan)


# ── Part A: Frontmatter Flag Detection ─────────────

class TestFrontmatter:
    def test_parse_valid(self):
        content = "---\ntitle: Test\npublish: true\n---\n\nBody"
        fm = _parse_frontmatter(content)
        assert fm["title"] == "Test"
        assert fm["publish"] is True

    def test_parse_no_frontmatter(self):
        fm = _parse_frontmatter("Just a regular file")
        assert fm == {}

    def test_parse_malformed(self):
        fm = _parse_frontmatter("---\n: bad yaml\n---")
        # Should return empty or whatever yaml.safe_load gives
        assert isinstance(fm, dict)

    def test_has_publish_flag_true(self, temp_env):
        path = os.path.join(temp_env["notes"], "flagged.md")
        with open(path, "w") as f:
            f.write("---\npublish: true\n---\n\nContent")
        assert _has_publish_flag(path) is True

    def test_has_publish_flag_false(self, temp_env):
        path = os.path.join(temp_env["notes"], "private.md")
        with open(path, "w") as f:
            f.write("---\npublish: false\n---\n\nContent")
        assert _has_publish_flag(path) is False

    def test_has_publish_flag_missing(self, temp_env):
        path = os.path.join(temp_env["notes"], "no-flag.md")
        with open(path, "w") as f:
            f.write("---\ntitle: Note\n---\n\nContent")
        assert _has_publish_flag(path) is False


class TestCollectPublishFiles:
    def test_both_mode(self, temp_env, config):
        """Both mode collects from folder + flag."""
        # File in publish/
        folder_file = os.path.join(temp_env["publish"], "folder-post.md")
        with open(folder_file, "w") as f:
            f.write("# From folder")

        # File with flag in notes/
        flag_file = os.path.join(temp_env["notes"], "flagged-post.md")
        with open(flag_file, "w") as f:
            f.write("---\npublish: true\n---\n\n# From flag")

        files = _collect_publish_files(config)
        basenames = [os.path.basename(f) for f in files]
        assert "folder-post.md" in basenames
        assert "flagged-post.md" in basenames


# ── Part B: Image Link Rewriting ───────────────────

class TestImageRewriting:
    def test_obsidian_image_with_log(self):
        """B1: ![[image.png]] → ![image](R2_URL)."""
        upload_log = {"photo.png": "https://r2.example.com/abc123.webp"}
        content = "Here is ![[photo.png]] in text"
        result = _rewrite_image_links(content, upload_log)
        assert "![photo](https://r2.example.com/abc123.webp)" in result
        assert "![[" not in result

    def test_obsidian_image_with_resize(self):
        """B2: ![[image.png|600]] → ![image](R2_URL)."""
        upload_log = {"photo.png": "https://r2.example.com/abc.webp"}
        content = "![[photo.png|600]]"
        result = _rewrite_image_links(content, upload_log)
        assert "![photo](https://r2.example.com/abc.webp)" in result

    def test_image_not_in_log(self):
        """B4: Image not uploaded → keep filename, log warning."""
        content = "![[unknown.png]]"
        result = _rewrite_image_links(content, {})
        assert "![unknown](unknown.png)" in result

    def test_wiki_link_removed(self):
        """B5: [[internal-link]] → plain text."""
        content = "See [[other-note]] for details"
        result = _rewrite_image_links(content, {})
        assert "See other-note for details" in result

    def test_standard_markdown_preserved(self):
        """B6: Standard ![alt](url) unchanged."""
        content = "![alt](https://example.com/img.png)"
        result = _rewrite_image_links(content, {})
        assert content == result

    def test_frontmatter_preserved(self):
        """B7: Frontmatter untouched during rewrite."""
        content = "---\ntitle: Test\npublish: true\n---\n\n![[photo.png]]"
        upload_log = {"photo.png": "https://r2.example.com/x.webp"}
        result = _rewrite_image_links(content, upload_log)
        assert "title: Test" in result
        assert "publish: true" in result


# ── Part A: Notify (Event-driven) ──────────────────

class TestNotify:
    def test_notify_syncs_publish_folder_file(self, temp_env, config):
        src = os.path.join(temp_env["publish"], "event-post.md")
        with open(src, "w") as f:
            f.write("# Event post")

        notify(src, config, deleted=False)
        dest = os.path.join(temp_env["blog_content"], "event-post.md")
        assert os.path.exists(dest)

    def test_notify_deletes(self, temp_env, config):
        dest = os.path.join(temp_env["blog_content"], "gone.md")
        with open(dest, "w") as f:
            f.write("old content")

        src = os.path.join(temp_env["publish"], "gone.md")
        notify(src, config, deleted=True)
        assert not os.path.exists(dest)

    def test_notify_unpublished_removes(self, temp_env, config):
        """File without publish flag → remove from blog."""
        src = os.path.join(temp_env["notes"], "private.md")
        with open(src, "w") as f:
            f.write("---\npublish: false\n---\nPrivate")

        # Pre-create in blog
        dest = os.path.join(temp_env["blog_content"], "private.md")
        with open(dest, "w") as f:
            f.write("old")

        notify(src, config, deleted=False)
        assert not os.path.exists(dest)
