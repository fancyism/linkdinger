// Script to generate sitemap.xml at build time
// Run: node scripts/generate-sitemap.mjs

import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
const postsDir = path.join(process.cwd(), 'content/posts')
const publicDir = path.join(process.cwd(), 'public')

function getAllPostSlugs() {
    if (!fs.existsSync(postsDir)) return []
    return fs.readdirSync(postsDir)
        .filter(file => file.endsWith('.md'))
        .map(file => {
            const content = fs.readFileSync(path.join(postsDir, file), 'utf8')
            const { data } = matter(content)
            // Skip unpublished posts
            if (data.publish === false) return null
            return {
                slug: file.replace(/\.md$/, ''),
                date: data.date instanceof Date
                    ? data.date.toISOString().split('T')[0]
                    : (data.date || new Date().toISOString().split('T')[0]),
            }
        })
        .filter(Boolean)
}

function generateSitemap() {
    const posts = getAllPostSlugs()
    const today = new Date().toISOString().split('T')[0]

    const staticPages = [
        { url: '/', changefreq: 'weekly', priority: '1.0', lastmod: today },
        { url: '/blog/', changefreq: 'daily', priority: '0.9', lastmod: today },
        { url: '/about/', changefreq: 'monthly', priority: '0.5', lastmod: today },
    ]

    const postPages = posts.map(post => ({
        url: `/blog/${encodeURIComponent(post.slug)}/`,
        changefreq: 'monthly',
        priority: '0.7',
        lastmod: post.date,
    }))

    const allPages = [...staticPages, ...postPages]

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages.map(page => `  <url>
    <loc>${SITE_URL}${page.url}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
</urlset>`

    fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), xml, 'utf8')
    console.log(`✅ Sitemap generated with ${allPages.length} URLs → public/sitemap.xml`)
}

generateSitemap()
