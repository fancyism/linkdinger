<p align="center">
  <img src="public/logo.svg" alt="Linkdinger Logo" width="120" height="120">
</p>

<h1 align="center">Linkdinger</h1>

<p align="center">
  <strong>Zero-Friction Obsidian Image Pipeline + Blog CMS</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#how-it-works">How It Works</a> •
  <a href="#blog">Blog</a> •
  <a href="#configuration">Configuration</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/python-3.10+-blue.svg" alt="Python 3.10+">
  <img src="https://img.shields.io/badge/next.js-14-black.svg" alt="Next.js 14">
  <img src="https://img.shields.io/badge/license-MIT-green.svg" alt="License">
</p>

---

## What is Linkdinger?

Linkdinger is a **unified content workflow** that connects your Obsidian vault to the modern web:

1. **Image Pipeline** — Paste images in Obsidian → auto-convert to WebP → upload to Cloudflare R2 → links rewritten automatically
2. **Auto Git Sync** — Debounced commits after idle time, keeping your vault versioned
3. **Blog CMS** — Publish markdown posts from Obsidian to a beautiful Next.js blog

**No Obsidian plugins required.** Just a Python daemon running in the background.

## Features

| Feature | Description |
|---------|-------------|
| **Automatic Image Processing** | Detects pasted images, converts to WebP, uploads to R2 |
| **Smart Link Rewriting** | Updates markdown image links automatically |
| **Debounced Git Sync** | Commits and pushes after configurable idle time |
| **Dual Publish Mode** | Sync from folder OR frontmatter flag |
| **Beautiful Blog** | Dark Glassmorphism + Neubrutalism design |
| **Server Components** | Zero JS shipped by default for blazing fast loads |
| **Full-Text Search** | Real-time filtering across all posts |
| **Tag System** | Organize content with tags |

## Quick Start

### Prerequisites

- Python 3.10+
- Node.js 18+ (for blog)
- Cloudflare R2 bucket + API credentials
- Git

### 1. Clone & Install

```bash
git clone https://github.com/yourusername/linkdinger.git
cd linkdinger
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your R2 credentials:

```env
R2_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
R2_ACCESS_KEY=your_access_key
R2_SECRET_KEY=your_secret_key
R2_BUCKET=obsidian-media
R2_PUBLIC_URL=https://pub-<ID>.r2.dev
```

### 3. Configure Vault Path

Edit `config.yaml`:

```yaml
vault:
  path: "/path/to/your/obsidian/vault"
  assets_dir: "_assets"
```

### 4. Run

```bash
python linkdinger.py
```

### 5. Test

1. Open any note in Obsidian
2. Paste an image
3. Watch the magic happen — image uploads, link updates

## How It Works

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Obsidian      │────▶│   Linkdinger     │────▶│  Cloudflare R2  │
│   (paste image) │     │   (daemon)       │     │  (CDN storage)  │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌──────────────────┐
                        │   Markdown       │
                        │   (links updated)│
                        └──────────────────┘
```

**Flow:**
1. You paste an image into Obsidian
2. Linkdinger detects the new file
3. Image is converted to WebP with UUID filename
4. WebP is uploaded to your R2 bucket
5. Markdown links are rewritten to R2 URLs
6. Local image file is cleaned up
7. (Optional) Git commit/push after idle time

## CLI Commands

```bash
python linkdinger.py              # Full daemon (watcher + auto-git)
python linkdinger.py --watch      # Image watcher only
python linkdinger.py --git        # Auto-git sync only
python linkdinger.py --cms        # CMS sync (one-shot)
python linkdinger.py --status     # Show configuration status
```

## Blog

The `blog/` directory contains a production-ready Next.js 14 blog with stunning design.

### Setup

```bash
cd blog
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Writing Posts

Create markdown files in `blog/content/posts/`:

```markdown
---
title: "Your Post Title"
date: "2024-03-15"
excerpt: "A compelling description"
tags: ["tech", "tutorial"]
coverImage: "https://your-cdn.com/image.webp"
publish: true
---

