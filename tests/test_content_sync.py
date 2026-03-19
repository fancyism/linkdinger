"""Tests for content_sync module."""

import json
import os
import shutil
import tempfile
from unittest.mock import patch

import pytest  # type: ignore[import-untyped]

from content_sync import (  # pyre-ignore[21]
    SyncConfig,
    _build_generated_filename,
    _build_source_identifier,
    _build_synced_frontmatter,
    _build_translation_request,
    _collect_markdown_files,
    _collect_publish_files,
    _create_translator,
    _default_translation_key,
    _get_managed_output_paths,
    _has_publish_flag,
    _index_posts_by_translation_key,
    _load_project_dotenvs,
    _maybe_normalize_locale_value,
    _normalize_content_frontmatter,
    _normalize_source_relative_path,
    _parse_frontmatter,
    _render_markdown,
    _resolve_target_locales,
    _rewrite_links,
    _should_write_translation,
    _split_frontmatter_content,
    backfill_missing_translations,
    notify,
    remove_synced,
    sync_all,
    sync_file,
    validate_file_for_publish,
    validate_publish_files,
)
from translation_service import TranslationError


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
        "translation": {
            "enabled": True,
            "provider": "zai",
            "model": "glm-5",
            "api_key_env": "ZAI_API_KEY",
            "frontmatter_flag": "autoTranslate",
            "require_review": True,
            "overwrite_machine_translations": True,
            "targets": {"en": ["th"], "th": ["en"]},
        },
    }
    with open(config_path, "w") as f:
        import yaml  # pyre-ignore[21]

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


