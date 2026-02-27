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
| Git Sync | `auto_git.py` |
| Unified Daemon | `linkdinger.py` |
| Blog UI | `blog/` directory |
| Design System | `docs/Dark Glassmorphism-The Aesthetic.md` |
| UX/UI Principles | `docs/uxui-principle.md` |
| Blog Principles | `docs/principle-blog.md` |
| Design Inspiration | `docs/inspireblog.md` |

---

## 1 · Compressed Docs Index

> Dense summary of critical docs and decisions. Parse this FIRST to decide
> which full doc to retrieve. ~8KB vs ~80KB raw docs.
>
> **Why this exists**: LLMs have limited context windows. Instead of feeding
> every doc in full, this section packs the *essence* of all architecture
> decisions, conventions, and design tokens into ~8KB. The AI reads this
> compressed index, understands the project instantly, and only retrieves
> full docs when deeper detail is needed. Think of it as a "RAM cache" for
> project knowledge — fast lookups, zero hallucination.

### 1.1 Stack

```yaml
# ── Backend Daemon (Python) ──
language: Python 3.10+
runtime: Local daemon (Windows/macOS/Linux)
entry_point: linkdinger.py          # unified daemon
modules:
  - obsidian_watcher.py             # image pipeline
  - auto_git.py                     # event-driven git sync
storage: Cloudflare R2 (S3-compatible)
version_control: Git + GitHub (private repo)
testing: pytest (28 tests, 100% pass)

# ── Blog Frontend (Next.js) ──
web_framework: Next.js 14 (App Router, Server Components)
styling: Tailwind CSS 3.4
typography:
  display: Outfit (headings — bold, expressive)
  body: Inter (paragraphs — clean, readable)
  code: JetBrains Mono (code blocks)
icons: Lucide React
markdown_engine: gray-matter + remark + remark-html
deploy_target: Vercel / Cloudflare Pages (TBD)
```

### 1.2 Project Layout

```
linkdinger/
├── .env                        # R2 credentials (gitignored)
├── .env.example                # Template
├── .gitignore
├── config.yaml                 # User settings
├── linkdinger.py               # ★ Unified daemon entry point
├── obsidian_watcher.py         # Image watcher module
├── auto_git.py                 # Event-driven git sync module
├── requirements.txt            # Python dependencies
├── AGENTS.md                   # This file
├── tests/                      # Unit tests (pytest)
│   ├── test_auto_git.py
│   └── test_watcher.py
├── docs/                       # Project knowledge & design docs
│   ├── uxui-principle.md       # Dev-Ready Design Spec methodology
│   ├── Dark Glassmorphism-The Aesthetic.md
│   ├── principle-blog.md       # Blog UX best practices
│   └── inspireblog.md          # Design references
└── blog/                       # Next.js 14 blog
    ├── app/
    │   ├── layout.tsx          # Root layout (Navbar + Footer shell)
    │   ├── page.tsx            # Home (Hero + Recent Posts)
    │   ├── globals.css         # Design tokens + glass components
    │   ├── blog/               # Blog listing + [slug] detail
    │   ├── about/              # About page
    │   └── search/             # Full-text search
    ├── components/
    │   ├── navbar.tsx          # Sticky glass nav, mobile hamburger
    │   ├── hero.tsx            # Landing hero with liquid-glass
    │   ├── post-card.tsx       # Blog card with cover image
    │   ├── footer.tsx          # Site footer
    │   └── ui/                 # Atomic design tokens
    │       ├── glass-card.tsx
    │       ├── glass-button.tsx
    │       └── brutal-tag.tsx
    ├── content/posts/          # Markdown blog posts (gray-matter)
    ├── lib/posts.ts            # Post loader + search + tag filter
    ├── tailwind.config.js      # Custom colors + fonts + glass utils
    └── next.config.js
```

### 1.3 Key Architecture Decisions

| Decision | Rationale |
|----------|-----------|
| Python daemon + Next.js blog | Separation of concerns: daemon = backend pipeline, blog = static frontend |
| R2 over GitHub for images | Images don't count against repo quota, CDN-fast delivery |
| UUID filenames | No collisions, privacy (no predictable URLs) |
| WebP conversion | 30-50% smaller than PNG, web-optimized |
| Event-driven git sync | Watcher notifies git module → debounced commit, no race conditions |
| Dark Glassmorphism | Premium feel with depth cues, reduces cognitive load |
| Peach Fuzz #FF6B35 | Pantone 2024 accent — warm, inviting, high contrast on dark |
| Server Components default | Zero JS shipped unless `'use client'` — faster blog loads |
| Static generation | Blog posts pre-rendered at build time for SEO + speed |
| Atomic component design | `ui/` folder = reusable tokens, blog components compose them |

