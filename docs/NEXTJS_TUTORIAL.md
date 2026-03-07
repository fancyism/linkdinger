# Next.js 14 Frontend Tutorial

> คู่มือเรียนรู้ Next.js 14 App Router ตั้งแต่พื้นฐานจนถึงขั้นสูง
> ผ่านโปรเจกต์ Linkdinger Blog

---

## 📚 สารบัญ

1. [Next.js คืออะไร?](#1-nextjs-คืออะไร)
2. [App Router พื้นฐาน](#2-app-router-พื้นฐาน)
3. [Server Components](#3-server-components)
4. [Client Components](#4-client-components)
5. [Data Fetching](#5-data-fetching)
6. [Routing ขั้นสูง](#6-routing-ขั้นสูง)
7. [Styling with Tailwind](#7-styling-with-tailwind)
8. [Performance Optimization](#8-performance-optimization)

---

## 1. Next.js คืออะไร?

### 1.1 Next.js คือ Full-Stack React Framework

```
┌─────────────────────────────────────────────────────────────┐
│                        NEXT.js 14                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  FEATURES                                                   │
│  ├── Server-Side Rendering (SSR)                           │
│  ├── Static Site Generation (SSG)                          │
│  ├── Incremental Static Regeneration (ISR)                 │
│  ├── Server Components (RSC)                               │
│  ├── API Routes                                            │
│  ├── Image Optimization                                    │
│  ├── File-based Routing                                    │
│  └── TypeScript Support                                    │
│                                                             │
│  WHY NEXT.JS?                                               │
│  ├── Better SEO (pre-rendered pages)                       │
│  ├── Faster initial load                                   │
│  ├── Less JavaScript sent to client                        │
│  └── Great Developer Experience                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 App Router vs Pages Router

```
PAGES ROUTER (เก่า - Next.js 12 และก่อนหน้า)
├── pages/
│   ├── index.js          → /
│   ├── about.js          → /about
│   ├── blog/
│   │   └── [slug].js     → /blog/:slug
│   └── api/
│       └── hello.js      → /api/hello

APP ROUTER (ใหม่ - Next.js 13+)
├── app/
│   ├── layout.tsx        → Root layout
│   ├── page.tsx          → /
│   ├── about/
│   │   └── page.tsx      → /about
│   ├── blog/
│   │   ├── page.tsx      → /blog
│   │   └── [slug]/
│   │       └── page.tsx  → /blog/:slug
│   └── api/
│       └── hello/
│           └── route.ts  → /api/hello
```

---

## 2. App Router พื้นฐาน

### 2.1 File Conventions

```typescript
// app/
// ├── layout.tsx    → Layout (wrapper สำหรับหน้าลูก)
// ├── page.tsx      → Page (หน้าจริง)
// ├── loading.tsx   → Loading UI (แสดงตอนโหลด)
// ├── error.tsx     → Error UI (แสดงตอน error)
// ├── not-found.tsx → 404 Page
// └── route.ts      → API Route

// layout.tsx - โครงสร้างหลัก
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  )
}

// page.tsx - หน้าแรก
export default function HomePage() {
  return <h1>Welcome to Linkdinger</h1>
}

// loading.tsx - Loading state
export default function Loading() {
  return <div>Loading...</div>
}

// error.tsx - Error boundary
'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error
  reset: () => void
}) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={reset}>Try again</button>
    </div>
  )
}
```

### 2.2 Nested Layouts

```typescript
// app/layout.tsx - Root Layout
export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <Navbar />
        {children}
      </body>
    </html>
  )
}

// app/blog/layout.tsx - Blog Layout
export default function BlogLayout({ children }) {
  return (
    <div className="blog-container">
      <Sidebar />
      <main>{children}</main>
    </div>
  )
}

// Result:
// /blog → RootLayout → BlogLayout → BlogPage
// /blog/my-post → RootLayout → BlogLayout → PostPage
```

### 2.3 Link Navigation

```tsx
import Link from 'next/link'

