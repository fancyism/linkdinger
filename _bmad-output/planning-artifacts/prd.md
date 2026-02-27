---
stepsCompleted: ['step-01-init', 'step-02-discovery']
inputDocuments:
  - config.yaml
  - AGENTS.md
  - docs/principle-blog.md
  - docs/uxui-principle.md
  - implementation_plan.md (Phase 6 CMS section)
  - obsidian_watcher.py
  - auto_git.py
  - linkdinger.py
  - blog/lib/posts.ts
workflowType: 'prd'
projectType: 'brownfield'
---

# PRD: CMS Content Sync — Obsidian → Blog Pipeline

**Author:** Affan
**Date:** 2026-02-27
**Project:** Linkdinger
**Status:** Draft — Awaiting Review

---

## 1. Problem Statement

Linkdinger currently has two disconnected systems:

- **Private notes** are auto-synced to GitHub via `auto_git.py` ✅
- **Blog posts** must be manually placed in `blog/content/posts/` ❌

There is no automated bridge. A user writing in Obsidian cannot publish a blog post without manually copying files. This breaks the "write once, publish everywhere" vision.

## 2. Product Vision

> Write in Obsidian → publish to blog by simply adding `publish: true` to frontmatter or moving a file to the `publish/` folder. Zero manual steps.

### Core Flow

```
Obsidian Vault (private)
├── notes/           → auto-git → private GitHub ✅ Done
├── _assets/         → watcher → WebP → R2      ✅ Done
└── publish/         → content_sync → blog/      ⬜ This PRD
    └── my-post.md → rewrites links → blog/content/posts/
```

## 3. Scope: 4 Parts (Incremental Delivery)

Each part is independently testable and deployable.

---

### Part A: Core Sync Engine (`content_sync.py`)

**Goal:** Standalone module that copies `.md` files from vault `publish/` folder to `blog/content/posts/` directory.

**Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| A1 | Detect `.md` files in `{vault}/publish/` folder | Must |
| A2 | Copy files to `blog/content/posts/` preserving filename | Must |
| A3 | Strip `publish/` prefix from output path | Must |
| A4 | On file delete in `publish/` → delete from `blog/content/posts/` | Must |
| A5 | On file modify → overwrite target (re-sync) | Must |
| A6 | Skip non-`.md` files silently | Must |
| A7 | Dual publish mode from `config.yaml`: `folder`, `flag`, `both` | Must |
| A8 | In `flag` mode: scan vault `.md` files for `publish: true` frontmatter | Should |
| A9 | Create target directory if it doesn't exist | Must |
| A10 | Log all sync operations with timestamps | Must |

**Config used:**

```yaml
# Already exists in config.yaml
publish:
  method: "both"     # folder | flag | both
  folder: "publish"  # Subfolder in vault
  flag: "publish"    # Frontmatter key to look for

# New — to add
blog:
  content_dir: "blog/content/posts"
```

**Entry/Exit Points:**

- `sync_file(source_path, config)` → copies single file
- `sync_all(config)` → full scan + sync
- `remove_synced(source_path, config)` → delete from blog
- `notify()` → event-driven trigger (for Part C integration)

---

### Part B: Image Link Rewriting

**Goal:** Transform Obsidian image syntax to standard markdown with R2 URLs.

**Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| B1 | Rewrite `![[image.png]]` → `![image](R2_PUBLIC_URL/uuid.webp)` | Must |
| B2 | Rewrite `![[image.png\|600]]` (with resize) → standard markdown | Must |
| B3 | Resolve image filename → R2 URL via upload log or filename lookup | Must |
| B4 | Handle images not yet uploaded: leave link as-is with warning log | Should |
| B5 | Rewrite `[[internal-link]]` → remove (don't publish internal wiki links) | Should |
| B6 | Preserve standard markdown image syntax `![alt](url)` unchanged | Must |
| B7 | Preserve all frontmatter fields during rewrite | Must |

**Key Challenge:**
The watcher converts images to WebP with UUID filenames and uploads to R2. The sync module needs to know the mapping: `original-filename.png → uuid.webp`. Options:

1. **Upload log file** (recommended): `_assets/.upload_log.json` mapping original → R2 URL
2. **Filename-based search**: Query the blog/assets folder
3. **R2 API query**: List bucket objects (slow, network-dependent)

**Recommended approach:** Modify `obsidian_watcher.py` to write an upload manifest (`_assets/.upload_log.json`). Then `content_sync.py` reads this manifest for link rewriting.

---

### Part C: Watcher Integration

**Goal:** Integrate content sync into the unified daemon so sync happens automatically when markdown files change.

**Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| C1 | Add `MarkdownHandler` to `obsidian_watcher.py` | Must |
| C2 | Watch `publish/` folder for `.md` changes (create/modify/delete) | Must |
| C3 | Debounce rapid changes (same as image handler, 0.5s) | Must |
| C4 | Call `content_sync.sync_file()` on change events | Must |
| C5 | Call `content_sync.remove_synced()` on delete events | Must |
| C6 | In `flag` mode: watch ALL vault `.md` files for frontmatter changes | Should |
| C7 | Integrate into `linkdinger.py` — add `--cms` flag | Must |
| C8 | Trigger git sync after content sync (reuse auto_git.notify()) | Should |

---

### Part D: Testing & Documentation

**Goal:** Comprehensive tests + updated docs for the complete CMS pipeline.

**Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| D1 | Unit tests for `sync_file()` — happy path | Must |
| D2 | Unit tests for file delete propagation | Must |
| D3 | Unit tests for image link rewriting (all Obsidian syntaxes) | Must |
| D4 | Unit tests for frontmatter flag detection | Must |
| D5 | Unit tests for dual publish mode switching | Should |
| D6 | Edge case: file with no frontmatter | Must |
| D7 | Edge case: file in nested subdirectory of `publish/` | Should |
| D8 | Update `AGENTS.md` with CMS sync section | Must |
| D9 | Update `config.yaml` example with `blog.content_dir` | Must |
| D10 | Add CMS-related commands to Quick Commands | Must |

---

## 4. Non-Functional Requirements

| NFR | Requirement |
|-----|-------------|
| Performance | Sync single file < 100ms (no network I/O except R2 lookup) |
| Reliability | Never corrupt existing blog posts on error |
| Safety | Never delete vault originals — sync is one-way copy |
| Idempotent | Running sync twice produces same result |
| Fallback | If image rewrite fails, copy file with original links + warning |
| Logging | All operations logged with timestamp + file path |

## 5. Out of Scope (Future)

- RSS/Atom feed generation
- Auto-rebuild blog on content change (Next.js ISR)
- Multi-vault support
- Draft preview server
- Image optimization during sync (already handled by watcher)

## 6. Verification Plan

### Per Part

| Part | Test | How |
|------|------|-----|
| A | File sync | `pytest tests/test_content_sync.py -k sync` |
| B | Link rewrite | `pytest tests/test_content_sync.py -k rewrite` |
| C | Watcher integration | Manual: create file in `publish/` → verify appears in `blog/content/posts/` |
| D | Full pipeline | Start `python linkdinger.py` → write post in Obsidian → verify blog renders it |

### Acceptance Criteria

- [ ] Write `.md` in `publish/` folder → appears in `blog/content/posts/`
- [ ] Delete from `publish/` → removed from `blog/content/posts/`
- [ ] `![[image.png]]` rewritten to R2 URL
- [ ] `publish: true` frontmatter triggers sync in `flag` mode
- [ ] All 4 test categories pass
- [ ] `python linkdinger.py --cms` runs CMS sync standalone