### 1.4 Environment Variables (Keys Only)

```
R2_ENDPOINT=        # https://<account>.r2.cloudflarestorage.com
R2_ACCESS_KEY=      # From Cloudflare R2 API Tokens
R2_SECRET_KEY=      # From Cloudflare R2 API Tokens
R2_BUCKET=          # Bucket name (e.g., obsidian-media)
R2_PUBLIC_URL=      # https://pub-xxx.r2.dev or custom domain
```

### 1.5 Design System (Dark Glassmorphism + Neubrutalism)

```yaml
# ── Color Palette ──
colors:
  primary: "#FF6B35"       # Peach Fuzz (accent, CTAs, links)
  primary_light: "#FF8C5A" # Hover states
  primary_dark: "#E55A2B"  # Active/pressed states
  bg: "#0D0D0D"            # Deep dark base
  surface: "#1A1A1A"       # Card backgrounds
  elevated: "#2D2D2D"      # Raised elements
  text_primary: "#FFFFFF"
  text_secondary: "#B0B0B0"
  text_muted: "#666666"

# ── Glass Components (3 Pillars) ──
glass:
  base: "bg-white/[0.03] backdrop-blur-[20px] border border-white/[0.08]"
  card: "glass + rounded-2xl + shadow(inset top-highlight + 20px drop)"
  button: "bg-peach/10 backdrop-blur-[10px] border border-peach/30"
  liquid: "bg-gradient(135deg, white/10 → white/05) backdrop-blur-[40px] border white/18"

# ── Background Dynamics (CRITICAL) ──
# Glass is INVISIBLE on solid black. Always place ambient gradient
# orbs (deep purple, neon blue, hot pink) behind glass elements.
# Use smooth color meshes, NOT high-frequency noise.

# ── Neubrutalism Accents ──
brutal:
  tag: "bg-peach border-2 border-black shadow-[2px_2px_0_#000]"
  hover: "translate(-1px, -1px) shadow-[3px_3px_0_#000]"

# ── Typography Scale ──
typography:
  h1: "Outfit, 700, text-4xl sm:text-5xl"
  h2: "Outfit, 700, text-2xl"
  body: "Inter, 400, text-base, leading-relaxed"
  code: "JetBrains Mono, 400, text-sm"
  meta: "Inter, 400, text-sm, text-gray-400"

# ── Interactive States (ALL elements MUST define) ──
states:
  default: "normal view"
  hover: "color shift + shadow lift + scale(1.02)"
  focused: "ring-2 ring-peach/50 outline-none (keyboard a11y)"
  active: "scale(0.98) + darken"
  disabled: "opacity-50 cursor-not-allowed"
  loading: "skeleton pulse animation"
  error: "border-red-500 + error message below"
```

### 1.6 Blog Content Model

```yaml
# Markdown frontmatter schema (content/posts/*.md)
post:
  title: string          # required
  date: ISO-8601         # required
  excerpt: string        # optional (auto-generated from first 150 chars)
  tags: string[]         # optional
  coverImage: string     # optional (R2 URL)
  publish: boolean       # default true, set false for drafts
  readTime: auto         # calculated from word count ÷ 200wpm
```

### 1.7 Design Inspiration

> **Study these before designing ANY page. Extract patterns, don't copy layouts.**