export default function Navbar() {
  return (
    <nav>
      {/* Internal link */}
      <Link href="/">Home</Link>
      <Link href="/blog">Blog</Link>
      <Link href="/about">About</Link>
      
      {/* Dynamic link */}
      <Link href={`/blog/${post.slug}`}>Read post</Link>
      
      {/* External link */}
      <a href="https://github.com" target="_blank" rel="noopener">
        GitHub
      </a>
    </nav>
  )
}
```

---

## 3. Server Components

### 3.1 Server Components คืออะไร?

```
┌─────────────────────────────────────────────────────────────┐
│                    SERVER COMPONENTS                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ทำงานบน SERVER เท่านั้น                                    │
│  ├── ไม่มี JavaScript ส่งไป client                         │
│  ├── สามารถอ่านไฟล์, database โดยตรง                      │
│  ├── สามารถใช้ secrets/api keys                            │
│  └── Default ใน App Router                                 │
│                                                             │
│  USE FOR:                                                   │
│  ├── Fetch data                                             │
│  ├── Access backend resources                               │
│  ├── Use sensitive keys                                     │
│  └── Large dependencies (ไม่กระทบ bundle size)             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Data Fetching in Server Components

```tsx
// app/blog/page.tsx - Server Component (default)

// ✅ Async component - รอข้อมูลได้
export default async function BlogPage() {
  // Fetch data (runs on server)
  const posts = await getPosts()
  
  return (
    <div>
      <h1>Blog</h1>
      {posts.map(post => (
        <article key={post.slug}>
          <h2>{post.title}</h2>
          <p>{post.excerpt}</p>
        </article>
      ))}
    </div>
  )
}

// lib/posts.ts - Data fetching function
import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

export async function getPosts() {
  // ✅ Direct file system access (server-side only)
  const postsDir = path.join(process.cwd(), 'content/posts')
  const files = fs.readdirSync(postsDir)
  
  return files.map(file => {
    const content = fs.readFileSync(path.join(postsDir, file), 'utf8')
    const { data } = matter(content)
    
    return {
      slug: file.replace('.md', ''),
      title: data.title,
      excerpt: data.excerpt,
      date: data.date
    }
  })
}
```

### 3.3 Caching Strategies

```tsx
// Static Data (default) - cached indefinitely
const posts = await fetch('https://api.example.com/posts')

// Revalidate every hour
const posts = await fetch('https://api.example.com/posts', {
  next: { revalidate: 3600 }  // seconds
})

// No cache (always fresh)
const posts = await fetch('https://api.example.com/posts', {
  cache: 'no-store'
})

// Segment-level caching
export const revalidate = 3600  // Revalidate this page every hour

export default async function Page() {
  const data = await fetch('https://api.example.com/data')
  return <div>{data}</div>
}
```

### 3.4 Parallel Data Fetching

```tsx
// ❌ Sequential (slow)
async function Page() {
  const posts = await getPosts()      // Wait...
  const tags = await getTags()        // Wait...
  const popular = await getPopular()  // Wait...
  
  return <div>...</div>
}

// ✅ Parallel (fast)
async function Page() {
  // All requests start at the same time
  const [posts, tags, popular] = await Promise.all([
    getPosts(),
    getTags(),
    getPopular()
  ])
  
  return <div>...</div>
}

// ✅ With loading.tsx for streaming
// app/blog/loading.tsx
export default function Loading() {
  return <PostsSkeleton />
}

// app/blog/page.tsx
async function BlogPage() {
  const posts = await getPosts()
  return <PostsList posts={posts} />
}

// Result: Shows loading.tsx immediately, streams in real content
```

---

## 4. Client Components

### 4.1 เมื่อไหร่ต้องใช้ Client Components?

```
USE 'use client' WHEN:
├── Using React hooks (useState, useEffect, useRef, etc.)
├── Event handlers (onClick, onChange, etc.)
├── Browser APIs (localStorage, window, etc.)
├── Third-party libraries that use client-side features
└── Animations that need JavaScript
```

### 4.2 Creating Client Components

