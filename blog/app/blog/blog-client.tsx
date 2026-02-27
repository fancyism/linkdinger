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
        tags?: string[]
        readTime?: string
        coverImage?: string
    }>
    tags: string[]
}

export default function BlogClient({ posts, tags }: BlogClientProps) {
    const searchParams = useSearchParams()
    const activeTag = searchParams.get('tag')

    const filtered = activeTag
        ? posts.filter(p => p.tags?.includes(activeTag))
        : posts

    return (
        <>
            {/* Tag Filter */}
            {tags.length > 0 && (
                <div className="flex items-center gap-3 overflow-x-auto pb-2 mb-8">
                    <a
                        href="/blog"
                        className={`text-sm px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap ${!activeTag
                                ? 'bg-peach text-black'
                                : 'glass-card !rounded-lg text-gray-400 hover:text-white'
                            }`}
                    >
                        All ({posts.length})
                    </a>
                    {tags.map((tag) => {
                        const count = posts.filter(p => p.tags?.includes(tag)).length
                        return (
                            <a
                                key={tag}
                                href={`/blog?tag=${tag}`}
                                className={activeTag === tag ? 'opacity-100' : 'opacity-80 hover:opacity-100'}
                            >
                                <BrutalTag>{tag} ({count})</BrutalTag>
                            </a>
                        )
                    })}
                </div>
            )}

            {/* Posts Grid */}
            {filtered.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filtered.map((post) => (
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
                    <p className="text-2xl mb-2">🔍</p>
                    <p className="text-gray-400 mb-2">
                        {activeTag ? `No posts tagged "${activeTag}"` : 'No posts yet.'}
                    </p>
                    <p className="text-gray-500 text-sm">
                        {activeTag ? (
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
