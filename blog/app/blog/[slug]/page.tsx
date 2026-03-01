import { notFound } from 'next/navigation'
import { getPostBySlug, getPostSlugs, getRelatedPosts, extractHeadings } from '@/lib/posts'
import { markdownToHtml } from '@/lib/markdown'
import PostDetail from './post-detail'
import type { Metadata } from 'next'

export function generateStaticParams() {
  return getPostSlugs().map(slug => ({
    slug: encodeURIComponent(slug.replace(/\.md$/, '')),
  }))
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const post = getPostBySlug(params.slug)
  if (!post) return { title: 'Post Not Found' }

  return {
    title: post.title,
    description: post.excerpt,
    alternates: {
      canonical: `/blog/${params.slug}/`,
    },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      publishedTime: post.date,
      authors: ['Affan'],
      tags: post.tags,
      images: post.coverImage ? [{ url: post.coverImage }] : [],
    },
  }
}

export default async function PostPage({ params }: { params: { slug: string } }) {
  const post = getPostBySlug(params.slug)
  if (!post) notFound()

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const related = getRelatedPosts(params.slug, 3)
  const headings = extractHeadings(post.content)
  const html = await markdownToHtml(post.content)

  // JSON-LD Article Structured Data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    author: {
      '@type': 'Person',
      name: 'Affan',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Linkdinger',
    },
    url: `${siteUrl}/blog/${params.slug}/`,
    ...(post.coverImage && { image: post.coverImage }),
    ...(post.tags && post.tags.length > 0 && { keywords: post.tags.join(', ') }),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PostDetail
        post={post}
        html={html}
        headings={headings}
        related={related}
      />
    </>
  )
}