| Reference | What to Learn |
|-----------|---------------|
| [Awwwards Blog](https://www.awwwards.com/blog/) | Editorial grid layouts, whitespace mastery, typography hierarchy, scroll-triggered animations |
| [Abduzeedo](https://abduzeedo.com/) | Dark mode aesthetics, creative card designs, image-first layouts, vibrant color gradients on dark backgrounds |
| `docs/Dark Glassmorphism-The Aesthetic.md` | 3 pillars: multi-layer transparency, optical blur 10-20px, light-catcher border |
| `docs/uxui-principle.md` | Dev-Ready Spec methodology: Layout → Components → States → Edge Cases → A11y |
| `docs/principle-blog.md` | Navigation UX, page speed, visual consistency, mobile-first, CTA placement |

---

## 2 · Engineering Guardrails

### 2.1 Before You Code

- [ ] Read this file completely
- [ ] Read config.yaml for current settings
- [ ] Check .env.example for required env vars
- [ ] `grep` for existing patterns before creating new ones
- [ ] Confirm change aligns with Section 1.3 decisions
- [ ] Check inspiration references in Section 1.7

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
✓ ALL interactive states defined (hover, focus, active, disabled)
✓ Mobile-first responsive design
```

### 2.3 Performance Guardrails

```
✓ Debounce file events (avoid double-processing)
✓ Clean up temp files on error
✓ Memory-efficient image processing (close handles)
✓ Lazy load images in blog (Next.js <Image> component)
✓ Static generation for blog posts (getStaticProps/generateStaticParams)
✓ will-change: transform on animated glass elements
✓ backdrop-filter: blur max 40px (GPU budget)
✓ Pre-render ambient gradients when possible (avoid runtime blur)
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

### 2.5 Accessibility Guardrails

```
✓ WCAG 2.1 AA minimum contrast on all text
✓ White text (#FFF / #B0B0B0) on dark glass — NEVER dark text
✓ 1px glass borders for boundary definition (visually impaired users)
✓ Fallback bg-gray-900/90 when backdrop-filter unsupported
✓ Focus ring on ALL interactive elements (ring-2 ring-peach/50)
✓ Semantic HTML5 elements (<nav>, <article>, <section>, <footer>)
✓ Single <h1> per page, proper heading hierarchy
✓ ARIA labels on icon-only buttons
```

### 2.6 Deployment Checklist

```
□ Copy .env.example to .env
□ Fill in R2 credentials
□ Update config.yaml paths
□ pip install -r requirements.txt
□ Test: paste image in Obsidian
□ Verify: link updated, image deleted
□ Run: python linkdinger.py
□ Blog: cd blog && npm install && npm run dev
□ Blog: npm run build (verify no errors)
□ Optional: deploy blog to Vercel / CF Pages
```

---

## 3 · Task Execution Protocol

```
STEP  ACTION                    DETAIL
────  ────────────────────────  ───────────────────────────────────────
 1    RETRIEVE context          Read AGENTS.md + config.yaml + docs/
 2    STUDY inspiration         Check awwwards.com/blog + abduzeedo.com
 3    GREP existing patterns    Search for similar code before writing
 4    PLAN minimal changes      List files, expected diff size
 5    IMPLEMENT                 Write code, follow Section 2 guardrails
 6    DEFINE all states         Hover, focus, active, disabled, loading, error
 7    VERIFY                    Run tests + visual check
 8    REVIEW own diff           Check for regressions + a11y
 9    REPORT                    Summarize what changed and why
```

### Critical Rules

1. **NEVER** guess what a file contains — open it first
2. **NEVER** create new utility if one exists — grep first
3. **NEVER** hardcode credentials — use .env
4. **NEVER** skip testing the watcher loop
5. **NEVER** delete original image until upload succeeds
6. **NEVER** use dark text on glass surfaces
7. **NEVER** use solid black backgrounds behind glass (add ambient gradients)
8. **ALWAYS** handle file permission errors gracefully
9. **ALWAYS** log errors with context
10. **ALWAYS** validate config on startup
11. **ALWAYS** use UUID for uploaded filenames
12. **ALWAYS** respect .gitignore patterns
13. **ALWAYS** define ALL interactive states for every component
14. **ALWAYS** study inspiration references before designing new pages

---

## 4 · Quick Commands

```bash
# ── Setup ──
pip install -r requirements.txt
cp .env.example .env
# Edit .env and config.yaml

# ── Unified Daemon ──
python linkdinger.py              # Watcher + auto-git + CMS sync
python linkdinger.py --watch      # Watcher only
python linkdinger.py --git        # Auto-git only
python linkdinger.py --cms        # CMS sync one-shot (no daemon)
python linkdinger.py --status     # Show config status

# ── CMS Sync ──
python content_sync.py            # Standalone full sync
# Publish methods (config.yaml → publish.method):
#   folder — sync all .md in publish/ folder
#   flag   — scan vault for publish: true frontmatter
#   both   — combine both methods

# ── Tests ──
python -m pytest tests/ -v
python -m pytest tests/test_content_sync.py -v  # CMS only

# ── Blog ──
cd blog && npm install && npm run dev
cd blog && npm run build          # Production check
```

---

## 5 · Troubleshooting

| Issue | Check |
|-------|-------|
| Image not uploading | R2 credentials, bucket name, endpoint in .env |
| Link not updating | Vault path in config.yaml, file permissions |
| Git not syncing | git remote configured, SSH keys, auto-git enabled |
| Blog not rendering glass | Missing ambient gradient behind glass element |
| Text unreadable on glass | Check contrast — use white/gray text only |
| Blog build fails | TypeScript errors — run `npm run build` for full check |
| Import errors | Run `pip install -r requirements.txt` |
| backdrop-filter broken | Check browser support, add -webkit- prefix |
| CMS not syncing | Check `publish.method` in config.yaml, verify `publish/` folder exists |
| Image links broken in blog | Check `_assets/.upload_log.json` exists, re-run `python content_sync.py` |
| Post not appearing | Verify frontmatter has `publish: true` (flag mode) or file is in `publish/` folder |
