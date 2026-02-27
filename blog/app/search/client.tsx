'use client'

import { useState, useMemo } from 'react'
import { Search as SearchIcon } from 'lucide-react'
import PostCard from '@/components/post-card'
import { Post } from '@/lib/posts'

interface SearchClientProps {
  posts: Post[]
}

export default function SearchClient({ posts }: SearchClientProps) {
  const [query, setQuery] = useState('')

  const results = useMemo(() => {
    if (!query.trim()) return []
    const lowerQuery = query.toLowerCase()
    return posts.filter(post => 
      post.title.toLowerCase().includes(lowerQuery) ||
      post.excerpt.toLowerCase().includes(lowerQuery) ||
      post.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
    )
  }, [query, posts])

  return (
    <section className="py-12 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-display font-bold mb-4">Search</h1>
        <p className="text-gray-400 mb-8">
          Find posts by title, content, or tags
        </p>

        <div className="relative mb-12">
          <SearchIcon 
            size={20} 
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search posts..."
            className="w-full glass-card py-4 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-peach/30"
          />
        </div>

        {query && (
          <div>
            <p className="text-gray-400 mb-6">
              {results.length} result{results.length !== 1 ? 's' : ''} for "{query}"
            </p>

            {results.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            ) : (
              <div className="glass-card p-12 text-center">
                <p className="text-gray-400">No results found.</p>
              </div>
            )}
          </div>
        )}

        {!query && (
          <div className="glass-card p-12 text-center">
            <p className="text-gray-400">Start typing to search...</p>
          </div>
        )}
      </div>
    </section>
  )
}
