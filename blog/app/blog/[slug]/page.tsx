import { notFound } from 'next/navigation'
import { getPostBySlug, getPostSlugs, getRelatedPosts, getAdjacentPosts, extractHeadings } from '@/lib/posts'
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
      modifiedTime: post.dateModified || post.date,
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
  const adjacent = getAdjacentPosts(params.slug)
  const headings = extractHeadings(post.content)
  const html = await markdownToHtml(post.content)

  // JSON-LD: Article (enhanced with dateModified, author URL, speakable)
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    dateModified: post.dateModified || post.date,
    author: {
      '@type': 'Person',
      name: 'Affan',
      url: `${siteUrl}/about/`,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Linkdinger',
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/icon.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${siteUrl}/blog/${params.slug}/`,
    },
    url: `${siteUrl}/blog/${params.slug}/`,
    inLanguage: 'en',
    ...(post.coverImage && { image: post.coverImage }),
    ...(post.tags && post.tags.length > 0 && { keywords: post.tags.join(', ') }),
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: ['article h1', 'article > p:first-of-type'],
    },
  }

  // JSON-LD: BreadcrumbList
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: siteUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Blog',
        item: `${siteUrl}/blog/`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: post.title,
        item: `${siteUrl}/blog/${params.slug}/`,
      },
    ],
  }

  // JSON-LD: FAQPage (if post has FAQ frontmatter)
  const faqSchema = post.faq && post.faq.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: post.faq.map(item => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  } : null

  // JSON-LD: HowTo (if post has howTo frontmatter)
  const howToSchema = post.howTo && post.howTo.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: post.title,
    description: post.excerpt,
    step: post.howTo.map((step, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      name: step.name,
      text: step.text,
    })),
  } : null

  const schemas = [articleSchema, breadcrumbSchema, faqSchema, howToSchema].filter(Boolean)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas) }}
      />
      <PostDetail
        post={post}
        html={html}
        headings={headings}
        related={related}
        adjacent={adjacent}
      />
    </>
  )
}

