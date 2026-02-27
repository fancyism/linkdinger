# Linkdinger

Obsidian image pipeline for people who want clean notes, fast media, and automatic backup.

Linkdinger watches your Obsidian vault, converts pasted images to WebP, uploads them to Cloudflare R2, rewrites image links in markdown, and can auto-sync your vault to GitHub after idle time.

No Obsidian plugin required.

## Why Linkdinger

- Keep your Git repo small by moving images out of the vault.
- Get CDN-ready image URLs automatically.
- Keep writing in Obsidian with your normal paste workflow.
- Auto-commit and push notes without manual Git steps.
- Optional Next.js blog included for publishing markdown posts.

## How It Works

1. You paste an image into Obsidian.
2. Linkdinger detects new `.png`, `.jpg`, or `.jpeg` files in your vault.
3. The image is converted to WebP with a UUID filename.
4. The WebP file is uploaded to your Cloudflare R2 bucket.
5. Linkdinger updates image links in the latest modified markdown note.
6. Local image files are cleaned up after successful processing.
7. If auto-git is enabled, a debounced commit/push runs after idle time.

## Quick Start (Use With Your Own Obsidian Vault)

### 1. Prerequisites

- Python 3.10+
- Git installed and available on PATH
- Cloudflare R2 bucket + API credentials
- Obsidian vault folder on your local machine

### 2. Clone and install

```bash
git clone <your-fork-or-this-repo-url>
cd linkdinger
pip install -r requirements.txt
```

### 3. Create `.env`

Windows (PowerShell):

```powershell
Copy-Item .env.example .env
```

macOS/Linux:

```bash
cp .env.example .env
```

Set real values in `.env`:

```env
R2_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
R2_ACCESS_KEY=<YOUR_ACCESS_KEY>
R2_SECRET_KEY=<YOUR_SECRET_KEY>
R2_BUCKET=obsidian-media
R2_PUBLIC_URL=https://pub-<ID>.r2.dev
```

### 4. Point it to your vault

Edit `config.yaml`:

```yaml
vault:
  path: "D:/Path/To/Your/ObsidianVault"
  assets_dir: "_assets"

watcher:
  debounce_sec: 0.5
  formats: [".png", ".jpg", ".jpeg"]
  output_format: "webp"
  quality: 80

git:
  enabled: true
  idle_minutes: 5
  commit_prefix: "auto:"
```

### 5. Validate config

```bash
python linkdinger.py --status
```

### 6. Run the daemon

```bash
python linkdinger.py
```

### 7. Test your flow

1. Open any note in Obsidian.
2. Paste an image.
3. Confirm the note now contains an R2 URL.
4. Confirm local pasted image file is removed.
5. Wait for idle timer and confirm Git sync (if enabled).

## CLI Modes

```bash
python linkdinger.py              # watcher + auto-git
python linkdinger.py --watch      # watcher only
python linkdinger.py --git        # auto-git only
python linkdinger.py --status     # print config status
```

## Shareable Setup For Other People

To help other Obsidian users run this on their own vault:

1. Share this repository link.
2. Tell them to set their own `config.yaml` vault path.
3. Tell them to create their own `.env` with their own R2 keys.
4. Tell them to use their own Git remote for their vault.
5. Start with `python linkdinger.py --status`, then `python linkdinger.py`.

Important: never share your `.env` file or API keys.

## Configuration Reference

### `config.yaml`

- `vault.path`: absolute path to local Obsidian vault.
- `vault.assets_dir`: attachment directory name in vault.
- `watcher.debounce_sec`: wait time before processing new file events.
- `watcher.formats`: file extensions to process.
- `watcher.output_format`: output image format (default `webp`).
- `watcher.quality`: WebP quality.
- `git.enabled`: enable or disable auto-git module.
- `git.idle_minutes`: idle time before commit/push.
- `git.commit_prefix`: commit message prefix.
- `publish.*`: workflow metadata for publishing conventions.

### `.env`

- `R2_ENDPOINT`
- `R2_ACCESS_KEY`
- `R2_SECRET_KEY`
- `R2_BUCKET`
- `R2_PUBLIC_URL`

## Optional Blog (Next.js 14)

The `blog/` app is optional and separate from the Python daemon.

```bash
cd blog
npm install
npm run dev
```

Add posts to `blog/content/posts/*.md` with frontmatter:

```yaml
---
title: "Post title"
date: "2026-02-19"
excerpt: "Short description"
tags: ["tag1", "tag2"]
publish: true
---
```

`publish: false` hides a post from listing pages.

## Tests

```bash
python -m pytest tests/ -v
```

## Troubleshooting

- Image not uploading:
  - Check R2 keys, endpoint, bucket, and public URL in `.env`.
- Link not replaced:
  - Check vault path and markdown image format in your note.
- Git not syncing:
  - Confirm vault is a Git repo with a valid remote and auth.
- Module import errors:
  - Run `pip install -r requirements.txt`.

## Current Behavior Notes

- The watcher runs recursively across the vault.
- Link replacement targets the latest modified markdown file.
- Supported image link patterns include:
  - `![[image.png]]`
  - `![alt](path/to/image.png)`

## Project Structure

```text
linkdinger/
|-- linkdinger.py         # unified daemon entrypoint
|-- obsidian_watcher.py   # image detect/convert/upload/link-rewrite
|-- auto_git.py           # debounced git add/commit/push
|-- config.yaml           # runtime settings
|-- .env.example          # required environment variable template
|-- tests/                # pytest tests
`-- blog/                 # optional Next.js blog frontend
```

## Security Basics

- Keep `.env` private.
- Use scoped R2 API tokens for one bucket only.
- Use a private Git repository for personal vault content.

---

If you want the same workflow on another machine, copy the repo, set `config.yaml`, create `.env`, run `python linkdinger.py`, and you are ready.
