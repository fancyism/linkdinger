# Linkdinger Architecture Guide

> **สารบัญ**: คู่มือนี้อธิบายสถาปัตยกรรมทั้งหมดของ Linkdinger ตั้งแต่พื้นฐานจนถึงขั้นสูง
> รวมถึง Backend (Python Daemon), Frontend (Next.js 14), และ CI/CD Pipeline

---

## 📋 Table of Contents

1. [Overview](#1-overview)
2. [Backend Architecture (Python)](#2-backend-architecture-python)
3. [Frontend Architecture (Next.js 14)](#3-frontend-architecture-nextjs-14)
4. [Data Flow](#4-data-flow)
5. [External Services](#5-external-services)
6. [CI/CD Pipeline](#6-cicd-pipeline)
7. [Advanced Concepts](#7-advanced-concepts)
8. [Troubleshooting](#8-troubleshooting)

---

## 1. Overview

### 1.1 โครงสร้างโปรเจกต์

```
linkdinger/
├── 🐍 Python Backend (Daemon)
│   ├── linkdinger.py          # Entry point หลัก
│   ├── obsidian_watcher.py    # Image pipeline
│   ├── auto_git.py            # Git sync
│   ├── content_sync.py        # CMS sync
│   └── dashboard.py           # Web dashboard
│
├── 🌐 Next.js Frontend (Blog)
│   └── blog/
│       ├── app/               # App Router pages
│       ├── components/        # React components
│       ├── lib/               # Utilities
│       └── content/posts/     # Markdown posts
│
├── ⚙️ Configuration
│   ├── config.yaml            # Main config
│   ├── .env                   # Secrets (gitignored)
│   └── .env.example           # Template
│
└── 📚 Documentation
    └── docs/
```

### 1.2 เทคโนโลยีที่ใช้

| Layer | Technology | Purpose |
|-------|------------|---------|
| Backend Daemon | Python 3.10+ | File watching, image processing, git sync |
| Frontend | Next.js 14 | Blog UI with Server Components |
| Styling | Tailwind CSS | Dark Glassmorphism design |
| Storage | Cloudflare R2 | Image hosting (S3-compatible) |
| Database | Upstash Redis | View counter (REST API) |
| Version Control | Git + GitHub | Notes backup & blog deployment |

---

## 2. Backend Architecture (Python)

### 2.1 พื้นฐาน Backend

> **สำคัญ**: Backend ของ Linkdinger ไม่ใช่ Next.js API Routes แต่เป็น **Python Daemon** ที่ทำงานเป็น background process

#### ทำไมต้องใช้ Python Daemon?

1. **File System Watching**: ต้อง monitor Obsidian vault ตลอดเวลา
2. **Image Processing**: ต้องใช้ PIL/Pillow สำหรับแปลงรูป
3. **Long-running Process**: ทำงานเป็น daemon ไม่ใช่ request-response

### 2.2 สถาปัตยกรรม Backend

```
┌─────────────────────────────────────────────────────────────┐
│                     LINKDINGER DAEMON                        │
│                    (linkdinger.py)                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Watcher    │  │  Auto-Git    │  │  CMS Sync    │      │
│  │ (obsidian_   │  │ (auto_git.py)│  │(content_sync)│      │
│  │  watcher.py) │  │              │  │              │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                 │                  │              │
│         ▼                 ▼                  ▼              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                   EVENT BUS                          │  │
│  │         (notify callbacks between modules)           │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────┐                                          │
│  │  Dashboard   │  ← HTTP :9999 (optional)                │
│  │(dashboard.py)│                                          │
│  └──────────────┘                                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2.3 Module Overview

#### 2.3.1 `linkdinger.py` - Main Entry Point

```python
# โครงสร้างหลักของ daemon
def run_daemon(watch=True, git=True, cms=True, dashboard=True):
    """
    1. Load config from config.yaml
    2. Initialize modules (Watcher, AutoGit, CMS)
    3. Setup callbacks between modules
    4. Start all services
    5. Run main loop until Ctrl+C
    """
```

**Key Features:**

- **Unified entry point**: รันทุก module จากไฟล์เดียว
- **Graceful shutdown**: จัดการ Ctrl+C อย่างถูกต้อง
- **Module orchestration**: เชื่อมโยง modules ผ่าน callbacks

#### 2.3.2 `obsidian_watcher.py` - Image Pipeline

```python
class ImageHandler(FileSystemEventHandler):
    """
    Watchdog handler สำหรับจับ event ไฟล์ใหม่
    
    Flow:
    1. on_created() → ไฟล์ใหม่ถูกสร้าง
    2. _check_and_process() → ตรวจสอบนามสกุล
    3. process_image() → ประมวลผลรูป
    """
    
    def process_image(self, filepath: str):
        # Step 1: Convert to WebP
        webp_path, webp_name = self.processor.convert_to_webp(filepath)
        
        # Step 2: Upload to R2
        url = self.uploader.upload(webp_path, webp_name)
        
        # Step 3: Update markdown links
        self.md_updater.replace_image_link(original_name, url)
        
        # Step 4: Cleanup local files
        os.remove(filepath)
        os.remove(webp_path)
```

**Key Classes:**

| Class | Responsibility |
|-------|---------------|
| `Config` | Load และ validate config.yaml |
| `R2Uploader` | Upload ไฟล์ไป Cloudflare R2 |
| `ImageProcessor` | แปลงรูปเป็น WebP |
| `MarkdownUpdater` | อัพเดท link ใน markdown |
| `ImageHandler` | Watchdog event handler |

#### 2.3.3 `auto_git.py` - Event-Driven Git Sync

```python
class AutoGit:
    """
    Git sync แบบ event-driven
    
    ทำงานอย่างไร:
    1. notify() ถูกเรียกเมื่อมีการเปลี่ยนแปลง
    2. Reset timer ใหม่ (idle_minutes)
    3. เมื่อ timer หมด → sync()
    4. sync() = git add . && git commit && git push
    """
    
    def notify(self):
        """Called by watcher after each change"""
        with self._lock:
            # Cancel existing timer
            if self._timer:
                self._timer.cancel()
            
            # Start new timer
            delay = self.idle_minutes * 60
            self._timer = threading.Timer(delay, self._timer_fired)
            self._timer.start()
    
    def sync(self) -> bool:
        """Stage, commit, and push"""
        self.run_git_command("add", ".")
        self.run_git_command("commit", "-m", message)
        self.run_git_command("push")
```

**Why Event-Driven?**

- ไม่ต้อง polling ทุก 30 วินาที
- ประหยัด resource
- ทันทีที่หยุดพิมพ์ → sync หลัง idle_minutes

### 2.4 Configuration System

#### `config.yaml` Structure

```yaml
# Vault settings
vault:
  path: "D:/Obsidian/Hack - 2nd.Brain"  # Path to Obsidian vault
  assets_dir: "_assets"                  # Image folder name

# Cloudflare R2 (S3-compatible storage)
r2:
  endpoint: "${R2_ENDPOINT}"    # From .env
  bucket: "${R2_BUCKET}"
  public_url: "${R2_PUBLIC_URL}"

# Image watcher settings
watcher:
  debounce_sec: 0.5            # Wait before processing
  formats: [".png", ".jpg", ".jpeg", ".webp", ".gif"]
  output_format: "webp"        # Convert to WebP
  quality: 80                  # WebP quality

# Git auto-sync
git:
  enabled: true
  idle_minutes: 5              # Sync after 5 min idle
  commit_prefix: "auto:"

# CMS publish settings
publish:
  method: "both"               # "folder" | "flag" | "both"
  folder: "publish"            # Folder to watch
  flag: "publish"              # Frontmatter flag name

# Blog content directory
blog:
  content_dir: "blog/content/posts"
```

#### Environment Variables (`.env`)

```bash
# Cloudflare R2 Credentials
R2_ENDPOINT=https://<account>.r2.cloudflarestorage.com
R2_ACCESS_KEY=<access_key>
R2_SECRET_KEY=<secret_key>
R2_BUCKET=obsidian-media
R2_PUBLIC_URL=https://pub-xxx.r2.dev
```

---

## 3. Frontend Architecture (Next.js 14)

### 3.1 พื้นฐาน Next.js 14 App Router

> **สำคัญ**: Blog ใช้ **Next.js 14 App Router** ซึ่งแตกต่างจาก Pages Router แบบเก่า

#### App Router vs Pages Router

| Feature | Pages Router (เก่า) | App Router (ใหม่) |
|---------|-------------------|------------------|
| File structure | `pages/` | `app/` |
| Data fetching | `getServerSideProps` | Async Server Components |
| API Routes | `pages/api/` | `app/api/` |
| Layouts | `_app.js` | `layout.tsx` |
| Loading states | Manual | `loading.tsx` |
| Error handling | `_error.js` | `error.tsx` |

### 3.2 โครงสร้าง App Router

```
blog/app/
├── layout.tsx          # Root layout (Navbar + Footer)
├── page.tsx            # Home page (/)
├── loading.tsx         # Loading UI
├── not-found.tsx       # 404 page
├── globals.css         # Global styles
│
├── blog/
│   ├── page.tsx        # Blog listing (/blog)
│   ├── blog-client.tsx # Client component for interactivity
│   └── [slug]/
│       ├── page.tsx    # Post detail (/blog/my-post)
│       └── post-detail.tsx
│
├── about/
│   └── page.tsx        # About page (/about)
│
├── search/
│   ├── page.tsx        # Search page (/search)
│   └── client.tsx      # Client-side search
│
└── tag/
    └── [tag]/
        └── page.tsx    # Tag filter (/tag/nextjs)
```

### 3.3 Server Components vs Client Components

#### Server Components (Default)

```tsx
// app/blog/page.tsx - Server Component (default)
import { getAllPosts } from '@/lib/posts'

// ✅ รันบน server เท่านั้น
// ✅ สามารถอ่านไฟล์โดยตรง
// ✅ ไม่มี JavaScript ใน bundle

export default async function BlogPage() {
    const posts = await getAllPosts() // Direct file system access
    
    return (
        <div>
            {posts.map(post => (
                <PostCard key={post.slug} post={post} />
            ))}
        </div>
    )
}
```

#### Client Components (Interactive)

```tsx
// components/view-counter.tsx - Client Component
'use client' // ← Required for client-side code

import { useEffect, useState } from 'react'

// ✅ รันบน client (browser)
// ✅ ใช้ hooks (useState, useEffect)
// ✅ ใช้ event handlers

export default function ViewCounter({ slug }) {
    const [views, setViews] = useState(0)
    
    useEffect(() => {
        // Fetch from Upstash Redis
        fetch(`${UPSTASH_URL}/incr/page_views:${slug}`)
            .then(res => res.json())
            .then(data => setViews(data.result))
    }, [slug])
    
    return <span>{views} views</span>
}
```

### 3.4 Data Fetching Patterns

#### Static Generation (Build Time)

```tsx
// lib/posts.ts
import fs from 'fs'
import matter from 'gray-matter'

export function getAllPosts(): Post[] {
    // ✅ อ่านไฟล์จาก file system (server-side only)
    const postsDirectory = path.join(process.cwd(), 'content/posts')
    const files = fs.readdirSync(postsDirectory)
    
    return files.map(file => {
        const content = fs.readFileSync(path.join(postsDirectory, file), 'utf8')
        const { data, content } = matter(content)
        
        return {
            slug: file.replace('.md', ''),
            title: data.title,
            date: data.date,
            // ...
        }
    })
}
```

#### Dynamic Routes with Static Generation

```tsx
// app/blog/[slug]/page.tsx
import { getPostBySlug, getAllPosts } from '@/lib/posts'

// Generate static pages for all posts
export async function generateStaticParams() {
    const posts = getAllPosts()
    return posts.map(post => ({ slug: post.slug }))
}

export default async function PostPage({ 
    params 
}: { 
    params: { slug: string } 
}) {
    const post = await getPostBySlug(params.slug)
    
    return <PostDetail post={post} />
}
```

### 3.5 External API Integration (Upstash Redis)

> **หมายเหตุ**: โปรเจกต์นี้ไม่มี Next.js API Routes แต่ใช้ **Upstash Redis REST API** โดยตรง

```tsx
// components/view-counter.tsx
const url = process.env.NEXT_PUBLIC_UPSTASH_REDIS_REST_URL
const token = process.env.NEXT_PUBLIC_UPSTASH_REDIS_REST_TOKEN

// Increment view count
await fetch(`${url}/incr/page_views:${slug}`, {
    headers: { Authorization: `Bearer ${token}` }
})

// Get view count
await fetch(`${url}/get/page_views:${slug}`, {
    headers: { Authorization: `Bearer ${token}` }
})
```

**Why Upstash Redis REST?**

- ไม่ต้อง maintain Redis server
- HTTP-based → ใช้ได้ใน Server Components
- Edge-compatible
- Free tier available

### 3.6 Markdown Processing Pipeline

```
Markdown File (content/posts/*.md)
        │
        ▼
┌───────────────────┐
│   gray-matter     │  ← Parse frontmatter
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│     remark        │  ← Markdown → MDAST
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│   remark-rehype   │  ← MDAST → HAST
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│  rehype-highlight │  ← Syntax highlighting
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│  rehype-stringify │  ← HAST → HTML
└─────────┬─────────┘
          │
          ▼
      HTML String
```

---

## 4. Data Flow

### 4.1 Complete Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         LINKDINGER DATA FLOW                            │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────┐     Paste Image      ┌──────────────────┐
│   Obsidian   │ ──────────────────▶  │  Vault Folder    │
│   (Editor)   │                      │  (Local FS)      │
└──────────────┘                      └────────┬─────────┘
                                               │
                                               │ File Created Event
                                               ▼
                                      ┌──────────────────┐
                                      │ ImageHandler     │
                                      │ (watchdog)       │
                                      └────────┬─────────┘
                                               │
                          ┌────────────────────┼────────────────────┐
                          │                    │                    │
                          ▼                    ▼                    ▼
                 ┌────────────────┐   ┌────────────────┐   ┌────────────────┐
                 │ Convert WebP   │   │ Upload to R2   │   │ Update MD Link │
                 │ (PIL)          │   │ (boto3/S3)     │   │ (regex)        │
                 └────────┬───────┘   └────────┬───────┘   └────────┬───────┘
                          │                    │                    │
                          │                    ▼                    │
                          │           ┌──────────────────┐         │
                          │           │ Cloudflare R2    │         │
                          │           │ (CDN Storage)    │         │
                          │           └────────┬─────────┘         │
                          │                    │                    │
                          └────────────────────┼────────────────────┘
                                               │
                                               │ notify()
                                               ▼
                                      ┌──────────────────┐
                                      │ AutoGit.notify() │
                                      └────────┬─────────┘
                                               │
                                               │ After idle_minutes
                                               ▼
                                      ┌──────────────────┐
                                      │ git add .        │
                                      │ git commit       │
                                      │ git push         │
                                      └────────┬─────────┘
                                               │
                                               ▼
                                      ┌──────────────────┐
                                      │ GitHub Repo      │
                                      │ (Private Backup) │
                                      └──────────────────┘


┌──────────────┐     Edit .md        ┌──────────────────┐
│   Obsidian   │ ──────────────────▶ │  publish/ folder │
│   (Editor)   │                      │  (Markdown)      │
└──────────────┘                      └────────┬─────────┘
                                               │
                                               │ File Change Event
                                               ▼
                                      ┌──────────────────┐
                                      │ MarkdownHandler  │
                                      │ (watchdog)       │
                                      └────────┬─────────┘
                                               │
                                               │ cms_callback()
                                               ▼
                                      ┌──────────────────┐
                                      │ content_sync.py  │
                                      │ (CMS Sync)       │
                                      └────────┬─────────┘
                                               │
                                               │ Copy + Rewrite
                                               ▼
                                      ┌──────────────────┐
                                      │ blog/content/    │
                                      │ posts/*.md       │
                                      └────────┬─────────┘
                                               │
                                               │ npm run build
                                               ▼
                                      ┌──────────────────┐
                                      │ Next.js SSG      │
                                      │ (Static Site)    │
                                      └────────┬─────────┘
                                               │
                                               ▼
                                      ┌──────────────────┐
                                      │ Vercel/CF Pages  │
                                      │ (Deployment)     │
                                      └──────────────────┘
```

### 4.2 Image Processing Flow

```python
# Step-by-step image processing

1. USER PASTES IMAGE IN OBSIDIAN
   └── File created: screenshot.png

2. WATCHDOG DETECTS NEW FILE
   └── ImageHandler.on_created() triggered

3. DEBOUNCE (0.5s)
   └── Wait to ensure file write is complete

4. CONVERT TO WEBP
   ├── Open with PIL
   ├── Convert RGBA → RGB (if needed)
   ├── Save as WebP (quality: 80)
   └── New file: a1b2c3d4.webp (UUID filename)

5. UPLOAD TO R2
   ├── boto3 S3 client
   ├── Upload to Cloudflare R2
   └── Return URL: https://pub-xxx.r2.dev/a1b2c3d4.webp

6. UPDATE MARKDOWN LINKS
   ├── Find latest modified .md file
   ├── Replace ![[screenshot.png]] → ![image](https://...)
   └── Update coverImage in frontmatter

7. CLEANUP LOCAL FILES
   ├── Delete original screenshot.png
   └── Delete temporary webp file

8. NOTIFY AUTO-GIT
   └── AutoGit.notify() → Timer starts
```

### 4.3 CMS Sync Flow

```python
# Content synchronization from Obsidian to Blog

1. USER EDITS MARKDOWN IN publish/ FOLDER
   └── File modified: publish/my-post.md

2. WATCHDOG DETECTS CHANGE
   └── MarkdownHandler.on_modified() triggered

3. CMS CALLBACK
   └── content_sync.notify(filepath, deleted=False)

4. SYNC PROCESS
   ├── Read source markdown
   ├── Rewrite image links using .upload_log.json
   ├── Calculate read time
   ├── Copy to blog/content/posts/
   └── Update manifest

5. TRIGGER AUTO-GIT
   └── AutoGit.notify() for both vault and blog repos
```

---

## 5. External Services

### 5.1 Cloudflare R2 (S3-Compatible Storage)

#### ทำไมต้องใช้ R2?

| Feature | GitHub | Cloudflare R2 |
|---------|--------|---------------|
| Storage limit | 1GB repo | 10GB free |
| Bandwidth | Limited | Unlimited (free) |
| CDN | No | Yes (global) |
| Cost | Free | Free tier available |

#### R2 Configuration

```python
# obsidian_watcher.py
import boto3

class R2Uploader:
    def __init__(self, config: Config):
        self.client = boto3.client(
            "s3",
            endpoint_url=config.r2_endpoint,  # R2 endpoint
            aws_access_key_id=config.r2_access_key,
            aws_secret_access_key=config.r2_secret_key,
        )
    
    def upload(self, filepath: str, filename: str) -> str:
        self.client.upload_file(
            filepath,
            self.config.r2_bucket,
            filename,
            ExtraArgs={"ContentType": f"image/{format}"}
        )
        return f"{self.config.r2_public_url}/{filename}"
```

### 5.2 Upstash Redis (View Counter)

#### Architecture

```
┌──────────────┐     HTTP REST      ┌──────────────────┐
│ ViewCounter  │ ─────────────────▶ │  Upstash Redis   │
│ (Client)     │                    │  (Edge Database) │
└──────────────┘                    └──────────────────┘
       │
       │ Commands via REST API
       │
       ├── INCR page_views:my-post-slug  → Increment counter
       └── GET page_views:my-post-slug   → Get current count
```

#### REST API Usage

```typescript
// Increment (returns new value)
const response = await fetch(
    `${UPSTASH_URL}/incr/page_views:${slug}`,
    {
        headers: { Authorization: `Bearer ${TOKEN}` }
    }
)
// Response: {"result": "42"}

// Get value
const response = await fetch(
    `${UPSTASH_URL}/get/page_views:${slug}`,
    {
        headers: { Authorization: `Bearer ${TOKEN}` }
    }
)
// Response: {"result": "42"}
```

### 5.3 GitHub (Version Control)

#### Two Repositories

1. **Vault Repo (Private)**
   - Obsidian notes backup
   - Auto-committed by AutoGit

2. **Blog Repo (Public)**
   - Next.js blog code
   - Deployed to Vercel

---

## 6. CI/CD Pipeline

### 6.1 Current Deployment Flow

```
┌──────────────────┐                    ┌──────────────────┐
│  Local Machine   │                    │    GitHub        │
│                  │                    │                  │
│  ┌────────────┐  │   git push         │  ┌────────────┐  │
│  │ Obsidian   │  │ ─────────────────▶ │  │ Main Branch│  │
│  │ Vault      │  │                    │  └─────┬──────┘  │
│  └────────────┘  │                    │        │         │
│                  │                    │        │ trigger │
│  ┌────────────┐  │                    │        ▼         │
│  │ Linkdinger │  │                    │  ┌────────────┐  │
│  │ Daemon     │  │                    │  │ Vercel     │  │
│  │ (auto-git) │  │                    │  │ Webhook    │  │
│  └────────────┘  │                    │  └─────┬──────┘  │
└──────────────────┘                    └────────│─────────┘
                                                 │
                                                 ▼
                                        ┌────────────────┐
                                        │ Vercel Build   │
                                        │                │
                                        │ npm run build  │
                                        │ ├── Sitemap    │
                                        │ ├── RSS        │
                                        │ └── Next.js    │
                                        └───────┬────────┘
                                                │
                                                ▼
                                        ┌────────────────┐
                                        │ Live Site      │
                                        │ linkdinger.xyz │
                                        └────────────────┘
```

### 6.2 Build Scripts

#### `package.json` Build Command

```json
{
  "scripts": {
    "build": "node scripts/generate-sitemap.mjs && node scripts/generate-rss.mjs && next build"
  }
}
```

#### Sitemap Generation (`scripts/generate-sitemap.mjs`)

```javascript
// Generate sitemap.xml at build time
import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

const posts = fs.readdirSync('content/posts')
    .filter(f => f.endsWith('.md'))
    .map(f => {
        const content = fs.readFileSync(`content/posts/${f}`, 'utf8')
        const { data } = matter(content)
        return {
            slug: f.replace('.md', ''),
            date: data.date
        }
    })

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${posts.map(p => `
    <url>
        <loc>https://linkdinger.xyz/blog/${p.slug}</loc>
        <lastmod>${p.date}</lastmod>
    </url>
    `).join('')}
</urlset>`

fs.writeFileSync('public/sitemap.xml', sitemap)
```

### 6.3 GitHub Actions Setup (Recommended)

#### `.github/workflows/deploy.yml`

```yaml
name: Deploy Blog

on:
  push:
    branches: [main]
    paths:
      - 'blog/**'
      - '.github/workflows/**'

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: blog/package-lock.json
          
      - name: Install Dependencies
        working-directory: ./blog
        run: npm ci
        
      - name: Build
        working-directory: ./blog
        run: npm run build
        env:
          NEXT_PUBLIC_UPSTASH_REDIS_REST_URL: ${{ secrets.UPSTASH_URL }}
          NEXT_PUBLIC_UPSTASH_REDIS_REST_TOKEN: ${{ secrets.UPSTASH_TOKEN }}
          NEXT_PUBLIC_SITE_URL: ${{ secrets.SITE_URL }}
          
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: ./blog
```

### 6.4 Vercel Configuration

#### `vercel.json` (Optional)

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "regions": ["sin1"],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        }
      ]
    }
  ]
}
```

### 6.5 Environment Variables in CI/CD

#### GitHub Secrets Setup

```bash
# Go to: Repository → Settings → Secrets and variables → Actions

# Add these secrets:
UPSTASH_URL=https://xxx.upstash.io
UPSTASH_TOKEN=xxx
SITE_URL=https://linkdinger.xyz
VERCEL_TOKEN=xxx
VERCEL_ORG_ID=xxx
VERCEL_PROJECT_ID=xxx
```

---

## 7. Advanced Concepts

### 7.1 Event-Driven Architecture

#### Pattern: Observer with Debounce

```python
# auto_git.py - Event-driven debounce pattern

class AutoGit:
    def __init__(self):
        self._lock = threading.Lock()      # Thread safety
        self._timer = None                  # Debounce timer
        self._last_notify = 0.0            # Track last event
    
    def notify(self):
        """Reset timer on each event"""
        with self._lock:                    # Thread-safe
            if self._timer:
                self._timer.cancel()        # Cancel previous
            
            # Start new timer
            self._timer = threading.Timer(
                self.idle_minutes * 60,     # Delay in seconds
                self._timer_fired           # Callback
            )
            self._timer.daemon = True       # Don't block exit
            self._timer.start()
```

**Why This Pattern?**

- ป้องกันการ commit หลายครั้งติดกัน
- รอให้ user หยุดพิมพ์ก่อน sync
- Thread-safe สำหรับหลาย events

### 7.2 File System Watching (Watchdog)

#### Pattern: Recursive File Watcher

```python
# obsidian_watcher.py

from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

class ImageHandler(FileSystemEventHandler):
    # Event callbacks
    def on_created(self, event):
        if not event.is_directory:
            self._check_and_process(event.src_path)
    
    def on_moved(self, event):
        if not event.is_directory:
            self._check_and_process(event.dest_path)

# Setup observer
observer = Observer()
observer.schedule(
    image_handler,
    config.vault_path,
    recursive=True  # Watch all subdirectories
)
observer.start()
```

**Watchdog Events:**

- `on_created` - ไฟล์ใหม่ถูกสร้าง
- `on_modified` - ไฟล์ถูกแก้ไข
- `on_deleted` - ไฟล์ถูกลบ
- `on_moved` - ไฟล์ถูกย้าย/เปลี่ยนชื่อ

### 7.3 Server Components Deep Dive

#### When to Use Server vs Client Components

```tsx
// ✅ SERVER COMPONENT - Use for:
// - Data fetching
// - File system access
// - Secret keys
// - Heavy computations

import fs from 'fs'

export default async function ServerComponent() {
    const data = fs.readFileSync('data.json') // OK on server
    return <div>{data}</div>
}

// ✅ CLIENT COMPONENT - Use for:
// - Interactive UI
// - Event handlers
// - Browser APIs
// - React hooks

'use client'

import { useState } from 'react'

export default function ClientComponent() {
    const [count, setCount] = useState(0) // OK on client
    return <button onClick={() => setCount(c => c + 1)}>{count}</button>
}
```

#### Composition Pattern

```tsx
// Server Component (parent)
import { getData } from '@/lib/data'
import ClientCounter from './client-counter'

export default async function Page() {
    const data = await getData() // Server-side fetch
    
    return (
        <div>
            <h1>{data.title}</h1>
            {/* Client component nested in server */}
            <ClientCounter initialCount={data.count} />
        </div>
    )
}
```

### 7.4 Static Site Generation (SSG)

#### Pre-rendering Strategy

```tsx
// app/blog/[slug]/page.tsx

// 1. Generate all possible paths at build time
export async function generateStaticParams() {
    const posts = getAllPosts()
    return posts.map(post => ({
        slug: post.slug
    }))
}

// 2. Generate page for each path
export default async function PostPage({ params }) {
    const post = await getPostBySlug(params.slug)
    return <PostContent post={post} />
}

// Result: /blog/post-1.html, /blog/post-2.html, etc.
// All pre-rendered at build time for maximum performance
```

### 7.5 Error Handling Patterns

#### Python Daemon Error Handling

```python
# Graceful error handling in daemon

class ImageHandler(FileSystemEventHandler):
    def process_image(self, filepath: str):
        try:
            # Step 1: Convert
            webp_path = self.processor.convert_to_webp(filepath)
            
            # Step 2: Upload
            url = self.uploader.upload(webp_path)
            
            # Step 3: Update links
            self.md_updater.replace_image_link(filepath, url)
            
            # Step 4: Cleanup (only on success)
            os.remove(filepath)
            os.remove(webp_path)
            
        except Exception as e:
            logger.error(f"Error processing {filepath}: {e}")
            # Don't delete files on error - allow retry
```

#### Next.js Error Boundaries

```tsx
// app/blog/[slug]/error.tsx
'use client'

export default function Error({
    error,
    reset,
}: {
    error: Error
    reset: () => void
}) {
    return (
        <div className="error-container">
            <h2>Something went wrong!</h2>
            <button onClick={reset}>Try again</button>
        </div>
    )
}
```

---

## 8. Troubleshooting

### 8.1 Common Backend Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Image not uploading | R2 credentials | Check `.env` file |
| Link not updating | Wrong vault path | Verify `config.yaml` |
| Git not syncing | SSH keys | Run `ssh-keygen` |
| Double processing | No debounce | Increase `debounce_sec` |

### 8.2 Common Frontend Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Hydration error | Client/Server mismatch | Check `'use client'` placement |
| Views not counting | Upstash credentials | Check `.env.local` |
| Build fails | TypeScript errors | Run `npm run build` locally |
| Images not loading | R2 public URL | Check `R2_PUBLIC_URL` |

### 8.3 Debug Commands

```bash
# Backend
python linkdinger.py --status     # Check config
python linkdinger.py --watch      # Watcher only
python -m pytest tests/ -v        # Run tests

# Frontend
cd blog && npm run build          # Check for errors
cd blog && npm run dev            # Development mode
```

---

## Summary

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     LINKDINGER STACK                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  INPUT LAYER                                                │
│  └── Obsidian (Markdown Editor)                            │
│                                                             │
│  BACKEND LAYER (Python Daemon)                             │
│  ├── File Watcher (watchdog)                               │
│  ├── Image Processor (PIL)                                 │
│  ├── Git Sync (subprocess)                                 │
│  └── CMS Sync (file copy)                                  │
│                                                             │
│  STORAGE LAYER                                              │
│  ├── Cloudflare R2 (Images)                                │
│  ├── Upstash Redis (View counts)                           │
│  └── GitHub (Version control)                              │
│                                                             │
│  FRONTEND LAYER (Next.js 14)                               │
│  ├── Server Components (Static generation)                 │
│  ├── Client Components (Interactivity)                     │
│  └── Tailwind CSS (Dark Glassmorphism)                     │
│                                                             │
│  DEPLOYMENT LAYER                                           │
│  └── Vercel (Edge network)                                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Key Takeaways

1. **Backend = Python Daemon** (ไม่ใช่ Next.js API Routes)
2. **Frontend = Next.js 14 App Router** with Server Components
3. **No traditional database** - ใช้ file system + Upstash Redis
4. **Event-driven architecture** - Debounced git sync
5. **Static generation** - Pre-rendered blog posts for performance

---

*Last updated: March 2026*
