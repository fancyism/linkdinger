# Obsidian Core Template - Prompt CMS

Save this file inside your Obsidian `Templates/` folder, then insert it with the core Templates plugin.

```md
---
title: "{{title}}"
date: {{date:YYYY-MM-DD}}
platform: "Claude"
category: "Coding"
promptId: "PROMPT-{{date:YYYYMMDD-HHmm}}"
promptText: |
  Act as a senior software engineer.
  Help me build [TASK] using [LANGUAGE_OR_STACK].

  Requirements:
  - Explain the approach briefly
  - Provide production-ready code
  - Include edge cases and error handling
  - Keep placeholders intact where needed
excerpt: "One-line summary for the gallery card and share preview."
usageTips: "Replace placeholders before running the prompt. Add project constraints for better results."
tags:
  - coding
  - automation
  - cli
coverImage: "https://your-cdn.example.com/prompt-cover.webp"
locale: en
publish: true
autoTranslate: true
translationKey: "{{title}}"
canonicalLocale: en

# Optional validated fields
difficulty: "intermediate"
model: "Claude 3.7 Sonnet"
demoUrl: "https://example.com/demo"
previewLayout: "showcase"

# Optional extras
sref: ""
featured: false
status: "published"
---

This prompt is useful when you need a strong first draft quickly, but still want structured output and clear reasoning.

## Best for
- Internal tools
- Production-ready snippets
- Reusable workflows

## How to use
1. Replace placeholders like `[TASK]` and `[LANGUAGE_OR_STACK]`.
2. Add constraints, file paths, and output format.
3. Paste into your AI tool and iterate.

## Expected output
- Clear approach
- Implementation draft
- Edge cases
- Follow-up suggestions

## Demo / Notes
Add screenshots, GIFs, videos, or example outputs here.
```

## Quick Notes

- `promptText` stays in the original language during auto-translation.
- `excerpt`, `usageTips`, and `coverImage` are now recommended quality fields; missing them will warn but not block publishing.
- `difficulty` must be `beginner`, `intermediate`, or `advanced`.
- `demoUrl` must be a full `http` or `https` URL.
- `previewLayout` can be `showcase`, `spotlight`, or `editorial`. Leave it as-is only when you want to override the automatic layout choice.
