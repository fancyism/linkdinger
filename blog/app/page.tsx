import Hero from '@/components/hero'
import PostCard from '@/components/post-card'
import { getAllPosts } from '@/lib/posts'

export default function Home() {
  const posts = getAllPosts().slice(0, 4)

  return (
    <>
      <Hero />
      
      <section className="py-12 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-display font-bold mb-8">
            Recent Posts
          </h2>
          
          {posts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {posts.map((post) => (
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
              <p className="text-gray-400 mb-4">No posts yet.</p>
              <p className="text-gray-500 text-sm">
                Add markdown files to content/posts/ to get started.
              </p>
            </div>
          )}
        </div>
      </section>
    </>
  )
}
