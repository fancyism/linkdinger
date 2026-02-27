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
  index?: number
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
  index,
}: PostCardProps) {

  if (variant === 'list') {
    return (
      <Link href={`/blog/${slug}`} className="block group border-b border-black/5 dark:border-white/5 pb-8 mb-8 last:border-0 last:mb-0 last:pb-0 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors p-4 -mx-4 rounded-2xl">
        <article className="flex items-center gap-6 sm:gap-10 transition-transform duration-300 group-hover:-translate-y-1">
          <div className="w-16 sm:w-20 shrink-0">
            <span className="text-xl sm:text-2xl font-display font-bold text-gray-400 dark:text-gray-500 group-hover:text-black dark:group-hover:text-white transition-colors">{date.split(',')[0]}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-display font-bold text-gray-900 dark:text-white group-hover:text-peach dark:group-hover:text-peach transition-colors leading-snug line-clamp-2">
              {title}
            </h2>
          </div>
          {coverImage ? (
            <div className="w-24 h-24 sm:w-32 sm:h-32 shrink-0 overflow-hidden rounded-xl bg-black/5 dark:bg-white/5 relative group-hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] dark:group-hover:shadow-[0_8px_30px_rgba(255,255,255,0.1)] transition-shadow duration-500">
              <img src={coverImage} alt={title} className="w-full h-full object-cover group-hover:scale-110 group-hover:rotate-1 transition-all duration-700" loading="lazy" />
              <div className="absolute inset-0 border border-black/10 dark:border-white/10 rounded-xl pointer-events-none" />
            </div>
          ) : (
            <div className="w-24 h-24 sm:w-32 sm:h-32 shrink-0 overflow-hidden rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 flex items-center justify-center group-hover:border-black/20 dark:group-hover:border-white/20 group-hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] dark:group-hover:shadow-[0_8px_30px_rgba(255,255,255,0.1)] transition-all duration-500">
              <span className="text-4xl text-gray-400 dark:text-gray-500 font-display font-bold">{title.charAt(0)}</span>
            </div>
          )}
        </article>
      </Link>
    )
  }

  // Grid Variant (Minimalist Editorial Asymmetric)
  const aspectClass = index !== undefined
    ? (index % 3 === 0 ? 'aspect-square' : index % 3 === 1 ? 'aspect-[4/5]' : 'aspect-[5/4]')
    : 'aspect-[4/3]'

  // Format date from YYYY-MM-DD to MM.DD
  const [year, month, day] = date.split(',')[0].split('-')
  const formattedDate = month && day ? `${month}.${day}` : date.split(',')[0]

  return (
    <Link href={`/blog/${slug}`} className="block group">
      <article className="h-full flex flex-col gap-4 pt-6 border-t border-black/10 dark:border-white/10 group-hover:border-black/40 dark:group-hover:border-white/40 transition-colors duration-500">
        <div className="text-lg sm:text-xl font-display font-bold text-gray-400 dark:text-gray-500 group-hover:text-black dark:group-hover:text-white transition-colors tracking-tighter">
          {formattedDate}
        </div>
        <h2 className="text-2xl sm:text-3xl font-display font-bold text-gray-900 dark:text-white group-hover:text-peach transition-colors leading-tight line-clamp-2 h-[3.5rem] sm:h-[4.5rem]">
          {title}
        </h2>
        {coverImage ? (
          <div className={`${aspectClass} w-full relative overflow-hidden bg-black/10 dark:bg-black/50 group-hover:-translate-y-2 group-hover:shadow-[0_20px_40px_rgba(0,0,0,0.15)] dark:group-hover:shadow-[0_20px_40px_rgba(255,255,255,0.08)] transition-all duration-500 mt-2 rounded-sm`}>
            <img
              src={coverImage}
              alt={title}
              className="w-full h-full object-cover filter dark:brightness-90 dark:group-hover:brightness-100 group-hover:scale-105 transition-all duration-700"
              loading="lazy"
            />
          </div>
        ) : (
          <div className={`${aspectClass} w-full bg-black/5 dark:bg-white/5 flex items-center justify-center group-hover:-translate-y-2 group-hover:shadow-[0_20px_40px_rgba(0,0,0,0.15)] dark:group-hover:shadow-[0_20px_40px_rgba(255,255,255,0.08)] transition-all duration-500 mt-2 rounded-sm`}>
            <span className="text-8xl max-w-full truncate px-4 opacity-10 dark:opacity-20 font-display font-bold text-gray-900 dark:text-white">
              {title.charAt(0)}
            </span>
          </div>
        )}
      </article>
    </Link>
  )
}

