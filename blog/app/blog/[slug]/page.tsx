import { notFound } from 'next/navigation'
import { getPostBySlug, getPostSlugs, getRelatedPosts, extractHeadings } from '@/lib/posts'
import { markdownToHtml } from '@/lib/markdown'
import PostDetail from './post-detail'

export function generateStaticParams() {
  return getPostSlugs().map(slug => ({
    slug: encodeURIComponent(slug.replace(/\.md$/, '')),
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

export default async function PostPage({ params }: { params: { slug: string } }) {
  const post = getPostBySlug(params.slug)
  if (!post) notFound()

  const related = getRelatedPosts(params.slug, 3)
  const headings = extractHeadings(post.content)
  const html = await markdownToHtml(post.content)

  return (
    <PostDetail
      post={post}
      html={html}
      headings={headings}
      related={related}
    />
  )
}
