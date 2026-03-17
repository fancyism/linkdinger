---
title: Mastering Next.js Server Components
date: 2024-03-05
category: Tech
excerpt: A deep dive into how React Server Components change the way we architect web applications for maximum performance.
tags:
  - NextJS
  - React
  - web-dev
coverImage: https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=1200&h=630&fit=crop
publish: true
---

# The Shift to the Server

React Server Components (RSC) represent the biggest paradigm shift in the React ecosystem since Hooks. By allowing components to render exclusively on the server, we drastically reduce the amount of JavaScript sent to the client.

## Breaking Down the Paradigm

In the past, we had to choose between Static Site Generation (SSG), Server-Side Rendering (SSR), or Client-Side Rendering (CSR). RSCs blur these lines.

1. **Server Components (Default)**: Fetch data directly from the database, access the filesystem, and contain zero client-side JavaScript.
2. **Client Components (`'use client'`)**: Handle interactivity, state (`useState`), and browser APIs.

## The Linkdinger Architecture

When building a blog like Linkdinger, the vast majority of our UI is static.

- The **BlogDetail** page parsing markdown? Server Component.
- The **PostCard** displaying data? Server Component.
- The **ThemeSwitcher** button? Client Component.

By keeping the heavy lifting (like parsing markdown and generating RSS feeds) strictly on the server, we ensure lightning-fast page loads and zero bundle size bloat.

## Practical Example

```tsx
// This is a Server Component - no 'use client' directive
async function BlogPost({ slug }: { slug: string }) {
  const post = await getPost(slug); // Direct DB/filesystem access
  
  return (
    <article>
      <h1>{post.title}</h1>
      <Markdown content={post.content} />
    </article>
  );
}
```

Zero JavaScript shipped to the client for this entire component.

## When to Use Client Components

Only add `'use client'` when you need:
- Event handlers (onClick, onChange)
- State management (useState, useReducer)
- Browser APIs (localStorage, window)
- Custom hooks that use the above
