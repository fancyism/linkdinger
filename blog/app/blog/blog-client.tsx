'use client'

import { useSearchParams } from 'next/navigation'
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

    const filtered = activeCategory
        ? posts.filter(p => p.category === activeCategory)
        : posts

    return (
        <>
            {/* Category Filter */}
            {categories.length > 0 && (
                <div className="flex items-center gap-3 overflow-x-auto pb-2 mb-8">
                    <a
                        href="/blog"
                        className={`text-sm px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap ${!activeCategory
                            ? 'bg-peach text-black'
                            : 'glass-card !rounded-lg text-gray-400 hover:text-white'
                            }`}
                    >
                        All ({posts.length})
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
            )}

            {/* Posts Grid */}
            {filtered.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-20">
                    {filtered.map((post, index) => (
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
