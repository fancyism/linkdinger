import Link from 'next/link'
import BrutalTag from './ui/brutal-tag'

interface PostCardProps {
  slug: string
  title: string
  date: string
  excerpt: string
  tags?: string[]
  readTime?: string
  coverImage?: string
  featured?: boolean
}

export default function PostCard({
  slug,
  title,
  date,
  excerpt,
  tags = [],
  readTime = '5 min',
  coverImage,
  featured = false,
}: PostCardProps) {
  if (featured && coverImage) {
    return (
      <Link href={`/blog/${slug}`} className="block group">
        <article className="glass-card overflow-hidden relative">
          <div className="aspect-[21/9] relative overflow-hidden">
            <img
              src={coverImage}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
              <div className="flex items-center gap-2 text-sm text-gray-300 mb-2">
                <time>{date}</time>
                <span>·</span>
                <span>{readTime} read</span>
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-white mb-3 group-hover:text-peach transition-colors">
                {title}
              </h2>
              <p className="text-gray-300 max-w-2xl line-clamp-2">{excerpt}</p>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {tags.slice(0, 3).map((tag) => (
                    <BrutalTag key={tag}>{tag}</BrutalTag>
                  ))}
                </div>
              )}
            </div>
          </div>
        </article>
      </Link>
    )
  }

  return (
    <Link href={`/blog/${slug}`} className="block group">
      <article className="glass-card overflow-hidden h-full flex flex-col">
        {coverImage && (
          <div className="aspect-video relative overflow-hidden">
            <img
              src={coverImage}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-dark/60 to-transparent" />
          </div>
        )}
        <div className="p-6 flex flex-col flex-1">
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
            <time>{date}</time>
            <span>·</span>
            <span>{readTime} read</span>
          </div>
          <h2 className="text-xl font-display font-bold mb-2 group-hover:text-peach transition-colors">
            {title}
          </h2>
          <p className="text-gray-400 mb-4 line-clamp-2 flex-1">{excerpt}</p>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.slice(0, 3).map((tag) => (
                <BrutalTag key={tag}>{tag}</BrutalTag>
              ))}
            </div>
          )}
        </div>
      </article>
    </Link>
  )
}
