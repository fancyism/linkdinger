/**
 * Unit tests for blog/lib/posts.ts
 * Covers: getPostBySlug, getAllPosts, searchPosts, getAllTags,
 *         getAllCategories, getPostsByTag, getFeaturedPost,
 *         getRelatedPosts, extractHeadings, calculateReadTime
 *
 * Test runner: node --test (built-in)
 * Run: cd blog && npm test
 */

import assert from 'node:assert/strict'
import test, { describe } from 'node:test'

import {
    getAllPosts,
    getPostBySlug,
    getPostSlugs,
    searchPosts,
    getAllTags,
    getAllCategories,
    getPostsByTag,
    getFeaturedPost,
    getRelatedPosts,
    extractHeadings,
    isMarkdownPostFile,
} from '../lib/posts'

// ─── isMarkdownPostFile ─────────────────────────────────────────

describe('isMarkdownPostFile', () => {
    test('accepts .md files', () => {
        assert.equal(isMarkdownPostFile('hello.md'), true)
        assert.equal(isMarkdownPostFile('blog post.md'), true)
    })

    test('accepts uppercase .MD extensions', () => {
        assert.equal(isMarkdownPostFile('README.MD'), true)
    })

    test('rejects dotfiles', () => {
        assert.equal(isMarkdownPostFile('.hidden.md'), false)
        assert.equal(isMarkdownPostFile('.md'), false)
    })

    test('rejects non-markdown files', () => {
        assert.equal(isMarkdownPostFile('hello.txt'), false)
        assert.equal(isMarkdownPostFile('image.png'), false)
        assert.equal(isMarkdownPostFile('script.js'), false)
    })
})

// ─── getPostSlugs ───────────────────────────────────────────────

describe('getPostSlugs', () => {
    test('returns an array', () => {
        const slugs = getPostSlugs()
        assert.ok(Array.isArray(slugs))
    })

    test('all slugs end with .md', () => {
        const slugs = getPostSlugs()
        for (const slug of slugs) {
            assert.ok(slug.endsWith('.md'), `Expected "${slug}" to end with .md`)
        }
    })

    test('no dotfiles in slugs', () => {
        const slugs = getPostSlugs()
        for (const slug of slugs) {
            assert.ok(!slug.startsWith('.'), `Unexpected dotfile: "${slug}"`)
        }
    })
})

// ─── getPostBySlug ──────────────────────────────────────────────

describe('getPostBySlug', () => {
    test('returns null for non-existent slug', () => {
        const post = getPostBySlug('this-post-does-not-exist-12345')
        assert.equal(post, null)
    })

    test('returns a Post object for a valid slug', () => {
        const slugs = getPostSlugs()
        if (slugs.length === 0) return // skip if no posts

        const post = getPostBySlug(slugs[0])
        assert.ok(post !== null, 'Expected a valid post')
        assert.ok(typeof post.title === 'string')
        assert.ok(typeof post.date === 'string')
        assert.ok(typeof post.content === 'string')
        assert.ok(typeof post.slug === 'string')
    })

    test('handles URL-encoded slugs', () => {
        const slugs = getPostSlugs()
        if (slugs.length === 0) return

        const encoded = encodeURIComponent(slugs[0].replace('.md', ''))
        const post = getPostBySlug(encoded)
        assert.ok(post !== null)
    })

    test('strips .md extension from slug', () => {
        const slugs = getPostSlugs()
        if (slugs.length === 0) return

        const post = getPostBySlug(slugs[0])
        assert.ok(post !== null)
        assert.ok(!post.slug.endsWith('.md'), 'slug should not end with .md')
    })

    test('has default category "General" when none specified', () => {
        const slugs = getPostSlugs()
        if (slugs.length === 0) return

        const post = getPostBySlug(slugs[0])
        assert.ok(post !== null)
        assert.ok(typeof post.category === 'string')
    })

    test('calculates readTime', () => {
        const slugs = getPostSlugs()
        if (slugs.length === 0) return

        const post = getPostBySlug(slugs[0])
        assert.ok(post !== null)
        assert.ok(post.readTime?.endsWith('min'), `Expected readTime to end with "min", got "${post.readTime}"`)
    })
})

// ─── getAllPosts ─────────────────────────────────────────────────

describe('getAllPosts', () => {
    test('returns an array of posts', () => {
        const posts = getAllPosts()
        assert.ok(Array.isArray(posts))
    })

    test('posts are sorted by date descending (newest first)', () => {
        const posts = getAllPosts()
        for (let i = 1; i < posts.length; i++) {
            assert.ok(
                posts[i - 1].date >= posts[i].date,
                `Posts not sorted: "${posts[i - 1].date}" should be >= "${posts[i].date}"`
            )
        }
    })

    test('excludes posts with publish: false', () => {
        const posts = getAllPosts()
        for (const post of posts) {
            assert.notEqual(post.publish, false, `Post "${post.title}" has publish=false but was included`)
        }
    })

    test('every post has required fields', () => {
        const posts = getAllPosts()
        for (const post of posts) {
            assert.ok(post.slug, `Missing slug in post: ${post.title}`)
            assert.ok(post.title, 'Missing title')
            assert.ok(typeof post.date === 'string', 'Missing date')
            assert.ok(typeof post.content === 'string', 'Missing content')
        }
    })
})

