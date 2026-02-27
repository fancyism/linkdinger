import { getAllPosts, getFeaturedPost, getAllCategories } from '@/lib/posts'
import Hero from '@/components/hero'
import PostCard from '@/components/post-card'
import BrutalTag from '@/components/ui/brutal-tag'
import NewsletterForm from '@/components/newsletter-form'
import Link from 'next/link'

export default function HomePage() {
  const posts = getAllPosts()
  const featured = getFeaturedPost()
  const categories = getAllCategories()
  const remainingPosts = featured ? posts.filter(p => p.slug !== featured.slug) : posts
  const gridPosts = remainingPosts.slice(0, 4)
  const listPosts = remainingPosts.slice(4)

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
      {categories.length > 0 && (
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
        <section className="py-12 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-12">
              {gridPosts.map((post) => (
                <PostCard
                  key={post.slug}
                  slug={post.slug}
                  title={post.title}
                  date={post.date}
                  excerpt={post.excerpt}
                  tags={post.tags}
                  readTime={post.readTime}
                  coverImage={post.coverImage}
                  variant="grid"
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 1-Column List Posts */}
      {listPosts.length > 0 && (
        <section className="py-12 px-4 sm:px-6 border-t border-white/5">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col">
              {listPosts.map((post) => (
                <PostCard
                  key={post.slug}
                  slug={post.slug}
                  title={post.title}
                  date={post.date}
                  excerpt={post.excerpt}
                  tags={post.tags}
                  readTime={post.readTime}
                  coverImage={post.coverImage}
                  variant="list"
                />
              ))}
            </div>
            <div className="mt-12 text-center">
              <Link
                href="/blog"
                className="brutal-btn"
              >
                View all stories
              </Link>
            </div>
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
