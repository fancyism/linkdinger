import { Suspense } from 'react'
import { getAllPosts, getAllCategories, getAllTags } from '@/lib/posts'
import BlogClient from './blog-client'
import TagCloud from '@/components/tag-cloud'

export const metadata = {
  title: 'Blog',
  description: 'Thoughts, tutorials, and explorations',
}

export default function BlogPage() {
  const posts = getAllPosts()
  const categories = getAllCategories()
  const allTags = getAllTags()

  // Compute tag counts
  const tagCounts = allTags.map(tag => ({
    name: tag,
    count: posts.filter(p => p.tags?.includes(tag)).length,
  }))

  return (
    <section className="py-12 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-display font-bold mb-2">Blog</h1>
          <p className="text-gray-400">
            {posts.length} {posts.length === 1 ? 'post' : 'posts'} · Thoughts, tutorials, and explorations
          </p>
        </div>

        <TagCloud tags={tagCounts} />

        <Suspense fallback={<div className="skeleton h-64 w-full" />}>
          <BlogClient posts={posts} categories={categories} />
        </Suspense>
      </div>
    </section>
  )
}
