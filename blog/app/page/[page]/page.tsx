import { getAllPosts, getAllCategories } from '@/lib/posts'
import { getHomePostsPerPage, getTotalPages, paginatePosts, splitHomePosts } from '@/lib/home-layout'
import Hero from '@/components/hero'
import PostCard from '@/components/post-card'
import BrutalTag from '@/components/ui/brutal-tag'
import NewsletterForm from '@/components/newsletter-form'
import HomeGallery from '@/components/home-gallery'
import Pagination from '@/components/pagination'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export function generateStaticParams() {
    const posts = getAllPosts()
    const postsPerPage = getHomePostsPerPage()
    const totalPages = getTotalPages(posts.length, postsPerPage)

    // We don't need to generate a param for page 1 because app/page.tsx handles it.
    const paths = []
    for (let i = 2; i <= totalPages; i++) {
        paths.push({ page: i.toString() })
    }

    return paths
}

export default function PaginatedHomePage({
    params
}: {
    params: { page: string }
}) {
    const page = parseInt(params.page, 10)
    const allPosts = getAllPosts()
    const postsPerPage = getHomePostsPerPage()
    const totalPages = getTotalPages(allPosts.length, postsPerPage)

    // Invalid page numbers go to 404
    if (isNaN(page) || page < 1 || page > totalPages) {
        notFound()
    }

    const categories = getAllCategories()
    const currentPosts = paginatePosts(allPosts, page, postsPerPage)
    const { featured, gridPosts, listPosts } = splitHomePosts(currentPosts)

    const getAspectForHome = (index: number) => {
        const pattern = ['portrait', 'square', 'wide', 'wide']
        return pattern[index % pattern.length] as 'portrait' | 'square' | 'wide'
    }

    return (
        <>
            <section className="pt-8 px-4 sm:px-6">
                <div className="max-w-6xl mx-auto">
                    {featured && (
                        <Hero
                            title={featured.title}
                            excerpt={featured.excerpt}
                            slug={featured.slug}
                            date={featured.date}
                            readTime={featured.readTime || '5 min'}
                            tags={featured.tags}
                            coverImage={featured.coverImage}
                        />
                    )}
                </div>
            </section>

            {/* 2-Column Grid Posts */}
            {gridPosts.length > 0 && (
                <section className="py-16 px-4 sm:px-6">
                    <div className="max-w-6xl mx-auto">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-20">
                            {gridPosts.map((post, index) => (
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
                                    variant="grid"
                                    imageAspect={getAspectForHome(index)}
                                />
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* 1-Column List Posts (Gallery Layout) */}
            {listPosts.length > 0 && (
                <section className="py-12 px-4 sm:px-6">
                    <div className="max-w-4xl mx-auto">
                        <HomeGallery posts={listPosts} />
                    </div>
                </section>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <section className="pb-12 px-4 sm:px-6">
                    <div className="max-w-4xl mx-auto flex justify-center">
                        <Pagination currentPage={page} totalPages={totalPages} basePath="/" />
                    </div>
                </section>
            )}

            {/* Newsletter CTA */}
            <section className="pb-20 px-4 sm:px-6">
                <div className="max-w-2xl mx-auto">
                    <div className="liquid-glass rounded-2xl p-8 text-center">
                        <h3 className="text-xl font-display font-bold mb-2">
                            Stay in the loop
                        </h3>
                        <p className="text-gray-400 mb-5 text-sm">
                            Get notified when I publish something new. No spam, unsubscribe anytime.
                        </p>
                        <NewsletterForm />
                    </div>
                </div>
            </section>
        </>
    )
}
