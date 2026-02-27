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
            <section className="relative">
                {post.coverImage ? (
                    <div className="relative h-[40vh] sm:h-[50vh]">
                        <img
                            src={post.coverImage}
                            alt={post.title}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D0D] via-black/50 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10">
                            <div className="max-w-4xl mx-auto">
                                <Link
                                    href="/blog"
                                    className="inline-flex items-center gap-1 text-sm text-gray-300 hover:text-peach transition-colors mb-4"
                                >
                                    <ArrowLeft size={16} />
                                    Back to blog
                                </Link>
                                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-white mb-3">
                                    {post.title}
                                </h1>
                                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-300">
                                    <time>{post.date}</time>
                                    <span>·</span>
                                    <span>{post.readTime} read</span>
                                    {post.tags && post.tags.length > 0 && (
                                        <>
                                            <span>·</span>
                                            <div className="flex gap-2">
                                                {post.tags.map(tag => (
                                                    <BrutalTag key={tag}>{tag}</BrutalTag>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="pt-12 pb-8 px-4 sm:px-6">
                        <div className="max-w-4xl mx-auto">
                            <Link
                                href="/blog"
                                className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-peach transition-colors mb-4"
                            >
                                <ArrowLeft size={16} />
                                Back to blog
                            </Link>
                            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold mb-4">
                                {post.title}
                            </h1>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                                <time>{post.date}</time>
                                <span>·</span>
                                <span>{post.readTime} read</span>
                                {post.tags && post.tags.length > 0 && (
                                    <>
                                        <span>·</span>
                                        <div className="flex gap-2">
                                            {post.tags.map(tag => (
                                                <BrutalTag key={tag}>{tag}</BrutalTag>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}
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
