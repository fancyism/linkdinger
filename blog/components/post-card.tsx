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
  variant?: 'grid' | 'list'
}

export default function PostCard({
  slug,
  title,
  date,
  excerpt,
  tags = [],
  readTime = '5 min',
  coverImage,
  variant = 'grid',
}: PostCardProps) {

  if (variant === 'list') {
    return (
      <Link href={`/blog/${slug}`} className="block group border-b border-white/5 pb-8 mb-8 last:border-0 last:mb-0 last:pb-0 hover:bg-white/[0.02] transition-colors p-4 -mx-4 rounded-2xl">
        <article className="flex items-center gap-6 sm:gap-10">
          <div className="w-16 sm:w-20 shrink-0">
            <span className="text-xl sm:text-2xl font-display font-bold text-gray-500 group-hover:text-white transition-colors">{date.split(',')[0]}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-display font-bold text-white group-hover:text-peach transition-colors leading-snug line-clamp-2">
              {title}
            </h2>
          </div>
          {coverImage ? (
            <div className="w-24 h-24 sm:w-32 sm:h-32 shrink-0 overflow-hidden rounded-xl bg-white/5 relative">
              <img src={coverImage} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" />
              <div className="absolute inset-0 border border-white/10 rounded-xl pointer-events-none" />
            </div>
          ) : (
            <div className="w-24 h-24 sm:w-32 sm:h-32 shrink-0 overflow-hidden rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-white/20 transition-colors">
              <span className="text-4xl text-gray-500">{title.charAt(0)}</span>
            </div>
          )}
        </article>
      </Link>
    )
  }

  // Grid Variant (Default)
  return (
    <Link href={`/blog/${slug}`} className="block group">
      <article className="h-full flex flex-col gap-4 p-5 rounded-3xl border border-transparent hover:border-white/10 dark:hover:border-white/20 transition-all duration-300 hover:bg-white/5 dark:hover:bg-white/5">
        <div className="text-2xl sm:text-3xl font-display font-bold text-gray-400 group-hover:text-white transition-colors tracking-tighter">
          {date.split(',')[0]}
        </div>
        <h2 className="text-2xl sm:text-3xl font-display font-bold text-white group-hover:text-peach transition-colors leading-tight line-clamp-2 h-[4rem] sm:h-[4.5rem]">
          {title}
        </h2>
        {coverImage ? (
          <div className="aspect-[4/3] w-full relative overflow-hidden rounded-2xl bg-black/50 border border-white/5 group-hover:border-white/20 transition-colors duration-300 mt-2">
            <img
              src={coverImage}
              alt={title}
              className="w-full h-full object-cover filter brightness-90 group-hover:brightness-100 group-hover:scale-105 transition-all duration-700"
              loading="lazy"
            />
          </div>
        ) : (
          <div className="aspect-[4/3] w-full bg-white/5 dark:bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center group-hover:border-white/20 transition-colors duration-300 mt-2">
            <span className="text-8xl max-w-full truncate px-4 opacity-20 font-display font-bold">
              {title.charAt(0)}
            </span>
          </div>
        )}
      </article>
    </Link>
  )
}

