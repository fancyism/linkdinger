"""Tests for translation_service module."""

from types import SimpleNamespace

import pytest  # type: ignore[import-untyped]

from translation_service import (
    OpenAITranslator,
    TranslationError,
    TranslationRequest,
    _extract_chat_completion_text,
    _parse_translation_result,
    get_provider_config,
)


class TestProviderConfig:
    def test_get_provider_config_for_zai(self):
        provider = get_provider_config("zai")

        assert provider.name == "zai"
        assert provider.api_key_env == "ZAI_API_KEY"
        assert provider.base_url == "https://api.z.ai/api/paas/v4/"

    def test_get_provider_config_for_gemini(self):
        provider = get_provider_config("gemini")

        assert provider.name == "gemini"
        assert provider.api_key_env == "GEMINI_API_KEY"
        assert provider.base_url == "https://generativelanguage.googleapis.com/v1beta/openai/"

    def test_get_provider_config_rejects_unsupported_provider(self):
        with pytest.raises(TranslationError, match="Unsupported translation provider"):
            get_provider_config("unknown")


class TestResponseParsing:
    def test_extract_chat_completion_text_from_string_content(self):
        response = SimpleNamespace(
            choices=[
                SimpleNamespace(
                    message=SimpleNamespace(content='{"title":"A","excerpt":"B","body":"C"}')
                )
            ]
        )

        assert _extract_chat_completion_text(response) == '{"title":"A","excerpt":"B","body":"C"}'

    def test_extract_chat_completion_text_from_content_blocks(self):
        response = SimpleNamespace(
            choices=[
                SimpleNamespace(
                    message=SimpleNamespace(
                        content=[
                            {"type": "text", "text": '{"title":"A","excerpt":"B","body":"C"}'},
                        ]
                    )
                )
            ]
        )

        assert _extract_chat_completion_text(response) == '{"title":"A","excerpt":"B","body":"C"}'

    def test_extract_chat_completion_text_requires_choices(self):
        response = SimpleNamespace(choices=[])

        with pytest.raises(TranslationError, match="did not contain any choices"):
            _extract_chat_completion_text(response)

    def test_parse_translation_result_normalizes_lists(self):
        result = _parse_translation_result(
            """
            {
              "title": "Translated",
              "excerpt": "Summary",
              "category": "Tech",
              "tags": ["AI", "  ML  ", ""],
              "faq": [{"question": "Q1", "answer": "A1"}],
              "how_to": [{"name": "Step 1", "text": "Do it"}],
              "body": "# Hello"
            }
            """
        )

        assert result.title == "Translated"
        assert result.tags == ["AI", "ML"]
        assert result.faq == [{"question": "Q1", "answer": "A1"}]
        assert result.how_to == [{"name": "Step 1", "text": "Do it"}]

    def test_parse_translation_result_requires_title_and_body(self):
        with pytest.raises(TranslationError, match="missing required fields"):
            _parse_translation_result('{"title":"","excerpt":"x","body":""}')


class TestOpenAITranslator:
    def test_translate_markdown_uses_chat_completions_json_mode(self):
        captured: dict[str, object] = {}

        class FakeCompletions:
            def create(self, **kwargs):
                captured.update(kwargs)
                return SimpleNamespace(
                    choices=[
                        SimpleNamespace(
                            message=SimpleNamespace(
                                content='{"title":"TH","excerpt":"sum","category":"Tech","tags":["AI"],"faq":null,"how_to":null,"body":"# Thai"}'
                            )
                        )
                    ]
                )

        fake_client = SimpleNamespace(chat=SimpleNamespace(completions=FakeCompletions()))
        translator = OpenAITranslator(
            api_key="test-key",
            model="glm-5",
            provider_name="zai",
            client=fake_client,
        )

        result = translator.translate_markdown(
            TranslationRequest(
                source_locale="en",
                target_locale="th",
                title="Hello",
                excerpt="Summary",
                category="Tech",
                tags=["AI"],
                body="# Body",
            )
        )

        assert result.title == "TH"
        assert captured["model"] == "glm-5"
        assert captured["response_format"] == {"type": "json_object"}
        assert captured["temperature"] == 0.2
        messages = captured["messages"]
        assert isinstance(messages, list)
        assert messages[0]["role"] == "system"
        assert messages[1]["role"] == "user"

    def test_translate_markdown_rejects_empty_response(self):
        class FakeCompletions:
            def create(self, **kwargs):
                return SimpleNamespace(
                    choices=[SimpleNamespace(message=SimpleNamespace(content=""))]
                )

        fake_client = SimpleNamespace(chat=SimpleNamespace(completions=FakeCompletions()))
        translator = OpenAITranslator(
            api_key="test-key",
            model="gemini-2.5-flash",
            provider_name="gemini",
            client=fake_client,
        )

        with pytest.raises(TranslationError, match="empty translation response"):
            translator.translate_markdown(
                TranslationRequest(
                    source_locale="th",
                    target_locale="en",
                    title="สวัสดี",
                    excerpt="สรุป",
                    category="Tech",
                    tags=["AI"],
                    body="# เนื้อหา",
                )
            )

    def test_translate_markdown_wraps_provider_errors(self):
        class FakeCompletions:
            def create(self, **kwargs):
                raise RuntimeError("429 insufficient balance")

        fake_client = SimpleNamespace(chat=SimpleNamespace(completions=FakeCompletions()))
        translator = OpenAITranslator(
            api_key="test-key",
            model="glm-5",
            provider_name="zai",
            client=fake_client,
        )

        with pytest.raises(TranslationError, match="Z.AI translation request failed"):
            translator.translate_markdown(
                TranslationRequest(
                    source_locale="en",
                    target_locale="th",
                    title="Hello",
                    excerpt="Summary",
                    category="Tech",
                    tags=["AI"],
                    body="# Body",
                )
            )
