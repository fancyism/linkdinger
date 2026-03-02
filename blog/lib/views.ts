import { Post } from './posts'

export interface PopularPost extends Post {
    _views: number
}

export async function getPopularPosts(posts: Post[], limit: number = 4): Promise<PopularPost[]> {
    const url = process.env.NEXT_PUBLIC_UPSTASH_REDIS_REST_URL || process.env.UPSTASH_REDIS_REST_URL
    const token = process.env.NEXT_PUBLIC_UPSTASH_REDIS_REST_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN

    const mapFallback = (): PopularPost[] => posts.slice(0, limit).map(p => ({ ...p, _views: 0 }))

    if (!url || !token || posts.length === 0) return mapFallback()

    try {
        const keys = posts.map(p => `page_views:${p.slug}`)
        const res = await fetch(`${url}/mget/${keys.join('/')}`, {
            headers: { Authorization: `Bearer ${token}` },
            next: { revalidate: 3600 } // Cache for 1 hour
        })

        if (res.ok) {
            const data = await res.json()
            const counts = data.result

            const postsWithViews: PopularPost[] = posts.map((post, index) => {
                return {
                    ...post,
                    _views: counts[index] ? parseInt(counts[index], 10) : 0
                }
            })

            // Sort by views descending
            const sorted = postsWithViews.sort((a, b) => (b._views || 0) - (a._views || 0))

            return sorted.slice(0, limit)
        }
    } catch (e) {
        console.error('Failed to fetch view counts for popular posts', e)
    }

    // Fallback if fetch fails
    return mapFallback()
}