```tsx
// components/view-counter.tsx
'use client'  // ← Required!

import { useEffect, useState } from 'react'

export default function ViewCounter({ slug }: { slug: string }) {
  const [views, setViews] = useState(0)
  
  useEffect(() => {
    // Fetch view count from API
    fetch(`/api/views/${slug}`)
      .then(res => res.json())
      .then(data => setViews(data.views))
  }, [slug])
  
  return <span>{views} views</span>
}
```

### 4.3 Server + Client Composition

```tsx
// app/blog/[slug]/page.tsx - Server Component
import { getPostBySlug } from '@/lib/posts'
import ViewCounter from '@/components/view-counter'
import ShareButtons from '@/components/share-buttons'

export default async function PostPage({ params }) {
  // ✅ Server-side data fetching
  const post = await getPostBySlug(params.slug)
  
  return (
    <article>
      {/* Server-rendered content */}
      <h1>{post.title}</h1>
      <p>{post.date}</p>
      <div dangerouslySetInnerHTML={{ __html: post.content }} />
      
      {/* Client components for interactivity */}
      <ViewCounter slug={post.slug} />
      <ShareButtons url={`https://linkdinger.xyz/blog/${post.slug}`} />
    </article>
  )
}
```

### 4.4 Common Client Component Patterns

```tsx
// Pattern 1: Interactive Button
'use client'

export function LikeButton({ postId }: { postId: string }) {
  const [liked, setLiked] = useState(false)
  const [count, setCount] = useState(0)
  
  const handleLike = async () => {
    await fetch(`/api/like/${postId}`, { method: 'POST' })
    setLiked(true)
    setCount(c => c + 1)
  }
  
  return (
    <button onClick={handleLike} disabled={liked}>
      {liked ? '❤️' : '🤍'} {count}
    </button>
  )
}

// Pattern 2: Form with State
'use client'

export function NewsletterForm() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    
    try {
      await fetch('/api/newsletter', {
        method: 'POST',
        body: JSON.stringify({ email })
      })
      setStatus('success')
    } catch {
      setStatus('error')
    }
  }
  
  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="Enter your email"
      />
      <button type="submit" disabled={status === 'loading'}>
        {status === 'loading' ? 'Subscribing...' : 'Subscribe'}
      </button>
    </form>
  )
}

// Pattern 3: Local Storage
'use client'

export function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')
  
  useEffect(() => {
    // Read from localStorage (client-side only)
    const saved = localStorage.getItem('theme') as 'light' | 'dark'
    if (saved) setTheme(saved)
  }, [])
  
  const toggle = () => {
    const next = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    localStorage.setItem('theme', next)
  }
  
  return (
    <button onClick={toggle}>
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  )
}
```

---

## 5. Data Fetching

### 5.1 Static Generation (Build Time)

```tsx
// app/blog/[slug]/page.tsx

// Generate all possible paths at build time
export async function generateStaticParams() {
  const posts = await getAllPosts()
  
  return posts.map(post => ({
    slug: post.slug
  }))
}

// Generate page for each slug
export default async function PostPage({ 
  params 
}: { 
  params: { slug: string } 
}) {
  const post = await getPostBySlug(params.slug)
  
  return <PostContent post={post} />
}

// Result:
// At build time, generates:
// - /blog/post-1.html
// - /blog/post-2.html
// - /blog/post-3.html
// etc.
```

### 5.2 Dynamic Rendering

```tsx
// Force dynamic rendering
export const dynamic = 'force-dynamic'

// Or use no-store fetch
export default async function Page() {
  const data = await fetch('https://api.example.com/data', {
    cache: 'no-store'
  })
  
  return <div>{data}</div>
}
```

### 5.3 Incremental Static Regeneration (ISR)

```tsx
// Revalidate every 60 seconds
export const revalidate = 60

export default async function Page() {
  const data = await fetch('https://api.example.com/data')
  
  return <div>{data}</div>
}

