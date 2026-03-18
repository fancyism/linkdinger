import { getAllPosts, getAllCategories } from '@/lib/posts'
import { getHomePostsPerPage, getTotalPages, paginatePosts, splitHomePosts } from '@/lib/home-layout'
import { getPopularPosts } from '@/lib/views'
import Hero from '@/components/hero'
import PostCard from '@/components/post-card'
import BrutalTag from '@/components/ui/brutal-tag'
import HomeGallery from '@/components/home-gallery'
import Pagination from '@/components/pagination'
import Link from 'next/link'

export default async function HomePage() {
  const page = 1
  const allPosts = getAllPosts()
  const categories = getAllCategories()
  const popularPosts = await getPopularPosts(allPosts, 3)

  const postsPerPage = getHomePostsPerPage()
  const totalPages = getTotalPages(allPosts.length, postsPerPage)
  const currentPosts = paginatePosts(allPosts, page, postsPerPage)
  const { featured, gridPosts, listPosts } = splitHomePosts(currentPosts)

  const getAspectForHome = (index: number) => {
    // 12-element cycle guaranteeing NO symmetric rows in 2-col or 3-col layouts
    const pattern = [
      'portrait', 'wide', 'square', 'landscape',
      'portrait', 'square', 'wide', 'landscape',
      'square', 'portrait', 'landscape', 'wide'
    ]
    return pattern[index % pattern.length] as 'portrait' | 'square' | 'wide' | 'landscape'
  }

  return (
    <>
      {/* Hero: Featured Post */}
      <section className="pt-8 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          {featured ? (
            <Hero
              title={featured.title}
              excerpt={featured.excerpt}
              slug={featured.slug}
              date={featured.date}
              readTime={featured.readTime || '5 min'}
              tags={featured.tags}
              coverImage={featured.coverImage}
              badgeText="🌟 LATEST ENTRY"
            />
          ) : (
            <div className="liquid-glass rounded-3xl p-8 sm:p-12 text-center">
              <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-peach to-peach-dark flex items-center justify-center text-4xl mb-6">
                ✍️
              </div>
              <h1 className="text-4xl sm:text-5xl font-display font-bold mb-4">
                Welcome to <span className="text-peach">Linkdinger</span>
              </h1>
              <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                AI-powered tools and thoughts. Start writing in Obsidian to see your posts here.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Category Cloud */}
      {categories.length > 0 && page === 1 && (
        <section className="pt-10 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-hide">
              <span className="text-sm text-gray-500 whitespace-nowrap font-medium">
                Categories:
              </span>
              {categories.slice(0, 6).map((cat) => (
                <Link key={cat} href={`/blog?category=${cat}`}>
                  <BrutalTag>{cat}</BrutalTag>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Trending / Popular Posts */}
      {popularPosts.length > 0 && page === 1 && (
        <section className="py-12 px-4 sm:px-6 bg-gradient-to-br from-peach/5 via-transparent to-peach/5 dark:from-peach/10 dark:via-transparent dark:to-transparent border-y border-peach/10 dark:border-white/5 relative overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-peach/10 rounded-full blur-[100px] pointer-events-none mix-blend-multiply dark:mix-blend-screen" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-peach/10 rounded-full blur-[100px] pointer-events-none mix-blend-multiply dark:mix-blend-screen" />
          <div className="max-w-6xl mx-auto relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-4 mb-10">
              <div className="flex items-center gap-3">
                <h2 className="text-4xl lg:text-5xl font-display font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-500 dark:from-white dark:to-gray-400">
                  Trending Now
                </h2>
                <span className="text-3xl animate-pulse">🔥</span>
              </div>
              <p className="text-sm font-display uppercase tracking-widest text-gray-500 font-bold">Top Charts</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {popularPosts.map((post, index) => (
                <PostCard
                  key={`trending-${post.slug}`}
                  index={index}
                  slug={post.slug}
                  title={post.title}
                  date={post.date}
                  excerpt={post.excerpt}
                  tags={post.tags}
                  readTime={post.readTime}
                  coverImage={post.coverImage}
                  variant="grid"
                  imageAspect="landscape"
                  staticViews={post._views}
                  isPopular={true}
                  rank={index + 1}
                />
              ))}
            </div>
          </div>
        </section>
      )}

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


    </>
  )
}
