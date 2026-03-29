# Obsidian Prompt Template

Use this template for prompts you want to publish through the Linkdinger CMS.

- Put the markdown file in `publish/prompt/` for folder-based publishing.
- Keep `promptText` in its original language. The CMS preserves it during auto-translation.
- `difficulty`, `model`, and `demoUrl` are optional, but validated when present.

```md
---
title: "Prompt Title Here"
date: 2026-03-29
platform: "Claude"
category: "Coding"
promptId: "PROMPT-001"
promptText: |
  Act as a senior software engineer.
  Build a production-ready CLI tool for [TASK].
  Requirements:
  - Use [LANGUAGE]
  - Include error handling
  - Explain tradeoffs briefly
excerpt: "One-line summary for the gallery card and SEO preview."
usageTips: "Explain what to replace before using the prompt and when it works best."
tags:
  - coding
  - cli
  - automation
coverImage: "https://your-cdn.example.com/prompt-cover.webp"
locale: en
publish: true
autoTranslate: true
translationKey: "prompt-title-here"
canonicalLocale: en

# Optional schema fields
difficulty: "intermediate"
model: "Claude 3.7 Sonnet"
demoUrl: "https://example.com/demo"
sref: "--sref 123456789"
featured: false
status: "published"
---

This prompt is best for turning rough task ideas into a clean implementation plan or a first working draft.

## Best for
- Internal tools
- Automation scripts
- CLI workflows

## How to use
1. Replace all placeholders like `[TASK]` and `[LANGUAGE]`.
2. Add project constraints, file paths, or framework requirements.
3. Paste into your AI tool and iterate on the result.

## Expected output
- Architecture approach
- Implementation steps
- Working starter code
- Notes on edge cases

## Demo
If you have a GIF, video link, or output screenshots, embed them here in the markdown body.
```

## Property Guide

- `title` - main prompt title used in cards, modal, and share previews
- `date` - publish date in ISO format (`YYYY-MM-DD`)
- `platform` - platform badge, e.g. `Claude`, `ChatGPT`, `Gemini`, `Midjourney`
- `category` - gallery grouping, e.g. `Coding`, `Marketing`, `Research`, `Image`
- `promptId` - visible prompt label such as `PROMPT-001`
- `promptText` - the copy-ready prompt shown inside `prompt.txt`
- `excerpt` - short description used in card/detail/share previews
- `usageTips` - practical hints shown in the detail view
- `tags` - searchable/filterable tags
- `coverImage` - top visual for card/detail/share preview
- `locale` - file language such as `en` or `th`
- `publish` - set to `true` to publish
- `autoTranslate` - set to `true` to auto-translate metadata/body into configured locales
- `translationKey` - shared ID across locales for the same prompt
- `canonicalLocale` - original source locale for the prompt family
- `difficulty` - optional; must be `beginner`, `intermediate`, or `advanced`
- `model` - optional; non-empty string naming the best-fit AI model
- `demoUrl` - optional; must be an absolute `http` or `https` URL
- `sref` - optional style-reference string for image-generation prompts

## Recommended Publishing Workflow

1. Create a new note from this template in `publish/prompt/`.
2. Fill in required metadata first.
3. Add `coverImage` and `usageTips` so the gallery looks complete.
4. Keep `promptText` concise, structured, and copy-ready.
5. Use the markdown body for explanation, examples, GIFs, and output references.
6. Run `python linkdinger.py --cms` to sync into `blog/content/prompts/{locale}/`.