// How it works:
// 1. First request → Serve cached page
// 2. After 60 seconds → Next request triggers regeneration
// 3. Regeneration complete → Serve new page
```

### 5.4 External API Integration (Upstash Redis)

```tsx
// lib/views.ts
export async function getPopularPosts(posts: Post[], limit = 4) {
  const url = process.env.NEXT_PUBLIC_UPSTASH_REDIS_REST_URL
  const token = process.env.NEXT_PUBLIC_UPSTASH_REDIS_REST_TOKEN
  
  if (!url || !token) {
    return posts.slice(0, limit)  // Fallback
  }
  
  // Fetch view counts for all posts
  const keys = posts.map(p => `page_views:${p.slug}`)
  const res = await fetch(`${url}/mget/${keys.join('/')}`, {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 3600 }  // Cache for 1 hour
  })
  
  if (res.ok) {
    const data = await res.json()
    const counts = data.result
    
    // Add view counts to posts
    const postsWithViews = posts.map((post, i) => ({
      ...post,
      views: counts[i] ? parseInt(counts[i], 10) : 0
    }))
    
    // Sort by views
    return postsWithViews
      .sort((a, b) => b.views - a.views)
      .slice(0, limit)
  }
  
  return posts.slice(0, limit)
}
```

---

## 6. Routing ขั้นสูง

### 6.1 Dynamic Routes

```tsx
// app/blog/[slug]/page.tsx
// Matches: /blog/anything, /blog/my-post, etc.

export default async function PostPage({ params }) {
  const post = await getPostBySlug(params.slug)
  return <Post post={post} />
}

// app/blog/[...slug]/page.tsx (Catch-all)
// Matches: /blog/a, /blog/a/b, /blog/a/b/c, etc.

export default async function CatchAllPage({ params }) {
  // params.slug = ['a', 'b', 'c']
  return <div>Path: {params.slug.join('/')}</div>
}
```

### 6.2 Route Groups

```tsx
// app/(marketing)/layout.tsx
// app/(marketing)/page.tsx          → /
// app/(marketing)/about/page.tsx    → /about

// app/(blog)/layout.tsx
// app/(blog)/blog/page.tsx          → /blog
// app/(blog)/blog/[slug]/page.tsx   → /blog/:slug

// (parentheses) folders don't create URL segments
// They're just for organization
```

### 6.3 Route Handlers (API Routes)

```tsx
// app/api/views/[slug]/route.ts

import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const views = await getViewCount(params.slug)
  
  return NextResponse.json({ views })
}

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const views = await incrementViewCount(params.slug)
  
  return NextResponse.json({ views })
}

// Usage:
// GET /api/views/my-post → { views: 42 }
// POST /api/views/my-post → { views: 43 }
```

### 6.4 Middleware

```tsx
// middleware.ts (root directory)

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Log all requests
  console.log(`Request: ${request.nextUrl.pathname}`)
  
  // Add custom header
  const response = NextResponse.next()
  response.headers.set('x-custom-header', 'value')
  
  // Redirect if needed
  if (request.nextUrl.pathname.startsWith('/old-blog')) {
    return NextResponse.redirect(new URL('/blog', request.url))
  }
  
  return response
}

// Configure which routes use this middleware
export const config = {
  matcher: [
    '/blog/:path*',
    '/api/:path*'
  ]
}
```

---

## 7. Styling with Tailwind

### 7.1 Tailwind Basics

```tsx
// Basic utility classes
<div className="flex items-center justify-between p-4 bg-gray-900 text-white">
  <h1 className="text-2xl font-bold">Title</h1>
  <button className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded">
    Click me
  </button>
</div>

// Responsive design
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* 1 column on mobile, 2 on tablet, 3 on desktop */}
</div>

// States
<button className="bg-blue-500 hover:bg-blue-600 focus:ring-2 focus:ring-blue-300 active:bg-blue-700 disabled:opacity-50">
  Button
</button>
```

### 7.2 Dark Glassmorphism (Linkdinger Style)

```tsx
// Glass card component
export function GlassCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="
      bg-white/[0.03]           /* Very subtle white background */
      backdrop-blur-[20px]      /* Blur effect */
      border                    /* 1px border */
      border-white/[0.08]       /* Subtle white border */
      rounded-2xl               /* Rounded corners */
      shadow-[0_20px_40px_rgba(0,0,0,0.3)]  /* Drop shadow */
    ">
      {children}
    </div>
  )
}

