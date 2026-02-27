import { Suspense } from 'react'
import { getAllPosts, getAllTags } from '@/lib/posts'
import BlogClient from './blog-client'

export const metadata = {
  title: 'Blog',
  description: 'Thoughts, tutorials, and explorations',
}

export default function BlogPage() {
  const posts = getAllPosts()
  const tags = getAllTags()

  return (
    <section className="py-12 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-display font-bold mb-2">Blog</h1>
          <p className="text-gray-400">
            {posts.length} {posts.length === 1 ? 'post' : 'posts'} · Thoughts, tutorials, and explorations
          </p>
        </div>

        <Suspense fallback={<div className="skeleton h-64 w-full" />}>
          <BlogClient posts={posts} tags={tags} />
        </Suspense>
      </div>
    </section>
  )
}
