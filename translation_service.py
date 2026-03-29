"""Translation services for publish-time multilingual content generation."""

from __future__ import annotations

import json
import re
import time
from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class ProviderConfig:
    """Non-secret provider settings for compatible translation clients."""

    name: str
    label: str
    api_key_env: str
    base_url: str | None = None


PROVIDER_CONFIGS: dict[str, ProviderConfig] = {
    "openai": ProviderConfig(
        name="openai",
        label="OpenAI",
        api_key_env="OPENAI_API_KEY",
        base_url=None,
    ),
    "zai": ProviderConfig(
        name="zai",
        label="Z.AI",
        api_key_env="ZAI_API_KEY",
        base_url="https://api.z.ai/api/paas/v4/",
    ),
    "gemini": ProviderConfig(
        name="gemini",
        label="Gemini",
        api_key_env="GEMINI_API_KEY",
        base_url="https://generativelanguage.googleapis.com/v1beta/openai/",
    ),
}


@dataclass
class TranslationRequest:
    """Structured translation input for markdown content collections."""

    source_locale: str
    target_locale: str
    title: str
    excerpt: str
    category: str | None
    tags: list[str]
    body: str
    content_type: str = "post"
    platform: str | None = None
    prompt_text: str | None = None
    usage_tips: str | None = None
    sref: str | None = None
    faq: list[dict[str, str]] | None = None
    how_to: list[dict[str, str]] | None = None


@dataclass
class TranslationResult:
    """Translated metadata + markdown body."""

    title: str
    excerpt: str
    body: str
    category: str | None = None
    tags: list[str] | None = None
    platform: str | None = None
    prompt_text: str | None = None
    usage_tips: str | None = None
    sref: str | None = None
    faq: list[dict[str, str]] | None = None
    how_to: list[dict[str, str]] | None = None


class TranslationError(RuntimeError):
    """Raised when translation fails or returns invalid output."""


def get_provider_config(provider_name: str) -> ProviderConfig:
    """Resolve a provider identifier into its non-secret connection defaults."""
    if not isinstance(provider_name, str):
        raise TranslationError(
            f"Provider name must be a string, got {type(provider_name).__name__}."
        )
    normalized = provider_name.strip().lower()
    provider = PROVIDER_CONFIGS.get(normalized)
    if provider is None:
        supported = ", ".join(sorted(PROVIDER_CONFIGS))
        raise TranslationError(
            f"Unsupported translation provider '{provider_name}'. Supported providers: {supported}."
        )
    return provider


class OpenAITranslator:
    """OpenAI-compatible chat-completions translator for multiple providers."""

    def __init__(
        self,
        api_key: str,
        model: str = "gpt-4o-mini",
        provider_name: str = "openai",
        base_url: str | None = None,
        timeout: float = 120.0,
        max_retries: int = 3,
        retry_delay: float = 1.0,
        client: Any | None = None,
    ):
        self._provider = get_provider_config(provider_name)
        self._model = model
        self._max_retries = max_retries
        self._retry_delay = retry_delay

        if client is not None:
            self._client = client
            return

        try:
            from openai import OpenAI  # type: ignore[import-not-found]
        except ImportError as exc:
            raise TranslationError(
                "OpenAI SDK is not installed. Run `pip install -r requirements.txt`."
            ) from exc

        client_kwargs: dict[str, Any] = {
            "api_key": api_key,
            "timeout": timeout,
        }
        if base_url or self._provider.base_url:
            client_kwargs["base_url"] = base_url or self._provider.base_url

        self._client = OpenAI(**client_kwargs)

    def translate_markdown(self, request: TranslationRequest) -> TranslationResult:
        payload = {
            "content_type": request.content_type,
            "source_locale": request.source_locale,
            "target_locale": request.target_locale,
            "title": request.title,
            "excerpt": request.excerpt,
            "platform": request.platform,
            "category": request.category,
            "tags": request.tags,
            "prompt_text": request.prompt_text,
            "usage_tips": request.usage_tips,
            "sref": request.sref,
            "faq": request.faq,
            "how_to": request.how_to,
            "body": request.body,
        }

        if request.content_type == "prompt":
            system_prompt = (
                "You are a professional bilingual prompt editor. Translate prompt library entries "
                "while preserving markdown structure, frontmatter semantics, lists, code fences, "
                "and special tokens like URLs, variables, placeholders, CLI flags, and style reference "
                "codes. Keep platform names accurate. Preserve prompt intent and formatting. Do not translate "
                "the prompt_text field; return it unchanged from the source so users can keep the original AI "
                "instruction wording. Return valid JSON only with keys: title, excerpt, platform, category, tags, prompt_text, usage_tips, "
                "sref, body."
            )
            user_prompt = "Translate this prompt entry payload and return JSON only.\n\n"
        else:
            system_prompt = (
                "You are a professional bilingual technical editor. "
                "Translate markdown blog posts while preserving markdown structure, "
                "headings, lists, tables, code blocks, inline code, URLs, image URLs, "
                "and frontmatter semantics. Preserve technical terminology when needed. "
                "Return valid JSON only with keys: title, excerpt, category, tags, faq, "
                "how_to, body."
            )
            user_prompt = "Translate this blog post payload and return JSON only.\n\n"

        last_error: Exception | None = None
        for attempt in range(self._max_retries):
            try:
                response = self._client.chat.completions.create(
                    model=self._model,
                    temperature=0.2,
                    response_format={"type": "json_object"},
                    messages=[
                        {
                            "role": "system",
                            "content": system_prompt,
                        },
                        {
                            "role": "user",
                            "content": user_prompt + json.dumps(payload, ensure_ascii=False),
                        },
                    ],
                )

                output_text = _extract_chat_completion_text(response).strip()
                if not output_text:
                    raise TranslationError(
                        f"{self._provider.label} returned an empty translation response."
                    )

                return _parse_translation_result(output_text)

            except TranslationError:
                raise
            except Exception as exc:
                last_error = exc
                if attempt < self._max_retries - 1:
                    time.sleep(self._retry_delay * (attempt + 1))
                    continue

        raise TranslationError(
            f"{self._provider.label} translation request failed after {self._max_retries} retries: {last_error}"
        ) from last_error


