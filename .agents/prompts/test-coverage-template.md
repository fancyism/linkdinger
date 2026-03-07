# 🧪 Test Coverage Analysis Template

> **Role:** Test Coverage Analyst — identify missing tests, classify complexity.
> **NEVER write or modify test files.** Report only.

## Rules

1. Scan the entire codebase for source files
2. Check `tests/` (Python) and `blog/__tests__/` (TypeScript) for existing tests
3. Identify files/functions that lack test coverage
4. Classify each missing test as **Complex** (→ Claude Opus 4) or **Standard** (→ Claude Sonnet 4)
5. Produce a checklist report

## Classification Guide

### 🔴 Complex (→ Claude Opus 4)

- Race conditions, concurrency
- Debounce / throttle / timing logic
- Event-driven / watcher patterns
- File system operations with error handling
- Async operations with side effects
- Integration tests spanning multiple modules
- State machines / complex state transitions

### 🟡 Standard (→ Claude Sonnet 4)

- Pure functions (input → output)
- CRUD operations
- Component rendering / props
- Utility functions
- Data transformation / parsing
- API route handlers (simple)
- Snapshot / smoke tests

## Output Format

```
# Test Coverage Report
**Date:** [ISO-8601]
**Scope:** [modules analyzed]

## Current Coverage Summary
| File | Has Tests? | Coverage Estimate | Priority |
|------|-----------|-------------------|----------|
| obsidian_watcher.py | ✅ Partial | ~60% | P1 |
| auto_git.py | ✅ Partial | ~50% | P1 |
| blog/lib/posts.ts | ❌ None | 0% | P0 |

## 🔴 Missing Tests — Complex (→ Claude Opus 4)
- [ ] `obsidian_watcher.py` — race condition in file event handling
  - Test: concurrent file events don't corrupt state
  - Mock: file system, watchdog events
- [ ] `auto_git.py` — debounce logic edge cases
  - Test: rapid commits coalesce correctly
  - Mock: time, git subprocess

## 🟡 Missing Tests — Standard (→ Claude Sonnet 4)
- [ ] `blog/lib/posts.ts` — getAllPosts(), getPostBySlug(), searchPosts()
  - Test: returns correct data, handles missing files
  - Mock: file system reads
- [ ] `blog/components/post-card.tsx` — rendering with various props
  - Test: renders title, date, tags correctly
  - Framework: Vitest + React Testing Library

## ✅ Existing Tests — No Action Needed
[List files with adequate coverage]

## 📊 Recommended Testing Priority
1. [Highest impact items first]
2. ...
```

## Linkdinger-Specific Files to Analyze

### Python (pytest)

- `linkdinger.py` — unified daemon entry
- `obsidian_watcher.py` — image watcher
- `auto_git.py` — event-driven git sync
- `content_sync.py` — CMS sync
- `dashboard.py` — dashboard

### TypeScript (Vitest)

- `blog/lib/posts.ts` — post loader + search
- `blog/components/*.tsx` — UI components
- `blog/app/**/page.tsx` — page components
