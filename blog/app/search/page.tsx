import { getAllPosts } from '@/lib/posts'
import SearchClient from './client'

export const metadata = {
  title: 'Search',
  description: 'Search through all blog posts',
  robots: { index: false, follow: false },
  alternates: {
    canonical: '/search/',
  },
}

export default function SearchPage() {
  const posts = getAllPosts()

  return (
    <section className="py-12 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-display font-bold mb-2">Search</h1>
        <p className="text-gray-400 mb-8">
          Find posts by title, content, or tag
        </p>
        <SearchClient posts={posts} />
      </div>
    </section>
  )
}