// Glass button
export function GlassButton({ children }: { children: React.ReactNode }) {
  return (
    <button className="
      px-4 py-2
      bg-[#FF6B35]/10           /* Peach tint */
      backdrop-blur-[10px]      /* Blur */
      border border-[#FF6B35]/30 /* Peach border */
      rounded-lg
      text-[#FF6B35]            /* Peach text */
      hover:bg-[#FF6B35]/20
      hover:border-[#FF6B35]/50
      transition-all duration-200
    ">
      {children}
    </button>
  )
}

// Ambient background (required for glass to be visible)
export function AmbientBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Purple orb */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[100px]" />
      {/* Blue orb */}
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[100px]" />
    </div>
  )
}
```

### 7.3 Custom Tailwind Config

```javascript
// tailwind.config.js

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        peach: {
          DEFAULT: '#FF6B35',
          light: '#FF8C5A',
          dark: '#E55A2B',
        },
        surface: {
          DEFAULT: '#1A1A1A',
          elevated: '#2D2D2D',
        }
      },
      fontFamily: {
        display: ['Outfit', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}
```

---

## 8. Performance Optimization

### 8.1 Image Optimization

```tsx
import Image from 'next/image'

// ✅ Optimized image
<Image
  src="/profile.png"
  alt="Profile"
  width={200}
  height={200}
  priority  // Load immediately (for above-fold images)
/>

// External images
<Image
  src="https://r2.dev/image.webp"
  alt="Cover"
  fill
  className="object-cover"
/>

// next.config.js - Allow external domains
module.exports = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pub-*.r2.dev',
      },
    ],
  },
}
```

### 8.2 Font Optimization

```tsx
// app/layout.tsx
import { Inter, Outfit, JetBrains_Mono } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

const outfit = Outfit({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-outfit',
})

export default function RootLayout({ children }) {
  return (
    <html className={`${inter.variable} ${outfit.variable}`}>
      <body className="font-body">
        {children}
      </body>
    </html>
  )
}
```

### 8.3 Code Splitting

```tsx
// Dynamic import for heavy components
import dynamic from 'next/dynamic'

// Load only when needed
const HeavyChart = dynamic(() => import('@/components/chart'), {
  loading: () => <ChartSkeleton />,
  ssr: false  // Don't render on server
})

export default function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>
      <HeavyChart data={chartData} />
    </div>
  )
}
```

### 8.4 Metadata & SEO

```tsx
// app/blog/[slug]/page.tsx
import { Metadata } from 'next'

export async function generateMetadata({ params }): Promise<Metadata> {
  const post = await getPostBySlug(params.slug)
  
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      publishedTime: post.date,
      authors: ['Your Name'],
      images: [post.coverImage],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
      images: [post.coverImage],
    },
  }
}
```

### 8.5 Bundle Analysis

```bash
# Install bundle analyzer
npm install @next/bundle-analyzer

# next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

module.exports = withBundleAnalyzer({
  // your config
})

# Run analysis
ANALYZE=true npm run build
```

---

## Quick Reference

### File Structure

```
app/
├── layout.tsx          # Root layout
├── page.tsx            # Home page (/)
├── loading.tsx         # Loading UI
├── error.tsx           # Error UI
├── not-found.tsx       # 404 page
├── globals.css         # Global styles
├── blog/
│   ├── layout.tsx      # Blog layout
│   ├── page.tsx        # Blog listing (/blog)
│   └── [slug]/
│       └── page.tsx    # Blog post (/blog/:slug)
└── api/
    └── views/[slug]/
        └── route.ts    # API route (/api/views/:slug)
```

### Common Patterns

```tsx
// Server Component (default)
export default async function Page() {
  const data = await fetchData()
  return <div>{data}</div>
}

// Client Component
'use client'
export default function Interactive() {
  const [state, setState] = useState(0)
  return <button onClick={() => setState(s => s + 1)}>{state}</button>
}

// Static Generation
export async function generateStaticParams() {
  return [{ slug: 'post-1' }, { slug: 'post-2' }]
}

// ISR
export const revalidate = 60

// Metadata
export const metadata: Metadata = {
  title: 'My Page',
}
```

---

*Last updated: March 2026*
