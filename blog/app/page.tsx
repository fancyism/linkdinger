import { getAllPosts, getFeaturedPost, getAllTags } from '@/lib/posts'
import Hero from '@/components/hero'
import PostCard from '@/components/post-card'
import BrutalTag from '@/components/ui/brutal-tag'
import NewsletterForm from '@/components/newsletter-form'
import Link from 'next/link'

export default function HomePage() {
  const posts = getAllPosts()
  const featured = getFeaturedPost()
  const tags = getAllTags()
  const recentPosts = featured
    ? posts.filter(p => p.slug !== featured.slug).slice(0, 6)
    : posts.slice(0, 6)

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

      {/* Tag Cloud */}
      {tags.length > 0 && (
        <section className="pt-10 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-hide">
              <span className="text-sm text-gray-500 whitespace-nowrap font-medium">
                Topics:
              </span>
              {tags.map((tag) => (
                <Link key={tag} href={`/blog?tag=${tag}`}>
                  <BrutalTag>{tag}</BrutalTag>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Recent Posts Grid */}
      {recentPosts.length > 0 && (
        <section className="py-12 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-display font-bold">Latest Posts</h2>
              <Link
                href="/blog"
                className="text-sm text-peach hover:text-peach-light transition-colors font-medium"
              >
                View all →
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentPosts.map((post) => (
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