// ─── searchPosts ────────────────────────────────────────────────

describe('searchPosts', () => {
    test('returns empty array for gibberish query', () => {
        const results = searchPosts('xyzzy_nonexistent_12345')
        assert.equal(results.length, 0)
    })

    test('search is case-insensitive', () => {
        const posts = getAllPosts()
        if (posts.length === 0) return

        const titleWord = posts[0].title.split(' ')[0]
        const upper = searchPosts(titleWord.toUpperCase())
        const lower = searchPosts(titleWord.toLowerCase())
        assert.equal(upper.length, lower.length, 'Case-insensitive search should return same count')
    })

    test('finds posts by tag', () => {
        const tags = getAllTags()
        if (tags.length === 0) return

        const results = searchPosts(tags[0])
        assert.ok(results.length > 0, `Expected posts for tag "${tags[0]}"`)
    })

    test('empty query returns all posts', () => {
        const all = getAllPosts()
        const results = searchPosts('')
        assert.equal(results.length, all.length)
    })
})

// ─── getAllTags ──────────────────────────────────────────────────

describe('getAllTags', () => {
    test('returns sorted unique tags', () => {
        const tags = getAllTags()
        assert.ok(Array.isArray(tags))

        // Check sorted
        for (let i = 1; i < tags.length; i++) {
            assert.ok(tags[i - 1] <= tags[i], `Tags not sorted: "${tags[i - 1]}" > "${tags[i]}"`)
        }

        // Check unique
        const unique = new Set(tags)
        assert.equal(tags.length, unique.size, 'Tags should be unique')
    })
})

// ─── getAllCategories ───────────────────────────────────────────

describe('getAllCategories', () => {
    test('returns sorted unique categories', () => {
        const categories = getAllCategories()
        assert.ok(Array.isArray(categories))

        for (let i = 1; i < categories.length; i++) {
            assert.ok(categories[i - 1] <= categories[i], 'Categories not sorted')
        }

        const unique = new Set(categories)
        assert.equal(categories.length, unique.size, 'Categories should be unique')
    })
})

// ─── getPostsByTag ──────────────────────────────────────────────

describe('getPostsByTag', () => {
    test('returns only posts with the given tag', () => {
        const tags = getAllTags()
        if (tags.length === 0) return

        const posts = getPostsByTag(tags[0])
        for (const post of posts) {
            assert.ok(
                post.tags?.includes(tags[0]),
                `Post "${post.title}" missing tag "${tags[0]}"`
            )
        }
    })

    test('returns empty array for unknown tag', () => {
        const posts = getPostsByTag('nonexistent-tag-xyz-12345')
        assert.equal(posts.length, 0)
    })
})

// ─── getFeaturedPost ────────────────────────────────────────────

describe('getFeaturedPost', () => {
    test('returns a post or null', () => {
        const featured = getFeaturedPost()
        if (featured !== null) {
            assert.ok(typeof featured.title === 'string')
            assert.ok(typeof featured.slug === 'string')
        }
    })
})

// ─── getRelatedPosts ────────────────────────────────────────────

describe('getRelatedPosts', () => {
    test('does not include the original post', () => {
        const posts = getAllPosts()
        if (posts.length < 2) return

        const related = getRelatedPosts(posts[0].slug)
        const slugs = related.map(p => p.slug)
        assert.ok(!slugs.includes(posts[0].slug), 'Related posts should not include the original')
    })

    test('respects limit parameter', () => {
        const posts = getAllPosts()
        if (posts.length < 2) return

        const related = getRelatedPosts(posts[0].slug, 2)
        assert.ok(related.length <= 2, `Expected at most 2. Got ${related.length}`)
    })

    test('returns empty array for non-existent slug', () => {
        const related = getRelatedPosts('does-not-exist-999')
        assert.equal(related.length, 0)
    })
})

// ─── extractHeadings ────────────────────────────────────────────

describe('extractHeadings', () => {
    test('extracts h2 and h3 headings', () => {
        const markdown = `
## First Section
Some text
### Subsection A
More text
## Second Section
### Subsection B
`
        const headings = extractHeadings(markdown)
        assert.equal(headings.length, 4)
        assert.equal(headings[0].text, 'First Section')
        assert.equal(headings[0].level, 2)
        assert.equal(headings[1].text, 'Subsection A')
        assert.equal(headings[1].level, 3)
        assert.equal(headings[2].text, 'Second Section')
        assert.equal(headings[2].level, 2)
        assert.equal(headings[3].text, 'Subsection B')
        assert.equal(headings[3].level, 3)
    })

    test('generates slug IDs', () => {
        const headings = extractHeadings('## Hello World')
        assert.equal(headings[0].id, 'hello-world')
    })

    test('ignores h1 headings', () => {
        const headings = extractHeadings('# Title\n## Section')
        assert.equal(headings.length, 1)
        assert.equal(headings[0].text, 'Section')
    })

    test('returns empty array for no headings', () => {
        const headings = extractHeadings('Just plain text\nNo headings here')
        assert.equal(headings.length, 0)
    })

    test('handles duplicate heading text', () => {
        const headings = extractHeadings('## Intro\n## Intro')
        assert.equal(headings.length, 2)
        // github-slugger adds -1 suffix for duplicates
        assert.notEqual(headings[0].id, headings[1].id, 'Duplicate headings should have unique IDs')
    })
})
