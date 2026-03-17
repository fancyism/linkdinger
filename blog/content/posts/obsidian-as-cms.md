---
title: "Replacing Conventional CMS with Obsidian"
date: "2024-02-28"
category: "Productivity"
excerpt: "Why I stopped dealing with cluttered database-driven CMS platforms and moved my entire publishing workflow to local markdown files."
tags: 
  - Productivity
  - Obsidian
  - CMS
coverImage: "https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=1200&h=630&fit=crop"
publish: true
---

# The Problem with Traditional CMS

WordPress, Ghost, Contentful—they are all powerful tools, but they add immense friction. When an idea strikes, you have to log into a web portal, deal with WYSIWYG editors that inevitably mess up formatting, and worry about database backups.

## Enter the Local Vault

By using **Obsidian** as my single source of truth, I regain complete ownership of my data. It's just a folder of text files.

### The Workflow

1. **Write locally**: No internet required, instant search, and bidirectional linking.
2. **Add Frontmatter**: Simply tagging a note with `publish: true` flags it for the public.
3. **The Watcher**: A Python script monitors the vault. If it sees a new image, it compresses it, uploads it to Cloudflare R2, and rewrites the markdown link.
4. **Git Sync**: The script silently commits and pushes the changes. Vercel picks it up and redeploys the Next.js frontend.

## Why This Works

| Traditional CMS | Obsidian + Linkdinger |
|----------------|----------------------|
| Login required | Just open a file |
| Database backup | Git version control |
| WYSIWYG quirks | Pure markdown |
| Image upload UI | Paste and forget |
| Deploy manually | Automatic on push |

No databases. No logins. Just pure writing. This is the exact philosophy behind Linkdinger.

## Getting Started

1. Install Obsidian
2. Create a vault
3. Write in markdown
4. Add `publish: true` to frontmatter
5. Let Linkdinger handle the rest
