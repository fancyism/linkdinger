import { getAllPosts, getAllCategories } from '@/lib/posts'
import { getHomePostsPerPage, getTotalPages, paginatePosts, splitHomePosts } from '@/lib/home-layout'
import Hero from '@/components/hero'
import PostCard from '@/components/post-card'
import BrutalTag from '@/components/ui/brutal-tag'
import HomeGallery from '@/components/home-gallery'
import Pagination from '@/components/pagination'
import Link from 'next/link'

export default function HomePage() {
  const page = 1
  const allPosts = getAllPosts()
  const categories = getAllCategories()

  const postsPerPage = getHomePostsPerPage()
  const totalPages = getTotalPages(allPosts.length, postsPerPage)
  const currentPosts = paginatePosts(allPosts, page, postsPerPage)
  const { featured, gridPosts, listPosts } = splitHomePosts(currentPosts)

  const getAspectForHome = (index: number) => {
    const pattern = ['portrait', 'square', 'wide', 'wide']
    return pattern[index % pattern.length] as 'portrait' | 'square' | 'wide'
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