class TestTranslationHelpers:
    def test_split_and_render_round_trip(self):
        content = "---\ntitle: Test\nlocale: en\n---\n\n# Body\n"

        frontmatter, body = _split_frontmatter_content(content)
        rendered = _render_markdown(frontmatter, body)

        assert frontmatter["title"] == "Test"
        assert body == "# Body\n"
        assert rendered.startswith("---\ntitle: Test\nlocale: en\n---\n\n")
        assert "# Body" in rendered

    def test_parse_frontmatter_handles_utf8_bom(self):
        frontmatter = _parse_frontmatter("\ufeff---\npublish: true\ntitle: Test\n---\n")

        assert frontmatter["publish"] is True
        assert frontmatter["title"] == "Test"

    def test_split_frontmatter_handles_utf8_bom(self):
        frontmatter, body = _split_frontmatter_content(
            "\ufeff---\ntitle: Test\nlocale: th\n---\n\n# Body\n"
        )

        assert frontmatter["locale"] == "th"
        assert body == "# Body\n"

    def test_normalize_source_relative_path_falls_back_when_relpath_fails(self, temp_env, config):
        source_path = os.path.join(temp_env["publish"], "post.md")

        with patch("content_sync.os.path.relpath", side_effect=ValueError):
            result = _normalize_source_relative_path(source_path, config)

        assert result == source_path.replace("\\", "/")

    def test_build_source_identifier_is_stable(self, temp_env, config):
        source_path = os.path.join(temp_env["publish"], "post.md")

        first = _build_source_identifier(source_path, config)
        second = _build_source_identifier(source_path, config)

        assert first == second
        assert len(first) == 16

    def test_load_project_dotenvs_checks_root_then_blog_env(self):
        seen: list[str] = []
        blog_env_path = os.path.join("blog", ".env")

        def fake_exists(path):
            return path in {".env", blog_env_path}

        def fake_load(path, override=False):
            seen.append(f"{path}:{override}")
            return True

        with patch("content_sync.os.path.exists", side_effect=fake_exists):
            with patch("content_sync.load_dotenv", side_effect=fake_load):
                loaded = _load_project_dotenvs()

        assert loaded == [".env", blog_env_path]
        assert seen == [".env:False", f"{blog_env_path}:False"]

    def test_default_translation_key_normalizes_filename(self):
        assert _default_translation_key("My Fancy Post!!.md") == "my-fancy-post"

    def test_maybe_normalize_locale_value_ignores_invalid_values(self):
        assert _maybe_normalize_locale_value(" TH ") == "th"
        assert _maybe_normalize_locale_value("") is None
        assert _maybe_normalize_locale_value(None) is None

    def test_resolve_target_locales_dedupes_and_ignores_invalid_entries(self, config):
        config.translation_targets["en"] = ["th", "TH", "", "en", None]

        result = _resolve_target_locales(
            {"autoTranslate": True},
            config,
            source_locale="en",
        )

        assert result == ["th"]

    def test_resolve_target_locales_accepts_explicit_locale_list(self, config):
        result = _resolve_target_locales(
            {"autoTranslate": ["th", "ja", "th"]},
            config,
            source_locale="en",
        )

        assert result == ["th", "ja"]

    def test_build_generated_filename_uses_translation_key_and_sanitizes(self):
        filename = _build_generated_filename(
            {"translationKey": 'new:post/name?*"'},
            "fallback.md",
        )

        assert filename == "new-post-name-.md"

    def test_build_synced_frontmatter_adds_sync_metadata(self, temp_env, config):
        source_path = os.path.join(temp_env["publish"], "post.md")
        frontmatter = _build_synced_frontmatter({"title": "Post"}, source_path, config)

        assert frontmatter["locale"] == "en"
        assert frontmatter["translationKey"] == "post"
        assert frontmatter["canonicalLocale"] == "en"
        assert "_syncSourceId" in frontmatter

    def test_normalize_content_frontmatter_keeps_pairing_without_sync_metadata(self):
        frontmatter = _normalize_content_frontmatter({"title": "Post"}, "post.md")

        assert frontmatter["locale"] == "en"
        assert frontmatter["translationKey"] == "post"
        assert frontmatter["canonicalLocale"] == "en"
        assert "_syncSourceId" not in frontmatter

    def test_build_translation_request_normalizes_optional_fields(self):
        request = _build_translation_request(
            {
                "title": "Title",
                "excerpt": "Excerpt",
                "category": "Tech",
                "tags": [" AI ", "", "ML"],
                "faq": "invalid",
                "howTo": {"name": "invalid"},
            },
            "# Body",
            source_locale="en",
            target_locale="th",
        )

        assert request.source_locale == "en"
        assert request.target_locale == "th"
        assert request.tags == ["AI", "ML"]
        assert request.faq is None
        assert request.how_to is None

    def test_create_translator_validates_provider(self, config):
        config.translation_provider = "unsupported"

        with pytest.raises(TranslationError, match="Unsupported translation provider"):
            _create_translator(config)

    def test_create_translator_requires_api_key(self, config):
        with patch.dict(os.environ, {}, clear=True):
            config.translation_provider = "zai"
            config.translation_api_key_env = None
            with pytest.raises(TranslationError, match="ZAI_API_KEY is not set") as exc_info:
                _create_translator(config)
        assert os.path.join("blog", ".env") in str(exc_info.value)

    def test_create_translator_uses_configured_model(self, config):
        class FakeTranslator:
            def __init__(self, api_key, model, **kwargs):
                self.api_key = api_key
                self.model = model
                self.kwargs = kwargs

        config.translation_provider = "zai"
        config.translation_api_key_env = None
        config.translation_api_base_url = None
        with patch.dict(os.environ, {"ZAI_API_KEY": "test-key"}, clear=False):
            with patch("content_sync.OpenAITranslator", FakeTranslator):
                translator = _create_translator(config)

        assert translator.api_key == "test-key"
        assert translator.model == config.translation_model
        assert translator.kwargs["provider_name"] == "zai"
        assert translator.kwargs["base_url"] == "https://api.z.ai/api/paas/v4/"

    def test_create_translator_honors_custom_key_env_and_base_url(self, config):
        class FakeTranslator:
            def __init__(self, api_key, model, **kwargs):
                self.api_key = api_key
                self.model = model
                self.kwargs = kwargs

        config.translation_provider = "gemini"
        config.translation_api_key_env = "CUSTOM_TRANSLATION_KEY"
        config.translation_api_base_url = "https://example.invalid/openai/"

        with patch.dict(os.environ, {"CUSTOM_TRANSLATION_KEY": "custom-key"}, clear=False):
            with patch("content_sync.OpenAITranslator", FakeTranslator):
                translator = _create_translator(config)

        assert translator.api_key == "custom-key"
        assert translator.kwargs["provider_name"] == "gemini"
        assert translator.kwargs["base_url"] == "https://example.invalid/openai/"

    def test_should_write_translation_allows_managed_machine_file(self, temp_env, config):
        dest = os.path.join(temp_env["blog_content"], "th", "post.md")
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        with open(dest, "w", encoding="utf-8") as f:
            f.write("---\n_syncSourceId: abc123\nmachineTranslated: true\n---\n\nbody")

        assert _should_write_translation(dest, "abc123", config) is True

    def test_should_write_translation_rejects_manual_or_unmanaged_files(self, temp_env, config):
        dest = os.path.join(temp_env["blog_content"], "th", "post.md")
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        with open(dest, "w", encoding="utf-8") as f:
            f.write("---\ntitle: Manual\n---\n\nbody")

        assert _should_write_translation(dest, "abc123", config) is False
        assert _should_write_translation(dest, None, config) is False

    def test_collect_markdown_files_and_index_posts_by_translation_key(self, temp_env):
        en_dir = os.path.join(temp_env["blog_content"], "en")
        th_dir = os.path.join(temp_env["blog_content"], "th")
        os.makedirs(en_dir, exist_ok=True)
        os.makedirs(th_dir, exist_ok=True)

        en_file = os.path.join(en_dir, "post.md")
        th_file = os.path.join(th_dir, "post.md")
        with open(en_file, "w", encoding="utf-8") as f:
            f.write("---\nlocale: en\ntranslationKey: pair\n---\n\nEN")
        with open(th_file, "w", encoding="utf-8") as f:
            f.write("---\nlocale: th\ntranslationKey: pair\n---\n\nTH")

        files = _collect_markdown_files(temp_env["blog_content"])
        index = _index_posts_by_translation_key(files)

        assert files == [en_file, th_file]
        assert index["pair"]["en"] == en_file
        assert index["pair"]["th"] == th_file

    def test_get_managed_output_paths_returns_all_files_for_source(self, temp_env, config):
        src = os.path.join(temp_env["publish"], "managed.md")
        source_id = _build_source_identifier(src, config)
        en_dir = os.path.join(temp_env["blog_content"], "en")
        th_dir = os.path.join(temp_env["blog_content"], "th")
        os.makedirs(en_dir, exist_ok=True)
        os.makedirs(th_dir, exist_ok=True)

        for path in [os.path.join(en_dir, "managed.md"), os.path.join(th_dir, "managed.md")]:
            with open(path, "w", encoding="utf-8") as f:
                f.write(f"---\n_syncSourceId: {source_id}\n---\n\nbody")

        managed_paths = _get_managed_output_paths(src, config)

        assert managed_paths == [
            os.path.join(en_dir, "managed.md"),
            os.path.join(th_dir, "managed.md"),
        ]


