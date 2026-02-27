'use client'

import Link from 'next/link'
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
    return (
        <>
            <ReadingProgress />

            {/* Hero */}
            <section className="relative pt-12 lg:pt-24 pb-12 px-4 sm:px-6 mb-12 border-b border-white/10 dark:border-white/10">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-12 relative">
                    {/* Artistic Title Area */}
                    <div className="flex-1 md:w-2/3 pr-0 md:pr-12">
                        <Link
                            href="/blog"
                            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-peach transition-colors mb-8 font-bold tracking-widest uppercase"
                        >
                            <ArrowLeft size={16} />
                            Back to Index
                        </Link>

                        <h1 className="text-4xl sm:text-5xl lg:text-7xl font-display font-black text-stroke-hero mb-8 leading-[1.05] tracking-tighter drop-shadow-sm">
                            {post.title}
                        </h1>

                        <div className="flex flex-wrap items-center gap-6 text-sm text-gray-400 font-medium font-display tracking-widest uppercase mb-8">
                            <time className="text-peach">{post.date}</time>
                            <span className="opacity-30">|</span>
                            <span>{post.readTime} read</span>
                            {post.tags && post.tags.length > 0 && (
                                <>
                                    <span className="opacity-30">|</span>
                                    <div className="flex gap-2">
                                        {post.tags.map(tag => (
                                            <BrutalTag key={tag}>{tag}</BrutalTag>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Right side Cover Image or artistic block */}
                    {post.coverImage && (
                        <div className="w-full md:w-1/3 relative flex justify-end">
                            <div className="aspect-[3/4] w-full max-w-sm relative glass-card overflow-hidden rotate-2 hover:rotate-0 transition-transform duration-500">
                                <img
                                    src={post.coverImage}
                                    alt={post.title}
                                    className="w-full h-full object-cover filter contrast-125"
                                />
                                {/* Vertical text accent */}
                                <div className="absolute right-2 top-0 bottom-0 flex items-center mix-blend-difference pointer-events-none">
                                    <span className="transform rotate-90 text-white font-bold tracking-[0.4em] uppercase text-xs opacity-80 whitespace-nowrap">
                                        {post.tags?.[0] || 'VIBE CODING'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
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
