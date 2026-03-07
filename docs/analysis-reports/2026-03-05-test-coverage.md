# Analysis Report: test-coverage

**Date:** 2026-03-05T15:39:35+07:00
**Analyst:** Gemini 2.5 Pro
**Scope:** full-codebase

## Current Coverage Summary

| File | Has Tests? | Coverage Estimate | Priority |
|------|-----------|-------------------|----------|
| `obsidian_watcher.py` | ✅ Yes (`test_watcher.py`) | ~80% | P2 |
| `auto_git.py` | ✅ Yes (`test_auto_git.py`) | ~75% | P2 |
| `content_sync.py` | ✅ Yes (`test_content_sync.py`) | ~85% | P3 |
| `linkdinger.py` | ❌ No | 0% | P1 |
| `blog/lib/posts.ts` | ❌ No | 0% | P0 |
| `blog/app/search/` | ❌ No | 0% | P1 |

## 🔴 Missing Tests — Complex (→ Claude Opus 4)

- [ ] `linkdinger.py` — unified daemon lifecycle
  - **Issue:** No test for the main daemon loop combining watcher and auto-git.
  - **Test:** Mock both processes, test graceful shutdown and config reloading.
- [ ] `obsidian_watcher.py` — race condition on large file copy
  - **Issue:** Existing tests don't cover slow file I/O locks.
  - **Test:** Mock a slow filesystem write, verify watcher waits and retries.

## 🟡 Missing Tests — Standard (→ Claude Sonnet 4)

- [ ] `blog/lib/posts.ts` — getAllPosts(), searchPosts()
  - **Issue:** Core blog logic is completely untested.
  - **Test:** Mock file system, verify sorting by date and tag filtering.
- [ ] `blog/app/search/route.ts` (API) or Search Component
  - **Issue:** Client-side search logic is untested.
  - **Test:** Render component, type in search box, verify post list updates.
- [ ] `dashboard.py` — Flask API endpoints
  - **Issue:** The local setup dashboard has no tests.
  - **Test:** Test GET/POST config routes using Flask test client.

## ✅ Existing Tests OK

- `tests/test_auto_git.py` (Debounce logic covered)
- `tests/test_content_sync.py` (Markdown sync covered)
- `blog/tests/home-layout.test.ts`
- `blog/tests/posts-cms.test.ts`

## ✅ Handoff to Implementation Team

- [ ] Task 1: Claude Opus 4 → Write tests for `linkdinger.py` daemon lifecycle
- [ ] Task 2: Claude Sonnet 4 → Write Vitest suite for `blog/lib/posts.ts`
- [ ] Task 3: Claude Sonnet 4 → Write tests for `dashboard.py` API endpoints
