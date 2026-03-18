'use client'

import Link from 'next/link'
import { useRef } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import BrutalTag from './ui/brutal-tag'
import ViewCounter from './view-counter'

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
  imageAspect?: 'square' | 'portrait' | 'landscape' | 'wide'
  staticViews?: number
  isPopular?: boolean
  rank?: number
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
  index = 0,
  imageAspect,
  staticViews,
  isPopular = false,
  rank,
}: PostCardProps) {
  const dateStr = date ? (typeof date === 'string' ? date : new Date(date).toISOString().split('T')[0]) : ''

  // 3D Tilt Logic
  const refList = useRef<HTMLDivElement>(null)
  const refGrid = useRef<HTMLDivElement>(null)
  
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 })
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 })

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["5deg", "-5deg"])
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-5deg", "5deg"])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>, ref: React.RefObject<HTMLDivElement>) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const width = rect.width
    const height = rect.height
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    const xPct = mouseX / width - 0.5
    const yPct = mouseY / height - 0.5
    x.set(xPct)
    y.set(yPct)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  if (variant === 'list') {
    return (
      <motion.div
        ref={refList}
        onMouseMove={(e) => handleMouseMove(e, refList)}
        onMouseLeave={handleMouseLeave}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d", transformPerspective: 1000 }}
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: index * 0.1 }}
      >
        <Link href={`/blog/${slug}`} className="block group border-b border-black/5 dark:border-white/5 pb-8 mb-8 last:border-0 last:mb-0 last:pb-0 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors p-4 -mx-4 rounded-2xl">
          <article className="flex items-center gap-6 sm:gap-10 transition-transform duration-300 group-hover:-translate-y-1">
          <div className="w-16 sm:w-20 shrink-0">
            <span className="text-xl sm:text-2xl font-display font-bold text-gray-400 dark:text-gray-500 group-hover:text-black dark:group-hover:text-white transition-colors">{dateStr.split(',')[0]}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-display font-bold text-gray-900 dark:text-white group-hover:text-peach dark:group-hover:text-peach transition-colors leading-snug line-clamp-2 mb-2">
              {title}
            </h2>
            <div className="flex items-center gap-3 text-xs text-gray-400 font-display uppercase tracking-widest">
              <ViewCounter slug={slug} trackView={false} staticViews={staticViews} />
              {isPopular && (
                <span className="text-[0.6rem] font-bold px-2 py-0.5 rounded-full bg-peach/10 text-peach border border-peach/20 flex items-center gap-1 whitespace-nowrap">
                  <span className="text-xs leading-none">🔥</span> Popular
                </span>
              )}
            </div>
          </div>
          {coverImage ? (
            <div className="w-24 h-24 sm:w-32 sm:h-32 shrink-0 overflow-hidden rounded-xl bg-black/5 dark:bg-white/5 relative group-hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] dark:group-hover:shadow-[0_8px_30px_rgba(255,255,255,0.1)] transition-shadow duration-500">
              <img src={coverImage} alt={title} className="w-full h-full object-cover group-hover:scale-110 group-hover:rotate-1 transition-all duration-700" loading="lazy" />
              <div className="absolute inset-0 border border-black/10 dark:border-white/10 rounded-xl pointer-events-none" />
              {rank && (
                <div className="absolute top-2 left-2 w-8 h-8 rounded-full bg-white/30 dark:bg-black/40 backdrop-blur-md border border-white/40 dark:border-white/20 flex items-center justify-center text-sm font-display font-black shadow-lg text-black dark:text-white z-10">
                  {rank}
                </div>
              )}
            </div>
          ) : (
            <div className="w-24 h-24 sm:w-32 sm:h-32 shrink-0 overflow-hidden rounded-xl relative bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 flex items-center justify-center group-hover:border-black/20 dark:group-hover:border-white/20 group-hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] dark:group-hover:shadow-[0_8px_30px_rgba(255,255,255,0.1)] transition-all duration-500">
              <span className="text-4xl text-gray-400 dark:text-gray-500 font-display font-bold">{title?.charAt(0) || 'U'}</span>
              {rank && (
                <div className="absolute top-2 left-2 w-8 h-8 rounded-full bg-white/30 dark:bg-black/40 backdrop-blur-md border border-white/40 dark:border-white/20 flex items-center justify-center text-sm font-display font-black shadow-lg text-black dark:text-white z-10">
                  {rank}
                </div>
              )}
            </div>
          )}
        </article>
      </Link>
      </motion.div>
    )
  }

  // Grid Variant (Minimalist Editorial Asymmetric & Symmetric Mixed)
  let aspectClass = 'aspect-[4/3]'
  if (imageAspect === 'square') aspectClass = 'aspect-square'
  else if (imageAspect === 'portrait') aspectClass = 'aspect-[4/5]'
  else if (imageAspect === 'landscape') aspectClass = 'aspect-[5/4]'
  else if (imageAspect === 'wide') aspectClass = 'aspect-[16/9]'
  else {
    // Fallback async organic pattern
    aspectClass = index !== undefined
      ? (index % 3 === 0 ? 'aspect-square' : index % 3 === 1 ? 'aspect-[4/5]' : 'aspect-[5/4]')
      : 'aspect-[4/3]'
  }

  // Format date from YYYY-MM-DD to MM.DD
  const [year, month, day] = dateStr.split(',')[0].split('-')
  const formattedDate = month && day ? `${month}.${day}` : dateStr.split(',')[0]

  return (
    <motion.div 
      ref={refGrid}
      onMouseMove={(e) => handleMouseMove(e, refGrid)}
      onMouseLeave={handleMouseLeave}
      className="group"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ 
        duration: 0.7, 
        ease: [0.22, 1, 0.36, 1], 
        delay: Math.min((index % 6) * 0.1, 0.5) 
      }}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d", transformPerspective: 1000 }}
    >
      <Link href={`/blog/${slug}`} className="block">
        <article className="h-full flex flex-col pt-6 border-t border-black/10 dark:border-white/10 group-hover:border-black/40 dark:group-hover:border-white/40 transition-colors duration-500">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="text-lg sm:text-xl font-display font-bold text-gray-400 dark:text-gray-500 group-hover:text-black dark:group-hover:text-white transition-colors tracking-tighter">
                {formattedDate}
              </div>
              {isPopular && (
                <span className="text-[0.65rem] font-bold px-2 py-0.5 rounded-full bg-peach/10 text-peach border border-peach/20 uppercase tracking-widest flex items-center gap-1 shadow-sm whitespace-nowrap">
                  <span className="text-xs leading-none">🔥</span> Popular
                </span>
              )}
            </div>
            <div className="text-xs text-gray-400 font-display uppercase tracking-widest">
              <ViewCounter slug={slug} trackView={false} staticViews={staticViews} />
            </div>
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
              {rank && (
                <div className="absolute top-3 left-3 w-10 h-10 rounded-full bg-white/30 dark:bg-black/40 backdrop-blur-md border border-white/40 dark:border-white/20 flex items-center justify-center text-xl font-display font-black shadow-lg text-black dark:text-white z-10 transition-transform group-hover:scale-110">
                  {rank}
                </div>
              )}
            </div>
          ) : (
            <div className={`${aspectClass} w-full relative bg-black/5 dark:bg-white/5 flex items-center justify-center group-hover:-translate-y-2 group-hover:shadow-[0_20px_40px_rgba(0,0,0,0.15)] dark:group-hover:shadow-[0_20px_40px_rgba(255,255,255,0.08)] transition-all duration-500 mt-2 rounded-sm`}>
              <span className="text-8xl max-w-full truncate px-4 opacity-10 dark:opacity-20 font-display font-bold text-gray-900 dark:text-white">
                {title.charAt(0)}
              </span>
              {rank && (
                <div className="absolute top-3 left-3 w-10 h-10 rounded-full bg-white/30 dark:bg-black/40 backdrop-blur-md border border-white/40 dark:border-white/20 flex items-center justify-center text-xl font-display font-black shadow-lg text-black dark:text-white z-10 transition-transform group-hover:scale-110">
                  {rank}
                </div>
              )}
            </div>
          )}
        </article>
      </Link>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {tags.slice(0, 3).map(tag => (
            <Link
              key={tag}
              href={`/blog/tag/${encodeURIComponent(tag)}`}
              className="text-[0.65rem] px-2 py-0.5 rounded-full border border-white/10 bg-white/5 text-gray-400 hover:text-peach hover:border-peach/40 transition-colors font-display"
            >
              #{tag}
            </Link>
          ))}
          {tags.length > 3 && (
            <span className="text-[0.65rem] px-2 py-0.5 text-gray-500 font-display">
              +{tags.length - 3}
            </span>
          )}
        </div>
      )}
    </motion.div>
  )
}