class TestSyncFile:
    def test_sync_copies_file(self, temp_env, config):
        """A1/A2: File in publish/ is copied to blog content."""
        src = os.path.join(temp_env["publish"], "my-post.md")
        with open(src, "w") as f:
            f.write("---\ntitle: Test\ndate: 2026-03-02\n---\n\nHello world")

        result = sync_file(src, config, rewrite_links=False)

        assert result is not None
        dest = os.path.join(temp_env["blog_content"], "en", "my-post.md")
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
            f.write("---\ntitle: Post\ndate: 2026-03-02\n---\n\n# Post")

        result = sync_file(src, config, rewrite_links=False)
        assert result is not None
        assert os.path.exists(temp_env["blog_content"])

    def test_sync_overwrites_existing(self, temp_env, config):
        """A5: Modified file overwrites target."""
        src = os.path.join(temp_env["publish"], "post.md")
        dest = os.path.join(temp_env["blog_content"], "en", "post.md")

        with open(src, "w") as f:
            f.write("---\ntitle: Post\ndate: 2026-03-02\n---\n\nVersion 1")
        sync_file(src, config, rewrite_links=False)

        with open(src, "w") as f:
            f.write("---\ntitle: Post\ndate: 2026-03-02\n---\n\nVersion 2")
        sync_file(src, config, rewrite_links=False)

        with open(dest) as f:
            saved = f.read()
            assert "Version 2" in saved
            assert "Version 1" not in saved

    def test_sync_missing_source(self, config):
        """Source file doesn't exist → returns None."""
        result = sync_file("/nonexistent/post.md", config)
        assert result is None

    def test_sync_auto_translates_opted_in_post(self, temp_env, config):
        """Opted-in posts generate translated sibling files at publish time."""

        class FakeTranslator:
            def __init__(self, api_key, model, **kwargs):
                self.api_key = api_key
                self.model = model

            def translate_markdown(self, request):
                assert request.source_locale == "en"
                assert request.target_locale == "th"
                return type(
                    "TranslatedPost",
                    (),
                    {
                        "title": "สวัสดีโลก",
                        "excerpt": "บทความแปลภาษาไทย",
                        "body": "# เนื้อหาภาษาไทย",
                        "category": "เทค",
                        "tags": ["AI", "ไทย"],
                        "faq": None,
                        "how_to": None,
                    },
                )()

        src = os.path.join(temp_env["publish"], "autotranslate.md")
        with open(src, "w", encoding="utf-8") as f:
            f.write(
                "---\n"
                "title: Hello World\n"
                "date: 2026-03-02\n"
                "locale: en\n"
                "excerpt: English source\n"
                "tags:\n"
                "  - AI\n"
                "autoTranslate: true\n"
                "---\n\n"
                "# English body"
            )

        with patch.dict(os.environ, {"ZAI_API_KEY": "test-key"}, clear=False):
            with patch("content_sync.OpenAITranslator", FakeTranslator):
                result = sync_file(src, config, rewrite_links=False)

        assert result is not None

        source_dest = os.path.join(temp_env["blog_content"], "en", "autotranslate.md")
        translated_dest = os.path.join(temp_env["blog_content"], "th", "autotranslate.md")
        assert os.path.exists(source_dest)
        assert os.path.exists(translated_dest)

        with open(source_dest, encoding="utf-8") as f:
            source_content = f.read()
        with open(translated_dest, encoding="utf-8") as f:
            translated_content = f.read()

        source_frontmatter = _parse_frontmatter(source_content)
        translated_frontmatter = _parse_frontmatter(translated_content)

        assert source_frontmatter["locale"] == "en"
        assert translated_frontmatter["locale"] == "th"
        assert translated_frontmatter["title"] == "สวัสดีโลก"
        assert translated_frontmatter["machineTranslated"] is True
        assert translated_frontmatter["needsReview"] is True
        assert translated_frontmatter["translatedFromLocale"] == "en"
        assert translated_frontmatter["_syncSourceId"] == source_frontmatter["_syncSourceId"]
        assert "# เนื้อหาภาษาไทย" in translated_content

    def test_sync_does_not_overwrite_manual_translation(self, temp_env, config):
        """Auto-translation must not clobber human-maintained locale files."""

        class FakeTranslator:
            def __init__(self, api_key, model, **kwargs):
                self.api_key = api_key
                self.model = model

            def translate_markdown(self, request):
                return type(
                    "TranslatedPost",
                    (),
                    {
                        "title": "แปลอัตโนมัติ",
                        "excerpt": "ไม่ควรเขียนทับ",
                        "body": "# ระบบไม่ควรทับไฟล์นี้",
                        "category": "เทค",
                        "tags": ["AI"],
                        "faq": None,
                        "how_to": None,
                    },
                )()

        src = os.path.join(temp_env["publish"], "manual-clash.md")
        with open(src, "w", encoding="utf-8") as f:
            f.write(
                "---\n"
                "title: Source Post\n"
                "date: 2026-03-02\n"
                "locale: en\n"
                "autoTranslate: true\n"
                "---\n\n"
                "# Source body"
            )

        manual_dest_dir = os.path.join(temp_env["blog_content"], "th")
        os.makedirs(manual_dest_dir, exist_ok=True)
        manual_dest = os.path.join(manual_dest_dir, "manual-clash.md")
        with open(manual_dest, "w", encoding="utf-8") as f:
            f.write(
                "---\ntitle: Human Translation\ndate: 2026-03-02\nlocale: th\n---\n\n# Human body"
            )

        with patch.dict(os.environ, {"ZAI_API_KEY": "test-key"}, clear=False):
            with patch("content_sync.OpenAITranslator", FakeTranslator):
                result = sync_file(src, config, rewrite_links=False)

        assert result is not None
        with open(manual_dest, encoding="utf-8") as f:
            saved = f.read()

        assert "Human Translation" in saved
        assert "ระบบไม่ควรทับไฟล์นี้" not in saved

    def test_sync_keeps_source_when_translation_fails(self, temp_env, config):
        """Translation errors should not block the primary source publish."""

        class FailingTranslator:
            def __init__(self, api_key, model, **kwargs):
                raise TranslationError("boom")

        src = os.path.join(temp_env["publish"], "translation-fails.md")
        with open(src, "w", encoding="utf-8") as f:
            f.write(
                "---\n"
                "title: Source Post\n"
                "date: 2026-03-02\n"
                "locale: en\n"
                "autoTranslate: true\n"
                "---\n\n"
                "# Source body"
            )

        with patch.dict(os.environ, {"ZAI_API_KEY": "test-key"}, clear=False):
            with patch("content_sync.OpenAITranslator", FailingTranslator):
                result = sync_file(src, config, rewrite_links=False)

        assert result is not None
        assert os.path.exists(os.path.join(temp_env["blog_content"], "en", "translation-fails.md"))
        assert not os.path.exists(
            os.path.join(temp_env["blog_content"], "th", "translation-fails.md")
        )

    def test_sync_continues_when_one_target_locale_fails(self, temp_env, config):
        """A failure in one target locale should not block the remaining targets."""

        class FlakyTranslator:
            def __init__(self, api_key, model, **kwargs):
                self.api_key = api_key
                self.model = model

            def translate_markdown(self, request):
                if request.target_locale == "th":
                    raise TranslationError("th failed")

                return type(
                    "TranslatedPost",
                    (),
                    {
                        "title": "Japanese Draft",
                        "excerpt": "JA draft",
                        "body": "# Japanese body",
                        "category": "Tech",
                        "tags": ["AI"],
                        "faq": None,
                        "how_to": None,
                    },
                )()

        config.translation_targets["en"] = ["th", "ja"]
        src = os.path.join(temp_env["publish"], "multi-target.md")
        with open(src, "w", encoding="utf-8") as f:
            f.write(
                "---\n"
                "title: Source Post\n"
                "date: 2026-03-02\n"
                "locale: en\n"
                "autoTranslate: true\n"
                "---\n\n"
                "# Source body"
            )

        with patch.dict(os.environ, {"ZAI_API_KEY": "test-key"}, clear=False):
            with patch("content_sync.OpenAITranslator", FlakyTranslator):
                result = sync_file(src, config, rewrite_links=False)

        assert result is not None
        assert not os.path.exists(os.path.join(temp_env["blog_content"], "th", "multi-target.md"))
        assert os.path.exists(os.path.join(temp_env["blog_content"], "ja", "multi-target.md"))