def _extract_chat_completion_text(response: Any) -> str:
    """Extract plain text content from OpenAI-compatible chat completion responses."""
    choices = getattr(response, "choices", None)
    if not choices:
        raise TranslationError("Translation response did not contain any choices.")

    message = getattr(choices[0], "message", None)
    if message is None:
        raise TranslationError("Translation response did not contain a message.")

    content = getattr(message, "content", None)
    if isinstance(content, str):
        return content

    if isinstance(content, list):
        text_parts: list[str] = []
        for item in content:
            if isinstance(item, dict):
                if item.get("type") == "text" and item.get("text"):
                    text_parts.append(str(item["text"]))
                continue

            item_type = getattr(item, "type", None)
            item_text = getattr(item, "text", None)
            if item_type == "text" and item_text:
                text_parts.append(str(item_text))

        if text_parts:
            return "\n".join(text_parts)

    raise TranslationError("Translation response did not contain text content.")


def _extract_json_block(text: str) -> str:
    """Extract the first JSON object from a response."""
    stripped = text.strip()
    if stripped.startswith("{") and stripped.endswith("}"):
        return stripped

    match = re.search(r"\{.*\}", stripped, flags=re.DOTALL)
    if match:
        return match.group(0)

    raise TranslationError("Translation response did not contain a JSON object.")


def _normalize_string_list(value: Any) -> list[str]:
    """Normalize optional arrays of strings."""
    if not value:
        return []
    if isinstance(value, list):
        return [str(item).strip() for item in value if str(item).strip()]
    raise TranslationError("Expected a list of strings in translation output.")


def _normalize_qa_list(value: Any, kind: str) -> list[dict[str, str]] | None:
    """Normalize optional FAQ and HowTo arrays."""
    if not value:
        return None
    if not isinstance(value, list):
        raise TranslationError(f"Expected a list for translated {kind}.")

    normalized: list[dict[str, str]] = []
    for item in value:
        if not isinstance(item, dict):
            raise TranslationError(f"Expected object items for translated {kind}.")
        normalized_item = {key: str(item.get(key, "")).strip() for key in item.keys()}
        normalized.append(normalized_item)

    return normalized


def _parse_translation_result(raw_output: str) -> TranslationResult:
    """Parse JSON translation output into a typed result."""
    json_block = _extract_json_block(raw_output)

    try:
        payload = json.loads(json_block)
    except json.JSONDecodeError as exc:
        raise TranslationError("Translation output was not valid JSON.") from exc

    title = str(payload.get("title", "")).strip()
    excerpt = str(payload.get("excerpt", "")).strip()
    body = str(payload.get("body", "")).strip()

    if not title or not body:
        raise TranslationError("Translation output is missing required fields.")

    category_value = payload.get("category")
    category = str(category_value).strip() if category_value else None
    platform_value = payload.get("platform")
    platform = str(platform_value).strip() if platform_value else None
    prompt_text_value = payload.get("prompt_text")
    prompt_text = str(prompt_text_value).strip() if prompt_text_value else None
    usage_tips_value = payload.get("usage_tips")
    usage_tips = str(usage_tips_value).strip() if usage_tips_value else None
    sref_value = payload.get("sref")
    sref = str(sref_value).strip() if sref_value else None

    return TranslationResult(
        title=title,
        excerpt=excerpt,
        body=body,
        category=category,
        tags=_normalize_string_list(payload.get("tags")),
        platform=platform,
        prompt_text=prompt_text,
        usage_tips=usage_tips,
        sref=sref,
        faq=_normalize_qa_list(payload.get("faq"), "faq"),
        how_to=_normalize_qa_list(payload.get("how_to"), "how_to"),
    )
