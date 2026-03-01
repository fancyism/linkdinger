'use client'

import { useEffect, useState, useRef } from 'react'
import { Eye } from 'lucide-react'

export default function ViewCounter({
    slug,
    trackView = false,
    staticViews,
}: {
    slug: string
    trackView?: boolean
    staticViews?: number
}) {
    const [views, setViews] = useState<number | null>(staticViews ?? null)
    const hasFetched = useRef(false)

    useEffect(() => {
        if (staticViews !== undefined) {
            setViews(staticViews)
        }
    }, [staticViews])

    useEffect(() => {
        // Prevent strict mode double invoke and avoid fetching if static views exist
        if (staticViews !== undefined && !trackView) return
        if (hasFetched.current) return
        hasFetched.current = true

        const fetchViews = async () => {
            try {
                const url = process.env.NEXT_PUBLIC_UPSTASH_REDIS_REST_URL
                const token = process.env.NEXT_PUBLIC_UPSTASH_REDIS_REST_TOKEN

                if (!url || !token) {
                    console.warn('Upstash Redis credentials are not configured.')
                    setViews(0)
                    return
                }

                let currentViews = 0

                if (trackView) {
                    // Increment views
                    const res = await fetch(`${url}/incr/page_views:${slug}`, {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    })
                    if (res.ok) {
                        const data = await res.json()
                        currentViews = data.result ? parseInt(data.result, 10) : 0
                    }
                } else {
                    // Get views
                    const res = await fetch(`${url}/get/page_views:${slug}`, {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    })
                    if (res.ok) {
                        const data = await res.json()
                        // Upstash returns numerical value as string or directly if it's incr
                        currentViews = data.result ? parseInt(data.result, 10) : 0
                    }
                }

                setViews(currentViews)
            } catch (error) {
                console.error('Failed to get views', error)
                setViews(0)
            }
        }

        fetchViews()
    }, [slug, trackView, staticViews])

    if (views === null) return null // Hide while loading to prevent layout shift

    return (
        <span className="flex items-center gap-1.5 align-middle">
            <Eye size={14} className="opacity-70" />
            {views.toLocaleString()} {views === 1 ? 'view' : 'views'}
        </span>
    )
}