class TestRemoveSynced:
    def test_remove_existing(self, temp_env, config):
        """A4: Delete from publish → delete from blog."""
        src = os.path.join(temp_env["publish"], "post.md")
        with open(src, "w", encoding="utf-8") as f:
            f.write("---\ntitle: Post\ndate: 2026-03-02\nlocale: en\n---\n\nBody")

        sync_file(src, config, rewrite_links=False)
        dest = os.path.join(temp_env["blog_content"], "en", "post.md")

        result = remove_synced(src, config)
        assert result is True
        assert not os.path.exists(dest)

    def test_remove_existing_also_cleans_generated_translations(self, temp_env, config):
        """Deleting a source removes every managed locale artifact for that source."""

        class FakeTranslator:
            def __init__(self, api_key, model, **kwargs):
                self.api_key = api_key
                self.model = model

            def translate_markdown(self, request):
                return type(
                    "TranslatedPost",
                    (),
                    {
                        "title": "โพสต์แปลแล้ว",
                        "excerpt": "บทความแปล",
                        "body": "# เวอร์ชันภาษาไทย",
                        "category": "เทค",
                        "tags": ["AI"],
                        "faq": None,
                        "how_to": None,
                    },
                )()

        src = os.path.join(temp_env["publish"], "remove-with-translation.md")
        with open(src, "w", encoding="utf-8") as f:
            f.write(
                "---\n"
                "title: Source Post\n"
                "date: 2026-03-02\n"
                "locale: en\n"
                "autoTranslate: true\n"
                "---\n\n"
                "# Source body"
            )

        with patch.dict(os.environ, {"ZAI_API_KEY": "test-key"}, clear=False):
            with patch("content_sync.OpenAITranslator", FakeTranslator):
                sync_file(src, config, rewrite_links=False)

        assert os.path.exists(
            os.path.join(temp_env["blog_content"], "en", "remove-with-translation.md")
        )
        assert os.path.exists(
            os.path.join(temp_env["blog_content"], "th", "remove-with-translation.md")
        )

        result = remove_synced(src, config)

        assert result is True
        assert not os.path.exists(
            os.path.join(temp_env["blog_content"], "en", "remove-with-translation.md")
        )
        assert not os.path.exists(
            os.path.join(temp_env["blog_content"], "th", "remove-with-translation.md")
        )

    def test_remove_nonexistent(self, temp_env, config):
        """Delete file not in blog → returns False."""
        result = remove_synced(os.path.join(temp_env["publish"], "nope.md"), config)
        assert result is False


