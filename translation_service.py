"""Translation services for publish-time multilingual content generation."""

from __future__ import annotations

import json
import re
from dataclasses import dataclass
from typing import Any


@dataclass
class TranslationRequest:
    """Structured translation input for a markdown post."""

    source_locale: str
    target_locale: str
    title: str
    excerpt: str
    category: str | None
    tags: list[str]
    body: str
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
    faq: list[dict[str, str]] | None = None
    how_to: list[dict[str, str]] | None = None


class TranslationError(RuntimeError):
    """Raised when translation fails or returns invalid output."""


class OpenAITranslator:
    """Thin wrapper around the OpenAI Responses API for markdown translation."""

    def __init__(self, api_key: str, model: str = "gpt-5-mini"):
        try:
            from openai import OpenAI  # type: ignore[import-not-found]
        except ImportError as exc:
            raise TranslationError(
                "OpenAI SDK is not installed. Run `pip install -r requirements.txt`."
            ) from exc

        self._client = OpenAI(api_key=api_key)
        self._model = model

    def translate_markdown(self, request: TranslationRequest) -> TranslationResult:
        payload = {
            "source_locale": request.source_locale,
            "target_locale": request.target_locale,
            "title": request.title,
            "excerpt": request.excerpt,
            "category": request.category,
            "tags": request.tags,
            "faq": request.faq,
            "how_to": request.how_to,
            "body": request.body,
        }

        response = self._client.responses.create(
            model=self._model,
            instructions=(
                "You are a professional bilingual technical editor. "
                "Translate markdown blog posts while preserving markdown structure, "
                "headings, lists, code blocks, inline code, URLs, image URLs, and "
                "frontmatter semantics. Preserve technical terminology when needed. "
                "Return publication-ready translated fields only."
            ),
            input=json.dumps(payload, ensure_ascii=False),
            text={
                "format": {
                    "type": "json_schema",
                    "name": "translated_post",
                    "strict": True,
                    "schema": {
                        "type": "object",
                        "properties": {
                            "title": {"type": "string"},
                            "excerpt": {"type": "string"},
                            "category": {"type": ["string", "null"]},
                            "tags": {
                                "type": "array",
                                "items": {"type": "string"},
                            },
                            "faq": {
                                "type": ["array", "null"],
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "question": {"type": "string"},
                                        "answer": {"type": "string"},
                                    },
                                    "required": ["question", "answer"],
                                    "additionalProperties": False,
                                },
                            },
                            "how_to": {
                                "type": ["array", "null"],
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "name": {"type": "string"},
                                        "text": {"type": "string"},
                                    },
                                    "required": ["name", "text"],
                                    "additionalProperties": False,
                                },
                            },
                            "body": {"type": "string"},
                        },
                        "required": [
                            "title",
                            "excerpt",
                            "category",
                            "tags",
                            "faq",
                            "how_to",
                            "body",
                        ],
                        "additionalProperties": False,
                    },
                }
            },
            store=False,
        )

        output_text = getattr(response, "output_text", "").strip()
        if not output_text:
            raise TranslationError("OpenAI returned an empty translation response.")

        return _parse_translation_result(output_text)


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

    return TranslationResult(
        title=title,
        excerpt=excerpt,
        body=body,
        category=category,
        tags=_normalize_string_list(payload.get("tags")),
        faq=_normalize_qa_list(payload.get("faq"), "faq"),
        how_to=_normalize_qa_list(payload.get("how_to"), "how_to"),
    )
