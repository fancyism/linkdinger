# AGENTS.md — Linkdinger (Zero-Footprint Docs)

> **Retrieval-first directive**: Before reasoning about any change, **READ** the
> referenced files and docs below. Prefer retrieval, less reasoning. Ground every
> decision in existing code, not assumptions.

---

## 0 · Retrieval Protocol (Read Before You Think)

```
PRIORITY ORDER:
1. READ  → Open & scan every file/doc referenced in this section
2. GREP  → Search codebase for related patterns before creating new ones
3. THINK → Only after 1 & 2, reason about the change
4. PLAN  → Write a minimal plan with file paths + line ranges
5. ACT   → Implement with smallest possible diff
```

**Mandatory reads before ANY task:**

| Context | Path |
|---------|------|
| Config | `config.yaml` |
| Environment | `.env.example` |
| Core Logic | `obsidian_watcher.py` |
| Git Automation | `auto_git.py` |
| Blog UI | `blog/` directory |

---

## 1 · Compressed Docs Index

> Dense summary of critical docs and decisions. Parse this FIRST to decide
> which full doc to retrieve. ~8KB vs ~80KB raw docs.

### 1.1 Stack

```yaml
language: Python 3.10+
runtime: Local daemon (Windows/macOS/Linux)
storage: Cloudflare R2 (S3-compatible)
version_control: Git + GitHub (private repo)
web_framework: Next.js 14 (App Router)
styling: Tailwind CSS + Glassmorphism + Neubrutalism
```

### 1.2 Project Layout

```
linkdinger/
├── .env                    # R2 credentials (gitignored)
├── .env.example            # Template
├── .gitignore
├── config.yaml             # User settings
├── linkdinger.py           # ★ Unified daemon entry point
├── obsidian_watcher.py     # Image watcher module
├── auto_git.py             # Event-driven git sync module
├── requirements.txt        # Python dependencies
├── AGENTS.md               # This file
├── tests/                  # Unit tests
│   ├── test_auto_git.py
│   └── test_watcher.py
└── blog/                   # Next.js blog (optional)
    ├── app/
    ├── components/
    ├── styles/
    └── content/
```

### 1.3 Key Architecture Decisions

| Decision | Rationale |
|----------|-----------|
| Python over Rust | Faster iteration, sufficient performance |
| R2 over GitHub | Images don't count against repo quota |
| UUID filenames | No collisions, privacy (no predictable URLs) |
| WebP conversion | Smaller files, web-optimized |
| .env for secrets | Never hardcode credentials |
| Glassmorphism-first | Modern, elegant UI |
| Peach Fuzz + Dark | Pantone 2024, warm aesthetic |

### 1.4 Environment Variables (Keys Only)

```
R2_ENDPOINT=        # https://<account>.r2.cloudflarestorage.com
R2_ACCESS_KEY=      # From Cloudflare R2 API Tokens
R2_SECRET_KEY=      # From Cloudflare R2 API Tokens
R2_BUCKET=          # Bucket name (e.g., obsidian-media)
R2_PUBLIC_URL=      # https://pub-xxx.r2.dev or custom domain
```

### 1.5 Critical Conventions

```yaml
watcher:
  debounce_sec: 0.5
  formats: [.png, .jpg, .jpeg]
  output_format: webp
  quality: 80

git:
  idle_minutes: 5
  commit_prefix: "auto:"

publish:
  method: both        # folder | flag | both
  folder: publish/
  flag: publish: true

design:
  colors:
    primary: "#FF6B35"     # Peach Fuzz
    bg: "#0D0D0D"          # Dark base
    surface: "#1A1A1A"
  style: glassmorphism
  accents: neubrutalism
```

---

## 2 · Engineering Guardrails

### 2.1 Before You Code

- [ ] Read this file completely
- [ ] Read config.yaml for current settings
- [ ] Check .env.example for required env vars
- [ ] `grep` for existing patterns before creating new ones
- [ ] Confirm change aligns with Section 1.3 decisions

