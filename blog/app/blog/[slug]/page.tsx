import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Twitter, Linkedin, Copy } from 'lucide-react'
import { getPostBySlug, getAllPosts } from '@/lib/posts'
import BrutalTag from '@/components/ui/brutal-tag'

interface Props {
  params: { slug: string }
}

export async function generateStaticParams() {
  const posts = getAllPosts()
  return posts.map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({ params }: Props) {
  const post = getPostBySlug(params.slug)
  if (!post) return { title: 'Not Found' }
  
  return {
    title: `${post.title} | Linkdinger`,
    description: post.excerpt,
  }
}

export default function PostPage({ params }: Props) {
  const post = getPostBySlug(params.slug)
  
  if (!post) {
    notFound()
  }

  const allPosts = getAllPosts()
  const currentIndex = allPosts.findIndex(p => p.slug === post.slug)
  const relatedPosts = allPosts
    .filter(p => p.slug !== post.slug)
    .slice(0, 3)

  return (
    <article className="py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        <Link 
          href="/blog" 
          className="inline-flex items-center gap-2 text-gray-400 hover:text-peach mb-8 transition-colors"
        >
          <ArrowLeft size={20} />
          Back to Blog
        </Link>

        <header className="liquid-glass rounded-2xl p-8 mb-8">
          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags?.map((tag) => (
              <BrutalTag key={tag}>{tag}</BrutalTag>
            ))}
          </div>
          
          <h1 className="text-3xl sm:text-4xl font-display font-bold mb-4">
            {post.title}
          </h1>
          
          <div className="flex items-center gap-4 text-gray-400">
            <time>{post.date}</time>
            <span>·</span>
            <span>{post.readTime} read</span>
          </div>
        </header>

        {post.coverImage && (
          <div className="rounded-2xl overflow-hidden mb-8 border border-glass-border">
            <img 
              src={post.coverImage} 
              alt={post.title}
              className="w-full aspect-video object-cover"
            />
          </div>
        )}

        <div 
          className="prose prose-invert max-w-none mb-12"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        <div className="glass-card p-6 mb-12">
          <h3 className="text-lg font-display font-bold mb-4">Share this post</h3>
          <div className="flex gap-3">
            <a 
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(`https://example.com/blog/${post.slug}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="glass-button p-3"
            >
              <Twitter size={20} />
            </a>
            <a 
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`https://example.com/blog/${post.slug}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="glass-button p-3"
            >
              <Linkedin size={20} />
            </a>
            <button 
              onClick={() => navigator.clipboard.writeText(`https://example.com/blog/${post.slug}`)}
              className="glass-button p-3"
            >
              <Copy size={20} />
            </button>
          </div>
        </div>

        {relatedPosts.length > 0 && (
          <div>
            <h3 className="text-xl font-display font-bold mb-6">Related Posts</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {relatedPosts.map((p) => (
                <Link 
                  key={p.slug} 
                  href={`/blog/${p.slug}`}
                  className="glass-card p-4 hover:border-peach/30 transition-colors"
                >
                  <h4 className="font-medium mb-1 hover:text-peach transition-colors">
                    {p.title}
                  </h4>
                  <p className="text-sm text-gray-500">{p.date}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </article>
  )
}
