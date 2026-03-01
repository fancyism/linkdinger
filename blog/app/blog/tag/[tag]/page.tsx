import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getAllTags, getPostsByTag } from '@/lib/posts'
import PostCard from '@/components/post-card'

export function generateStaticParams() {
    return getAllTags().map(tag => ({
        tag: encodeURIComponent(tag),
    }))
}

export function generateMetadata({ params }: { params: { tag: string } }) {
    const tag = decodeURIComponent(params.tag)
    return {
        title: `Posts tagged "${tag}"`,
        description: `All blog posts tagged with ${tag}`,
        alternates: {
            canonical: `/blog/tag/${encodeURIComponent(tag)}/`,
        },
    }
}

export default function TagPage({ params }: { params: { tag: string } }) {
    const tag = decodeURIComponent(params.tag)
    const posts = getPostsByTag(tag)

    if (posts.length === 0) notFound()

    return (
        <section className="py-12 px-4 sm:px-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-10">
                    <Link
                        href="/blog"
                        className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-peach transition-colors mb-4"
                    >
                        ← Back to Blog
                    </Link>
                    <div className="flex items-center gap-4">
                        <span className="inline-block px-4 py-1.5 bg-peach/10 border border-peach/30 rounded-full text-peach font-display font-bold text-lg">
                            #{tag}
                        </span>
                        <span className="text-gray-400 font-display">
                            {posts.length} {posts.length === 1 ? 'post' : 'posts'}
                        </span>
                    </div>
                </div>

                {/* Posts Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-20">
                    {posts.map((post, index) => (
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
            </div>
        </section>
    )
}
