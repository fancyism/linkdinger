---
title: Building a Smart Blog with Dark Glassmorphism
date: 2026-02-27
locale: en
translationKey: building-smart-blog-dark-glassmorphism
canonicalLocale: en
category: Tech
excerpt: How I built a dual-theme blog with Obsidian CMS integration, Cloudflare R2 image pipeline, and award-winning design patterns.
tags:
  - NextJS
  - Glassmorphism
  - vibe-coding
  - AI
coverImage: https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&h=630&fit=crop
publish: true
---

# The Vision

What if your personal blog could look like it was designed by the Awwwards jury, while being powered by nothing more than **Obsidian** and **Git**?

That's exactly what Linkdinger is: a smart blog where writing happens in Obsidian, images are auto-uploaded to Cloudflare R2, and everything syncs to GitHub — all through a single daemon process.

## Dark Glassmorphism: More Than Just Blur

Glassmorphism has been trending for a while, but most implementations miss the point. It's not about adding `backdrop-filter: blur(20px)` to everything — it's about **simulating real glass physics**.

### The Three Pillars

1. **Multi-Layer Transparency** — Alpha-channel gradients, not flat opacity
2. **Optical Blur** — 10-20px sweet spot, enough to distort but not erase
3. **Light Catcher Borders** — 1px `rgba(255,255,255,0.1)` mimics edge refraction

```css
.glass-card {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
}
```

### The Critical Missing Piece

Here's what 90% of developers get wrong: **glass is invisible on a solid dark background**. You need ambient gradient orbs — vibrant blobs of color (deep purple, electric blue, hot pink) floating behind your UI. Without them, you just have grey boxes.

## The Tech Stack

| Component | Technology |
|-----------|-----------|
| Writing | Obsidian vault |
| Images | WebP conversion → Cloudflare R2 |
| Version Control | Auto-git daemon |
| Blog | Next.js 14 (Server Components) |
| Styling | Tailwind CSS + Custom glass system |
| Fonts | Outfit (display) + Inter (body) + JetBrains Mono (code) |

## Dual Theme Architecture

Supporting both dark and light themes with glassmorphism is tricky. The key insight: **invert the glass formula**.

- **Dark mode**: `bg-white/[0.03]` + `border-white/[0.08]`
- **Light mode**: `bg-black/[0.03]` + `border-black/[0.08]`

The ambient gradients also transform — from neon orbs to soft pastels.

> The best UI is one that feels alive. Glass surfaces react to the colors behind them, creating a dynamic experience that flat design simply can't match.

## What's Next

- Full-text search with real-time filtering
- Reading progress bar and table of contents
- CMS sync from Obsidian's publish folder
- RSS feed generation

---

*Built with obsession. Every commit lands on GitHub for you to fork & remix.*
