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

export interface TocItem {
  id: string
  text: string
  level: number
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
    .filter((post): post is Post => post !== null && post.publish !== false)
    .sort((a, b) => (a.date > b.date ? -1 : 1))

  return posts
}

export function getFeaturedPost(): Post | null {
  const posts = getAllPosts()
  // Return first post with cover image, or just the latest
  return posts.find(p => p.coverImage) || posts[0] || null
}

export function getRelatedPosts(slug: string, limit = 3): Post[] {
  const current = getPostBySlug(slug)
  if (!current) return []

  const all = getAllPosts().filter(p => p.slug !== slug)

  // Score by shared tags
  const scored = all.map(p => ({
    post: p,
    score: (p.tags || []).filter(t => (current.tags || []).includes(t)).length,
  }))

  scored.sort((a, b) => b.score - a.score)
  return scored.slice(0, limit).map(s => s.post)
}

export function getAllTags(): string[] {
  const posts = getAllPosts()
  const tagSet = new Set<string>()
  posts.forEach(p => p.tags?.forEach(t => tagSet.add(t)))
  return Array.from(tagSet).sort()
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

export function extractHeadings(content: string): TocItem[] {
  const headingRegex = /^(#{2,3})\s+(.+)$/gm
  const headings: TocItem[] = []
  let match

  while ((match = headingRegex.exec(content)) !== null) {
    const text = match[2].trim()
    const id = text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

    headings.push({
      id,
      text,
      level: match[1].length,
    })
  }

  return headings
}