Your content here...
```

### Design System

- **Dark Glassmorphism** — Multi-layer transparency with optical blur
- **Neubrutalism Accents** — Bold borders with offset shadows
- **Typography** — Outfit (display) + Inter (body) + JetBrains Mono (code)
- **Animations** — Smooth transitions with GPU-accelerated transforms

### Build & Deploy

```bash
npm run build    # Production build
npm run export   # Static export (optional)
```

Deploy to **Vercel** or **Cloudflare Pages** with zero configuration.

## Configuration

### config.yaml

| Option | Description | Default |
|--------|-------------|---------|
| `vault.path` | Absolute path to Obsidian vault | Required |
| `vault.assets_dir` | Attachment folder name | `_assets` |
| `watcher.debounce_sec` | Wait time before processing | `0.5` |
| `watcher.formats` | Image formats to process | `[.png, .jpg, .jpeg]` |
| `watcher.output_format` | Output format | `webp` |
| `watcher.quality` | WebP quality | `80` |
| `git.enabled` | Enable auto-git | `true` |
| `git.idle_minutes` | Idle time before commit | `5` |
| `publish.method` | `folder`, `flag`, or `both` | `both` |

### Publish Methods

- **folder** — Sync all `.md` files in `publish/` folder
- **flag** — Scan vault for `publish: true` in frontmatter
- **both** — Combine both methods

## Project Structure

```
linkdinger/
├── linkdinger.py          # Unified daemon entry point
├── obsidian_watcher.py    # Image processing module
├── auto_git.py            # Git sync module
├── content_sync.py        # CMS sync module
├── dashboard.py           # Web dashboard (optional)
├── config.yaml            # User configuration
├── .env.example           # Environment template
├── requirements.txt       # Python dependencies
├── tests/                 # Pytest test suite
└── blog/                  # Next.js blog frontend
    ├── app/               # App Router pages
    ├── components/        # React components
    ├── content/posts/     # Markdown blog posts
    ├── lib/               # Utilities
    └── public/            # Static assets
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Daemon** | Python 3.10+ |
| **Storage** | Cloudflare R2 (S3-compatible) |
| **Blog** | Next.js 14 (App Router) |
| **Styling** | Tailwind CSS |
| **Typography** | Outfit, Inter, JetBrains Mono |
| **Icons** | Lucide React |
| **Deployment** | Vercel / Cloudflare Pages |

## Security

- **Never commit `.env`** — Contains R2 API credentials
- **Scoped R2 tokens** — Limit API tokens to specific buckets
- **Private vault repo** — Keep personal notes in a private Git repository
- **UUID filenames** — No predictable URLs, prevents enumeration

## Development

### Run Tests

```bash
python -m pytest tests/ -v
```

### Blog Development

```bash
cd blog
npm run dev       # Development server
npm run build     # Production build check
npm run lint      # ESLint
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Image not uploading | Check R2 credentials in `.env` |
| Link not replaced | Verify vault path in `config.yaml` |
| Git not syncing | Ensure vault is a Git repo with remote |
| Blog build fails | Run `npm run build` for detailed errors |
| Import errors | Run `pip install -r requirements.txt` |

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing`)
5. Open a Pull Request

## License

This project uses dual licensing:

- **Documentation & Blog Posts** — [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)
- **Code** — [MIT License](LICENSE)

## Acknowledgments

- [Obsidian](https://obsidian.md) — The best note-taking app
- [Cloudflare R2](https://www.cloudflare.com/products/r2/) — Zero egress object storage
- [Next.js](https://nextjs.org) — The React framework
- [Tailwind CSS](https://tailwindcss.com) — Utility-first CSS

---

<p align="center">
  <strong>Built with obsession. Every commit lands for you to fork & remix.</strong>
</p>

<p align="center">
  <a href="https://github.com/yourusername/linkdinger/stargazers">
    <img src="https://img.shields.io/github/stars/yourusername/linkdinger?style=social" alt="Star on GitHub">
  </a>
</p>
