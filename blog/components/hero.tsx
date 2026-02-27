import Link from 'next/link'
import BrutalTag from './ui/brutal-tag'

interface HeroProps {
  title: string
  excerpt: string
  slug: string
  date: string
  readTime: string
  tags?: string[]
  coverImage?: string
}

export default function Hero({
  title,
  excerpt,
  slug,
  date,
  readTime,
  tags = [],
  coverImage,
}: HeroProps) {
  return (
    <Link href={`/blog/${slug}`} className="block group">
      <section className="relative overflow-hidden rounded-3xl glass-card">
        {coverImage ? (
          <div className="aspect-[21/9] sm:aspect-[21/9] relative">
            <img
              src={coverImage}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10">
              <div className="flex items-center gap-2 text-sm text-gray-300 mb-3">
                <time>{date}</time>
                <span>·</span>
                <span>{readTime} read</span>
                <span>·</span>
                <span className="text-peach font-medium">Featured</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-white mb-3 group-hover:text-peach transition-colors">
                {title}
              </h1>
              <p className="text-gray-300 text-lg max-w-2xl mb-4 line-clamp-2">
                {excerpt}
              </p>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {tags.slice(0, 4).map((tag) => (
                    <BrutalTag key={tag}>{tag}</BrutalTag>
                  ))}
                </div>
              )}
              <span className="text-peach font-semibold group-hover:underline">
                Read Article →
              </span>
            </div>
          </div>
        ) : (
          <div className="liquid-glass rounded-3xl p-8 sm:p-12">
            <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
              <time>{date}</time>
              <span>·</span>
              <span>{readTime} read</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-display font-bold mb-3 group-hover:text-peach transition-colors">
              {title}
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl mb-4">{excerpt}</p>
            <span className="text-peach font-semibold group-hover:underline">
              Read Article →
            </span>
          </div>
        )}
      </section>
    </Link>
  )
}