### 2.2 Code Quality Standards

```
✓ Python 3.10+ type hints — use typing module
✓ Functions < 50 lines — split if larger
✓ Docstrings for public functions
✓ Exception handling with specific exceptions
✓ Logging over print statements (except user feedback)
✓ No hardcoded paths — use config.yaml
✓ No hardcoded credentials — use .env
✓ TypeScript strict mode for blog
✓ Server Components by default (Next.js)
```

### 2.3 Performance Guardrails

```
✓ Debounce file events (avoid double-processing)
✓ Clean up temp files on error
✓ Memory-efficient image processing (close handles)
✓ Lazy load images in blog
✓ Static generation for blog posts
```

### 2.4 Security Guardrails

```
✓ Never commit .env files
✓ Scoped R2 tokens (only specific bucket)
✓ Private GitHub repo for notes
✓ Validate file paths (prevent traversal)
✓ Sanitize filenames before processing
✓ Zero Trust for private blog access
```

### 2.5 Deployment Checklist

```
□ Copy .env.example to .env
□ Fill in R2 credentials
□ Update config.yaml paths
□ pip install -r requirements.txt
□ Test: paste image in Obsidian
□ Verify: link updated, image deleted
□ Optional: enable auto-git in config
□ Optional: deploy blog with Zero Trust
```

---

## 3 · Task Execution Protocol

```
STEP  ACTION                    DETAIL
────  ────────────────────────  ───────────────────────────────────────
 1    RETRIEVE context          Read AGENTS.md + config.yaml
 2    GREP existing patterns    Search for similar code before writing
 3    PLAN minimal changes      List files, expected diff size
 4    IMPLEMENT                 Write code, follow Section 2 guardrails
 5    VERIFY                    Test manually
 6    REVIEW own diff           Check for regressions
 7    REPORT                    Summarize what changed and why
```

### Critical Rules

1. **NEVER** guess what a file contains — open it first
2. **NEVER** create new utility if one exists — grep first
3. **NEVER** hardcode credentials — use .env
4. **NEVER** skip testing the watcher loop
5. **NEVER** delete original image until upload succeeds
6. **ALWAYS** handle file permission errors gracefully
7. **ALWAYS** log errors with context
8. **ALWAYS** validate config on startup
9. **ALWAYS** use UUID for uploaded filenames
10. **ALWAYS** respect .gitignore patterns

---

## 4 · Design System (Blog)

### 4.1 Color Palette

```
PRIMARY:  #FF6B35 (Peach Fuzz)
DARK:     #0D0D0D (Background)
SURFACE:  #1A1A1A (Cards)
TEXT:     #FFFFFF / #B0B0B0 / #666666
GLASS:    rgba(255,255,255,0.03-0.1)
```

### 4.2 Glassmorphism

```css
background: rgba(255, 255, 255, 0.03);
backdrop-filter: blur(20px);
border: 1px solid rgba(255, 255, 255, 0.08);
border-radius: 16px;
```

### 4.3 Neubrutalism Accents

```css
border: 2px solid #000;
box-shadow: 2px 2px 0 #000;
```

---

## 5 · Quick Commands

```bash
# Setup
pip install -r requirements.txt
cp .env.example .env
# Edit .env and config.yaml

# ★ Run unified daemon (watcher + auto-git)
python linkdinger.py

# Run watcher only
python linkdinger.py --watch

# Run auto-git only
python linkdinger.py --git

# Show config status
python linkdinger.py --status

# Run tests
python -m pytest tests/ -v

# Blog (optional)
cd blog && npm install && npm run dev
```

---

## 6 · Troubleshooting

| Issue | Check |
|-------|-------|
| Image not uploading | R2 credentials, bucket name, endpoint |
| Link not updating | Vault path in config, file permissions |
| Git not syncing | Git remote configured, SSH keys |
| Blog not deploying | Zero Trust settings, publish rules |
| Import errors | Run `pip install -r requirements.txt` |
