import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

const postsDirectory = path.join(process.cwd(), 'content/posts')

export interface Post {
  slug: string
  title: string
  date: string
  excerpt: string
  content: string
  tags?: string[]
  readTime?: string
  coverImage?: string
  publish?: boolean
}

function calculateReadTime(content: string): string {
  const wordsPerMinute = 200
  const words = content.split(/\s+/).length
  const minutes = Math.ceil(words / wordsPerMinute)
  return `${minutes} min`
}

export function getPostSlugs(): string[] {
  if (!fs.existsSync(postsDirectory)) {
    return []
  }
  return fs.readdirSync(postsDirectory).filter(file => file.endsWith('.md'))
}

export function getPostBySlug(slug: string): Post | null {
  const realSlug = slug.replace(/\.md$/, '')
  const fullPath = path.join(postsDirectory, `${realSlug}.md`)
  
  if (!fs.existsSync(fullPath)) {
    return null
  }
  
  const fileContents = fs.readFileSync(fullPath, 'utf8')
  const { data, content } = matter(fileContents)
  
  return {
    slug: realSlug,
    title: data.title || 'Untitled',
    date: data.date || '',
    excerpt: data.excerpt || content.slice(0, 150) + '...',
    content,
    tags: data.tags || [],
    readTime: calculateReadTime(content),
    coverImage: data.coverImage,
    publish: data.publish ?? true,
  }
}

export function getAllPosts(): Post[] {
  const slugs = getPostSlugs()
  const posts = slugs
    .map(slug => getPostBySlug(slug))
    .filter((post): post is Post => post !== null && post.publish)
    .sort((a, b) => (a.date > b.date ? -1 : 1))
  
  return posts
}

export function getPostsByTag(tag: string): Post[] {
  return getAllPosts().filter(post => post.tags?.includes(tag))
}

export function searchPosts(query: string): Post[] {
  const lowerQuery = query.toLowerCase()
  return getAllPosts().filter(post => 
    post.title.toLowerCase().includes(lowerQuery) ||
    post.excerpt.toLowerCase().includes(lowerQuery) ||
    post.content.toLowerCase().includes(lowerQuery) ||
    post.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
  )
}
