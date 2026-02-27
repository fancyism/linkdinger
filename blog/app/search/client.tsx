'use client'

import { useState, useMemo } from 'react'
import PostCard from '@/components/post-card'
import { Search } from 'lucide-react'

interface SearchClientProps {
  posts: Array<{
    slug: string
    title: string
    date: string
    excerpt: string
    content: string
    tags?: string[]
    readTime?: string
    coverImage?: string
  }>
}

export default function SearchClient({ posts }: SearchClientProps) {
  const [query, setQuery] = useState('')

  const results = useMemo(() => {
    if (!query.trim()) return []
    const q = query.toLowerCase()
    return posts.filter(
      p =>
        p.title.toLowerCase().includes(q) ||
        p.excerpt.toLowerCase().includes(q) ||
        p.content.toLowerCase().includes(q) ||
        p.tags?.some(t => t.toLowerCase().includes(q))
    )
  }, [query, posts])

  return (
    <>
      {/* Search Input */}
      <div className="relative mb-10">
        <Search
          size={20}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search posts by title, content, or tag..."
          className="glass-input pl-12 text-lg"
          autoFocus
          aria-label="Search posts"
        />
      </div>

      {/* Results */}
      {query.trim() ? (
        results.length > 0 ? (
          <>
            <p className="text-sm text-gray-500 mb-6">
              {results.length} {results.length === 1 ? 'result' : 'results'} for &ldquo;{query}&rdquo;
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.map((post) => (
                <PostCard
                  key={post.slug}
                  slug={post.slug}
                  title={post.title}
                  date={post.date}
                  excerpt={post.excerpt}
                  tags={post.tags}
                  readTime={post.readTime}
                  coverImage={post.coverImage}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="glass-card p-12 text-center">
            <p className="text-2xl mb-2">🔍</p>
            <p className="text-gray-400">
              No results for &ldquo;{query}&rdquo;
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Try different keywords or check the spelling
            </p>
          </div>
        )
      ) : (
        <div className="glass-card p-12 text-center">
          <p className="text-2xl mb-2">✨</p>
          <p className="text-gray-400">
            Start typing to search through all posts
          </p>
        </div>
      )}
    </>
  )
}