class TestSyncAll:
    def test_sync_all_folder_mode(self, temp_env):
        """Folder mode syncs all .md in publish/."""
        # Override to folder mode
        config_path = temp_env["config_path"]
        import yaml  # pyre-ignore[21]

        with open(config_path) as f:
            cfg = yaml.safe_load(f)
        cfg["publish"]["method"] = "folder"
        with open(config_path, "w") as f:
            yaml.dump(cfg, f)

        config = SyncConfig(config_path)

        # Create 2 posts in publish/
        for name in ["a.md", "b.md"]:
            with open(os.path.join(temp_env["publish"], name), "w") as f:
                f.write(f"---\ntitle: {name}\ndate: 2026-03-02\n---\n\n# {name}")

        count = sync_all(config)
        assert count == 2
        assert os.path.exists(os.path.join(temp_env["blog_content"], "en", "a.md"))
        assert os.path.exists(os.path.join(temp_env["blog_content"], "en", "b.md"))

    def test_sync_all_cleans_orphans(self, temp_env, config):
        """Orphaned files in blog are removed."""
        # Pre-create an orphan in blog
        orphan_dir = os.path.join(temp_env["blog_content"], "en")
        os.makedirs(orphan_dir, exist_ok=True)
        orphan = os.path.join(orphan_dir, "old-post.md")
        with open(orphan, "w", encoding="utf-8") as f:
            f.write(
                "---\n"
                "title: Old\n"
                "date: 2026-03-02\n"
                "locale: en\n"
                "_syncSourceId: orphan123\n"
                "---\n\n"
                "old"
            )

        # No source files
        sync_all(config)
        assert not os.path.exists(orphan)

    def test_sync_all_preserves_unmanaged_content(self, temp_env, config):
        """Manual or backfilled content without sync provenance should survive cleanup."""
        manual_dir = os.path.join(temp_env["blog_content"], "th")
        os.makedirs(manual_dir, exist_ok=True)
        manual_post = os.path.join(manual_dir, "manual-post.md")
        with open(manual_post, "w", encoding="utf-8") as f:
            f.write(
                "---\n"
                "title: Manual\n"
                "date: 2026-03-02\n"
                "locale: th\n"
                "translationKey: manual-post\n"
                "---\n\n"
                "manual"
            )

        sync_all(config)
        assert os.path.exists(manual_post)

    def test_sync_routes_post_to_locale_subdirectory(self, temp_env, config):
        """Locale frontmatter writes content into the matching locale folder."""
        src = os.path.join(temp_env["publish"], "thai-post.md")
        with open(src, "w", encoding="utf-8") as f:
            f.write("---\ntitle: Thai Post\ndate: 2026-03-02\nlocale: th\n---\n\nSawasdee")

        result = sync_file(src, config, rewrite_links=False)

        assert result is not None
        assert result.endswith(os.path.join("th", "thai-post.md"))
        assert os.path.exists(os.path.join(temp_env["blog_content"], "th", "thai-post.md"))


