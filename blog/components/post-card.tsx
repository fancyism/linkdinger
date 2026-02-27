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
}

export default function PostCard({ 
  slug, 
  title, 
  date, 
  excerpt, 
  tags = [], 
  readTime = '5 min',
  coverImage 
}: PostCardProps) {
  return (
    <Link href={`/blog/${slug}`}>
      <article className="glass-card overflow-hidden group cursor-pointer hover:border-peach/30 transition-all duration-300">
        {coverImage && (
          <div className="aspect-video relative overflow-hidden">
            <img 
              src={coverImage} 
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-dark to-transparent opacity-60" />
          </div>
        )}
        
        <div className="p-6">
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
            <time>{date}</time>
            <span>·</span>
            <span>{readTime} read</span>
          </div>
          
          <h2 className="text-xl font-display font-bold mb-2 group-hover:text-peach transition-colors">
            {title}
          </h2>
          
          <p className="text-gray-400 mb-4 line-clamp-2">
            {excerpt}
          </p>
          
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <BrutalTag key={tag}>{tag}</BrutalTag>
              ))}
            </div>
          )}
        </div>
      </article>
    </Link>
  )
}
