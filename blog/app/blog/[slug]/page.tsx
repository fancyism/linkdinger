import { notFound } from 'next/navigation'
import { getPostBySlug, getPostSlugs, getRelatedPosts, extractHeadings } from '@/lib/posts'
import PostDetail from './post-detail'

export function generateStaticParams() {
  return getPostSlugs().map(slug => ({
    slug: slug.replace(/\.md$/, ''),
  }))
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const post = getPostBySlug(params.slug)
  if (!post) return { title: 'Post Not Found' }

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      images: post.coverImage ? [{ url: post.coverImage }] : [],
    },
  }
}

export default function PostPage({ params }: { params: { slug: string } }) {
  const post = getPostBySlug(params.slug)
  if (!post) notFound()

  const related = getRelatedPosts(params.slug, 3)
  const headings = extractHeadings(post.content)

  // Convert markdown to HTML (simple approach)
  let html = post.content
    // Headers with IDs for TOC
    .replace(/^### (.+)$/gm, (_, text) => {
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      return `<h3 id="${id}">${text}</h3>`
    })
    .replace(/^## (.+)$/gm, (_, text) => {
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      return `<h2 id="${id}">${text}</h2>`
    })
    // Bold, italic, code
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    // Images
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" loading="lazy" />')
    // Code blocks
    .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>')
    // Blockquotes
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
    // Tables
    .replace(/\|(.+)\|\n\|[-| ]+\|\n((?:\|.+\|\n?)*)/g, (_, header, rows) => {
      const ths = header.split('|').filter(Boolean).map((h: string) => `<th>${h.trim()}</th>`).join('')
      const trs = rows.trim().split('\n').map((row: string) => {
        const tds = row.split('|').filter(Boolean).map((d: string) => `<td>${d.trim()}</td>`).join('')
        return `<tr>${tds}</tr>`
      }).join('')
      return `<table><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table>`
    })
    // Horizontal rules
    .replace(/^---$/gm, '<hr />')
    // Lists
    .replace(/^(\d+)\. (.+)$/gm, '<li>$2</li>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    // Paragraphs (lines not already wrapped)
    .split('\n\n')
    .map(block => {
      const trimmed = block.trim()
      if (!trimmed) return ''
      if (trimmed.startsWith('<')) return trimmed
      return `<p>${trimmed.replace(/\n/g, '<br />')}</p>`
    })
    .join('\n')

  return (
    <PostDetail
      post={post}
      html={html}
      headings={headings}
      related={related}
    />
  )
}