class TestBackfillTranslations:
    def test_backfill_returns_zero_when_translation_disabled(self, config):
        config.translation_enabled = False

        assert backfill_missing_translations(config) == 0

    def test_backfill_returns_zero_when_no_content_exists(self, temp_env, config):
        assert backfill_missing_translations(config) == 0

    def test_backfill_creates_missing_locale_sibling(self, temp_env, config):
        class FakeTranslator:
            def __init__(self, api_key, model, **kwargs):
                self.api_key = api_key
                self.model = model

            def translate_markdown(self, request):
                assert request.source_locale == "en"
                assert request.target_locale == "th"
                return type(
                    "TranslatedPost",
                    (),
                    {
                        "title": "สวัสดีจากระบบ",
                        "excerpt": "บทความแปลแล้ว",
                        "body": "# เวอร์ชันภาษาไทย",
                        "category": "เทค",
                        "tags": ["AI", "ไทย"],
                        "faq": None,
                        "how_to": None,
                    },
                )()

        source_dir = os.path.join(temp_env["blog_content"], "en")
        os.makedirs(source_dir, exist_ok=True)
        source_path = os.path.join(source_dir, "hello-world.md")
        with open(source_path, "w", encoding="utf-8") as f:
            f.write(
                "---\n"
                "title: Hello World\n"
                "date: 2026-03-02\n"
                "locale: en\n"
                "translationKey: hello-world\n"
                "canonicalLocale: en\n"
                "excerpt: English source\n"
                "---\n\n"
                "# English body"
            )

        with patch.dict(os.environ, {"ZAI_API_KEY": "test-key"}, clear=False):
            with patch("content_sync.OpenAITranslator", FakeTranslator):
                count = backfill_missing_translations(config)

        assert count == 1
        translated_path = os.path.join(temp_env["blog_content"], "th", "hello-world.md")
        assert os.path.exists(translated_path)
        with open(translated_path, encoding="utf-8") as f:
            translated = f.read()
        frontmatter = _parse_frontmatter(translated)
        assert frontmatter["locale"] == "th"
        assert frontmatter["translationKey"] == "hello-world"
        assert frontmatter["slug"] == "hello-world"
        assert frontmatter["machineTranslated"] is True

    def test_backfill_uses_translation_key_for_generated_filename(self, temp_env, config):
        class FakeTranslator:
            def __init__(self, api_key, model, **kwargs):
                self.api_key = api_key
                self.model = model

            def translate_markdown(self, request):
                return type(
                    "TranslatedPost",
                    (),
                    {
                        "title": "Translated",
                        "excerpt": "Translated excerpt",
                        "body": "# Body",
                        "category": "Tech",
                        "tags": ["AI"],
                        "faq": None,
                        "how_to": None,
                    },
                )()

        source_dir = os.path.join(temp_env["blog_content"], "th")
        os.makedirs(source_dir, exist_ok=True)
        source_path = os.path.join(source_dir, "Context Engineer.md")
        with open(source_path, "w", encoding="utf-8") as f:
            f.write(
                "---\n"
                "title: Thai Source\n"
                "date: 2026-03-02\n"
                "locale: th\n"
                "translationKey: context-engineer\n"
                "canonicalLocale: th\n"
                "---\n\n"
                "# Thai body"
            )

        with patch.dict(os.environ, {"ZAI_API_KEY": "test-key"}, clear=False):
            with patch("content_sync.OpenAITranslator", FakeTranslator):
                count = backfill_missing_translations(config)

        assert count == 1
        assert os.path.exists(os.path.join(temp_env["blog_content"], "en", "context-engineer.md"))

    def test_backfill_skips_existing_translation_pair(self, temp_env, config):
        class FakeTranslator:
            def __init__(self, api_key, model, **kwargs):
                raise AssertionError("translator should not run when pair already exists")

        en_dir = os.path.join(temp_env["blog_content"], "en")
        th_dir = os.path.join(temp_env["blog_content"], "th")
        os.makedirs(en_dir, exist_ok=True)
        os.makedirs(th_dir, exist_ok=True)

        with open(os.path.join(en_dir, "pair.md"), "w", encoding="utf-8") as f:
            f.write(
                "---\n"
                "title: Pair EN\n"
                "date: 2026-03-02\n"
                "locale: en\n"
                "translationKey: pair-post\n"
                "---\n\n"
                "# EN"
            )

        with open(os.path.join(th_dir, "pair.md"), "w", encoding="utf-8") as f:
            f.write(
                "---\n"
                "title: Pair TH\n"
                "date: 2026-03-02\n"
                "locale: th\n"
                "translationKey: pair-post\n"
                "---\n\n"
                "# TH"
            )

        with patch.dict(os.environ, {"ZAI_API_KEY": "test-key"}, clear=False):
            with patch("content_sync.OpenAITranslator", FakeTranslator):
                count = backfill_missing_translations(config)

        assert count == 0


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

    def test_has_publish_flag_true_with_utf8_bom(self, temp_env):
        path = os.path.join(temp_env["notes"], "flagged-bom.md")
        with open(path, "w", encoding="utf-8") as f:
            f.write("\ufeff---\npublish: true\n---\n\nContent")
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
        result = _rewrite_links(content, upload_log)
        assert "![photo](https://r2.example.com/abc123.webp)" in result
        assert "![[" not in result

    def test_obsidian_image_with_resize(self):
        """B2: ![[image.png|600]] → ![image](R2_URL)."""
        upload_log = {"photo.png": "https://r2.example.com/abc.webp"}
        content = "![[photo.png|600]]"
        result = _rewrite_links(content, upload_log)
        assert "![photo](https://r2.example.com/abc.webp)" in result

    def test_image_not_in_log(self):
        """B4: Image not uploaded → keep filename, log warning."""
        content = "![[unknown.png]]"
        result = _rewrite_links(content, {})
        assert "![unknown](unknown.png)" in result

    def test_wiki_link_converted(self):
        """B5: [[internal-link]] → markdown link."""
        content = "See [[other-note]] for details"
        result = _rewrite_links(content, {})
        assert "See [other-note](/blog/other-note) for details" in result

    def test_wiki_link_with_alias(self):
        """B5b: [[Filename|Alias]] → markdown link."""
        content = "See [[other-note|this note]] for details"
        result = _rewrite_links(content, {})
        assert "See [this note](/blog/other-note) for details" in result

    def test_standard_markdown_preserved(self):
        """B6: Standard ![alt](url) unchanged."""
        content = "![alt](https://example.com/img.png)"
        result = _rewrite_links(content, {})
        assert content == result

    def test_frontmatter_preserved(self):
        """B7: Frontmatter untouched during rewrite."""
        content = "---\ntitle: Test\npublish: true\n---\n\n![[photo.png]]"
        upload_log = {"photo.png": "https://r2.example.com/x.webp"}
        result = _rewrite_links(content, upload_log)
        assert "title: Test" in result
        assert "publish: true" in result


