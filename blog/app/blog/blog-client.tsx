'use client'

import { useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import PostCard from '@/components/post-card'
import BrutalTag from '@/components/ui/brutal-tag'

interface BlogClientProps {
    posts: Array<{
        slug: string
        title: string
        date: string
        excerpt: string
        category?: string
        tags?: string[]
        readTime?: string
        coverImage?: string
    }>
    categories: string[]
}

export default function BlogClient({ posts, categories }: BlogClientProps) {
    const searchParams = useSearchParams()
    const activeCategory = searchParams.get('category')

    const [viewCounts, setViewCounts] = useState<Record<string, number>>({})
    const [sortBy, setSortBy] = useState<'date' | 'views'>('date')
    const [searchQuery, setSearchQuery] = useState('')

    useEffect(() => {
        const fetchAllViews = async () => {
            const url = process.env.NEXT_PUBLIC_UPSTASH_REDIS_REST_URL
            const token = process.env.NEXT_PUBLIC_UPSTASH_REDIS_REST_TOKEN
            if (!url || !token || posts.length === 0) return

            try {
                const keys = posts.map(p => `page_views:${p.slug}`)
                const res = await fetch(`${url}/mget/${keys.join('/')}`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
                if (res.ok) {
                    const data = await res.json()
                    const counts = data.result
                    const map: Record<string, number> = {}
                    posts.forEach((p, i) => {
                        map[p.slug] = counts[i] ? parseInt(counts[i], 10) : 0
                    })
                    setViewCounts(map)
                }
            } catch (e) {
                console.error('Failed to fetch all view counts', e)
            }
        }
        fetchAllViews()
    }, [posts])

    const filteredByCategory = activeCategory
        ? posts.filter(p => p.category === activeCategory)
        : posts

    const filtered = searchQuery
        ? filteredByCategory.filter(p =>
            p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (p.tags && p.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())))
        )
        : filteredByCategory

    // Determine top 3 popular posts for badges
    const popularSlugs = [...posts]
        .sort((a, b) => (viewCounts[b.slug] || 0) - (viewCounts[a.slug] || 0))
        .slice(0, 3)
        .map(p => p.slug)

    const sorted = [...filtered].sort((a, b) => {
        if (sortBy === 'views') {
            const viewsA = viewCounts[a.slug] || 0
            const viewsB = viewCounts[b.slug] || 0
            return viewsB - viewsA
        }
        return new Date(b.date).getTime() - new Date(a.date).getTime()
    })

    const getAspectForBlog = (index: number) => {
        // Create an organic, highly asymmetric pattern with occasional symmetric breaks
        const pattern = [
            'portrait', 'square', 'landscape', // Asymmetric row
            'landscape', 'portrait', 'square', // Asymmetric row reversed
            'wide', 'wide', 'wide',            // Symmetric pause
            'square', 'portrait', 'wide',      // Chaotic mixed row
            'portrait', 'wide', 'square',      // Chaotic mixed row
            'square', 'square', 'landscape'    // Asymmetric final
        ]
        return pattern[index % pattern.length] as 'portrait' | 'square' | 'wide' | 'landscape'
    }

    return (
        <>
            {/* Category Filter and Sorting */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 border-b border-black/5 dark:border-white/5 pb-4">
                {categories.length > 0 ? (
                    <div className="flex items-center gap-3 overflow-x-auto pb-2 md:pb-0">
                        <a
                            href="/blog"
                            className={!activeCategory ? 'opacity-100' : 'opacity-80 hover:opacity-100'}
                        >
                            <BrutalTag className={!activeCategory ? "bg-peach text-black border-peach" : ""}>
                                All ({posts.length})
                            </BrutalTag>
                        </a>
                        {categories.map((cat) => {
                            const count = posts.filter(p => p.category === cat).length
                            return (
                                <a
                                    key={cat}
                                    href={`/blog?category=${cat}`}
                                    className={activeCategory === cat ? 'opacity-100' : 'opacity-80 hover:opacity-100'}
                                >
                                    <BrutalTag>{cat} ({count})</BrutalTag>
                                </a>
                            )
                        })}
                    </div>
                ) : <div />}

                <div className="flex flex-col sm:flex-row sm:items-center gap-4 shrink-0 mt-4 md:mt-0">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-transparent border border-black/10 dark:border-white/10 rounded-full px-4 py-1.5 text-sm focus:outline-none focus:border-peach w-full sm:w-48 transition-all"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black dark:hover:text-white text-xs"
                            >
                                ✕
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-4 text-xs font-display tracking-widest uppercase justify-end">
                        <span className="text-gray-500 hidden lg:inline">Sort by:</span>
                        <button
                            onClick={() => setSortBy('date')}
                            className={`transition-colors ${sortBy === 'date' ? 'text-peach font-bold' : 'text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                        >
                            Latest
                        </button>
                        <button
                            onClick={() => setSortBy('views')}
                            className={`transition-colors flex items-center gap-1 ${sortBy === 'views' ? 'text-peach font-bold' : 'text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                        >
                            Popular
                        </button>
                    </div>
                </div>
            </div>

            {/* Posts Grid */}
            {sorted.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-20">
                    {sorted.map((post, index) => (
                        <PostCard
                            key={post.slug}
                            index={index}
                            slug={post.slug}
                            title={post.title}
                            date={post.date}
                            excerpt={post.excerpt}
                            tags={post.tags}
                            readTime={post.readTime}
                            coverImage={post.coverImage}
                            imageAspect={getAspectForBlog(index)}
                            staticViews={viewCounts[post.slug]}
                            isPopular={popularSlugs.includes(post.slug)}
                        />
                    ))}
                </div>
            ) : (
                <div className="glass-card p-12 text-center">
                    <p className="text-2xl mb-2">🔍</p>
                    <p className="text-gray-400 mb-2">
                        {activeCategory ? `No posts in category "${activeCategory}"` : 'No posts yet.'}
                    </p>
                    <p className="text-gray-500 text-sm">
                        {activeCategory ? (
                            <a href="/blog" className="text-peach hover:underline">View all posts →</a>
                        ) : (
                            'Add markdown files to content/posts/ to get started.'
                        )}
                    </p>
                </div>
            )}
        </>
    )
}
