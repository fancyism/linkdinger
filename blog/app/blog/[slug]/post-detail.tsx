'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import ReadingProgress from '@/components/reading-progress'
import TableOfContents from '@/components/table-of-contents'
import ShareButtons from '@/components/share-buttons'
import PostCard from '@/components/post-card'
import BrutalTag from '@/components/ui/brutal-tag'
import type { Post, TocItem } from '@/lib/posts'

interface PostDetailProps {
    post: Post
    html: string
    headings: TocItem[]
    related: Post[]
}

export default function PostDetail({ post, html, headings, related }: PostDetailProps) {
    const [isTagsExpanded, setIsTagsExpanded] = useState(false)
    const MAX_TAGS = 3

    return (
        <>
            <ReadingProgress />

            {/* Hero */}
            <section className="relative pt-12 lg:pt-32 pb-12 lg:pb-32 px-4 sm:px-6 mb-12 border-b border-white/10 dark:border-white/10 overflow-hidden">
                {/* Background Image Setup */}
                {post.coverImage && (
                    <>
                        <div
                            className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-60 dark:opacity-40"
                            style={{ backgroundImage: `url(${post.coverImage})` }}
                        />
                        <div className="absolute inset-0 z-0 bg-gradient-to-t from-white via-white/80 dark:from-[#0a0a0a] dark:via-[#0a0a0a]/50 to-transparent" />
                        <div className="absolute inset-0 z-0 bg-gradient-to-b from-white/50 dark:from-[#0a0a0a]/30 to-transparent" />
                    </>
                )}

                <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-12 relative z-10 w-full">
                    {/* Artistic Title Area */}
                    <div className="flex-1 md:w-2/3 pr-0 md:pr-12">
                        <Link
                            href="/blog"
                            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-peach transition-colors mb-8 font-bold tracking-widest uppercase"
                        >
                            <ArrowLeft size={16} />
                            Back to Index
                        </Link>

                        <h1 className="text-4xl sm:text-5xl lg:text-7xl font-display font-black text-stroke-hero drop-shadow-sm leading-[1.2] tracking-tighter mb-8">
                            {post.title}
                        </h1>

                        <div className="flex flex-wrap items-center gap-6 text-sm text-gray-400 font-medium font-display tracking-widest uppercase mb-8">
                            <time className="text-peach">{post.date}</time>
                            <span className="opacity-30">|</span>
                            <span>{post.readTime} read</span>
                            {post.tags && post.tags.length > 0 && (
                                <>
                                    <span className="opacity-30">|</span>
                                    <div className="flex flex-wrap gap-2 items-center">
                                        {(isTagsExpanded ? post.tags : post.tags.slice(0, MAX_TAGS)).map(tag => (
                                            <Link key={tag} href={`/blog/tag/${encodeURIComponent(tag)}`}>
                                                <BrutalTag className="hover:border-peach hover:text-peach hover:bg-peach/10 transition-colors cursor-pointer text-xs py-1 px-3">
                                                    {tag}
                                                </BrutalTag>
                                            </Link>
                                        ))}
                                        {post.tags.length > MAX_TAGS && !isTagsExpanded && (
                                            <button
                                                onClick={() => setIsTagsExpanded(true)}
                                                className="text-[0.65rem] font-display px-2 py-0.5 rounded-full border border-dashed border-white/20 text-gray-400 hover:text-peach hover:border-peach transition-colors"
                                            >
                                                +{post.tags.length - MAX_TAGS}
                                            </button>
                                        )}
                                        {post.tags.length > MAX_TAGS && isTagsExpanded && (
                                            <button
                                                onClick={() => setIsTagsExpanded(false)}
                                                className="text-xs font-display text-gray-400 hover:text-peach transition-colors ml-1"
                                            >
                                                Show less
                                            </button>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* Content + TOC */}
            <section className="py-10 px-4 sm:px-6">
                <div className="max-w-6xl mx-auto flex gap-10">
                    {/* Article */}
                    <article
                        className="prose flex-1 min-w-0"
                        dangerouslySetInnerHTML={{ __html: html }}
                    />

                    {/* Sidebar TOC (desktop) */}
                    {headings.length > 0 && (
                        <aside className="hidden lg:block w-64 shrink-0">
                            <TableOfContents headings={headings} />
                        </aside>
                    )}
                </div>
            </section>

            {/* Share + Divider */}
            <section className="px-4 sm:px-6 pb-10">
                <div className="max-w-[65ch] mx-auto">
                    <div className="border-t border-glass-border pt-6 flex items-center justify-between">
                        <span className="text-sm text-gray-500">Share this post</span>
                        <ShareButtons title={post.title} />
                    </div>
                </div>
            </section>

            {/* Related Posts */}
            {related.length > 0 && (
                <section className="pb-20 px-4 sm:px-6">
                    <div className="max-w-6xl mx-auto">
                        <h2 className="text-2xl font-display font-bold mb-6">
                            Related Posts
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {related.map(p => (
                                <PostCard
                                    key={p.slug}
                                    slug={p.slug}
                                    title={p.title}
                                    date={p.date}
                                    excerpt={p.excerpt}
                                    tags={p.tags}
                                    readTime={p.readTime}
                                    coverImage={p.coverImage}
                                />
                            ))}
                        </div>
                    </div>
                </section>
            )}
        </>
    )
}