# ── Part A: Notify (Event-driven) ──────────────────


class TestNotify:
    def test_notify_syncs_publish_folder_file(self, temp_env, config):
        src = os.path.join(temp_env["publish"], "event-post.md")
        with open(src, "w") as f:
            f.write("---\ntitle: Event post\ndate: 2026-03-02\n---\n\n# Event post")

        notify(src, config, deleted=False)
        dest = os.path.join(temp_env["blog_content"], "en", "event-post.md")
        assert os.path.exists(dest)

    def test_notify_deletes(self, temp_env, config):
        src = os.path.join(temp_env["publish"], "gone.md")
        with open(src, "w", encoding="utf-8") as f:
            f.write("---\ntitle: Gone\ndate: 2026-03-02\nlocale: en\n---\n\nOld content")

        sync_file(src, config, rewrite_links=False)
        dest = os.path.join(temp_env["blog_content"], "en", "gone.md")
        notify(src, config, deleted=True)
        assert not os.path.exists(dest)

    def test_notify_unpublished_removes(self, temp_env, config):
        """File without publish flag → remove from blog."""
        src = os.path.join(temp_env["notes"], "private.md")
        with open(src, "w") as f:
            f.write("---\ntitle: Private\ndate: 2026-03-02\npublish: true\n---\nPrivate")

        sync_file(src, config, rewrite_links=False)
        with open(src, "w") as f:
            f.write("---\ntitle: Private\ndate: 2026-03-02\npublish: false\n---\nPrivate")

        dest = os.path.join(temp_env["blog_content"], "en", "private.md")

        notify(src, config, deleted=False)
        assert not os.path.exists(dest)


