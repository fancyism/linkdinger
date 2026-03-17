---
title: "Context Engineering for AI Systems"
date: "2024-03-10"
category: "Tech"
excerpt: "How to design and manage context for AI systems to get better, more consistent outputs. The emerging discipline of context engineering."
tags:
  - AI
  - Engineering
  - Best Practices
coverImage: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&h=630&fit=crop"
publish: true
---

# The Context Problem

Large Language Models are only as good as the context they receive. Garbage in, garbage out. This has given rise to a new discipline: **Context Engineering**.

## What is Context Engineering?

Context Engineering is the practice of designing, organizing, and managing the information that AI systems receive to produce optimal outputs. It's more than prompt engineering—it's about building systems that consistently provide the right context.

### The Three Layers

1. **System Context**: Rules, constraints, and persona definitions
2. **Session Context**: Conversation history and accumulated knowledge
3. **External Context**: Documents, codebases, and real-time data

## Building Context-Aware Systems

In Linkdinger, we use context engineering principles:

```python
def build_context(vault_path: str) -> dict:
    return {
        "project_structure": scan_structure(vault_path),
        "recent_changes": get_git_history(limit=10),
        "config": load_config("config.yaml"),
        "conventions": extract_patterns(vault_path)
    }
```

This structured context helps AI understand the project without hallucinating.

## Best Practices

### 1. Be Explicit About Constraints

```
Bad: "Fix the code"
Good: "Fix the Python code in obsidian_watcher.py, 
      maintaining the existing function signatures 
      and following PEP 8 style"
```

### 2. Provide Examples

Few-shot learning dramatically improves output quality. Show the AI what you want.

### 3. Structure Your Context

Use consistent formats:
- File paths at the top
- Code blocks with language hints
- Clear separation between context and request

### 4. Version Your Context

Treat prompts and context templates like code. Track changes, test variations, measure results.

## The Future

As AI systems become more capable, context engineering will become as important as traditional software engineering. The developers who thrive will be those who can effectively communicate with AI—not through magic words, but through well-designed context systems.

---

*Linkdinger's AGENTS.md is an example of context engineering in practice—a comprehensive context file that helps AI understand the project.*
