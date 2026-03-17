---
title: "Introducing Linkdinger"
date: "2024-03-15"
category: "Announcement"
excerpt: "A unified content workflow connecting Obsidian to the modern web. Auto image processing, git sync, and a beautiful blog — all from one daemon."
tags:
  - Announcement
  - Open Source
  - Productivity
coverImage: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&h=630&fit=crop"
publish: true
---

# The Problem

If you use Obsidian for note-taking, you've probably encountered these pain points:

1. **Image bloat** — Paste a few screenshots and your vault grows by megabytes
2. **Git repo size** — Images don't belong in version control
3. **Manual workflows** — Upload to CDN, copy URL, update link... every single time
4. **Publishing friction** — Getting notes to a blog requires copy-paste or complex setups

**Linkdinger solves all of this.**

## What is Linkdinger?

Linkdinger is a **zero-friction content pipeline** that runs silently in the background:

- **Automatic image processing** — Detect, convert, upload, rewrite
- **Smart git sync** — Debounced commits after you stop typing
- **Blog CMS** — Publish from Obsidian to a stunning Next.js blog

No Obsidian plugins required. Just a Python daemon doing the heavy lifting.

## The Architecture

```
Obsidian Vault
     │
     ▼
┌─────────────────────────────────────────┐
│           Linkdinger Daemon             │
│  ┌─────────┐ ┌─────────┐ ┌───────────┐  │
│  │ Watcher │ │ AutoGit │ │ CMS Sync  │  │
│  └────┬────┘ └────┬────┘ └─────┬─────┘  │
└───────┼───────────┼────────────┼────────┘
        │           │            │
        ▼           ▼            ▼
   Cloudflare R2   GitHub    Blog/Content
```

## Key Features

### 1. Image Pipeline

```python
# What happens when you paste an image:
1. File event detected (.png, .jpg, .jpeg)
2. Convert to WebP with UUID filename
3. Upload to Cloudflare R2
4. Rewrite markdown links
5. Delete local file
```

### 2. Auto Git Sync

Never forget to commit again. Linkdinger watches for changes and triggers a debounced commit/push after configurable idle time.

### 3. Blog CMS

Write in Obsidian, publish to the web. The blog features:

- **Dark Glassmorphism** design
- **Neubrutalism** accents
- **Server Components** for performance
- **Full-text search**
- **Tag filtering**

## Getting Started

```bash
# Clone and install
git clone https://github.com/yourusername/linkdinger.git
cd linkdinger
pip install -r requirements.txt

# Configure
cp .env.example .env
# Edit .env with your R2 credentials

# Run
python linkdinger.py
```

That's it. Paste an image in Obsidian and watch it transform into a CDN-ready URL.

## Why Cloudflare R2?

- **Zero egress fees** — Unlike S3, you pay nothing for downloads
- **Global CDN** — Fast delivery worldwide
- **S3-compatible** — Works with existing tools
- **Generous free tier** — 10GB storage, 10M operations/month

## What's Next

This is just the beginning. Roadmap includes:

- [ ] Real-time collaboration support
- [ ] Multiple storage backends (S3, Backblaze, etc.)
- [ ] Plugin system for custom processors
- [ ] Mobile companion app
- [ ] AI-powered image optimization

---

*Linkdinger is open source and available on GitHub. Star the repo if you find it useful!*