class TestValidation:
    def test_validate_file_missing_required_frontmatter(self, temp_env, config):
        src = os.path.join(temp_env["publish"], "invalid-frontmatter.md")
        with open(src, "w") as f:
            f.write("---\npublish: true\n---\n\nBody")

        issues = validate_file_for_publish(src, config)
        assert "missing required frontmatter: title" in issues
        assert "missing required frontmatter: date" in issues

        result = sync_file(src, config)
        assert result is None

    def test_validate_file_broken_obsidian_image(self, temp_env, config):
        src = os.path.join(temp_env["publish"], "broken-image.md")
        with open(src, "w") as f:
            f.write("---\ntitle: Broken image\ndate: 2026-03-02\n---\n\nImage: ![[missing.png]]\n")

        issues = validate_file_for_publish(src, config)
        assert "image not found in upload log: missing.png" in issues

        result = sync_file(src, config)
        assert result is None
        dest = os.path.join(temp_env["blog_content"], "en", "broken-image.md")
        assert not os.path.exists(dest)

    def test_validate_publish_files_duplicate_slug(self, temp_env, config):
        src_publish = os.path.join(temp_env["publish"], "dup.md")
        src_flagged = os.path.join(temp_env["notes"], "dup.md")

        with open(src_publish, "w") as f:
            f.write("---\ntitle: Dup A\ndate: 2026-03-02\n---\n\nFrom publish")

        with open(src_flagged, "w") as f:
            f.write("---\ntitle: Dup B\ndate: 2026-03-02\npublish: true\n---\n\nFrom notes")

        candidates = _collect_publish_files(config)
        valid_files, errors = validate_publish_files(candidates, config)

        assert valid_files == []
        assert src_publish in errors
        assert src_flagged in errors
        assert any("duplicate slug" in issue for issue in errors[src_publish])
        assert any("duplicate slug" in issue for issue in errors[src_flagged])

        count = sync_all(config)
        assert count == 0
        assert not os.path.exists(os.path.join(temp_env["blog_content"], "en", "dup.md"))
