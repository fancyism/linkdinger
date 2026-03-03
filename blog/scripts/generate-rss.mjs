// Script to generate rss.xml at build time
// Run: node scripts/generate-rss.mjs

import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
const SITE_TITLE = 'Linkdinger — AI Tools & Thoughts'
const SITE_DESCRIPTION = 'AI-powered tools and thoughts. Every commit lands on GitHub for you to fork & remix.'

const postsDir = path.join(process.cwd(), 'content/posts')
const publicDir = path.join(process.cwd(), 'public')

function escapeXml(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;')
}

function toRFC822Date(dateStr) {
    const date = new Date(dateStr)
    return date.toUTCString()
}

function getAllPublishedPosts() {
    if (!fs.existsSync(postsDir)) return []
    return fs.readdirSync(postsDir)
        .filter(file => file.endsWith('.md'))
        .map(file => {
            const content = fs.readFileSync(path.join(postsDir, file), 'utf8')
            const { data } = matter(content)
            if (data.publish === false) return null
            const slug = file.replace(/\.md$/, '')
            const dateStr = data.date instanceof Date
                ? data.date.toISOString().split('T')[0]
                : (data.date || new Date().toISOString().split('T')[0])
            return {
                title: data.title || 'Untitled',
                slug,
                date: dateStr,
                excerpt: data.excerpt || '',
                category: data.category || '',
            }
        })
        .filter(Boolean)
        .sort((a, b) => (a.date > b.date ? -1 : 1))
}

function generateRss() {
    const posts = getAllPublishedPosts()
    const buildDate = new Date().toUTCString()

    const items = posts.map(post => `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${SITE_URL}/blog/${encodeURIComponent(post.slug)}/</link>
      <guid isPermaLink="true">${SITE_URL}/blog/${encodeURIComponent(post.slug)}/</guid>
      <description>${escapeXml(post.excerpt)}</description>
      <pubDate>${toRFC822Date(post.date)}</pubDate>${post.category ? `\n      <category>${escapeXml(post.category)}</category>` : ''}
    </item>`).join('\n')

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(SITE_TITLE)}</title>
    <link>${SITE_URL}</link>
    <description>${escapeXml(SITE_DESCRIPTION)}</description>
    <language>en</language>
    <lastBuildDate>${buildDate}</lastBuildDate>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`

    fs.writeFileSync(path.join(publicDir, 'rss.xml'), xml, 'utf8')
    console.log(`✅ RSS feed generated with ${posts.length} posts → public/rss.xml`)
}

generateRss()
