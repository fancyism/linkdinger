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
                let currentViews = 0

                if (trackView) {
                    // Increment views
                    const res = await fetch(`/api/views/${slug}`, {
                        method: 'POST',
                    })
                    if (res.ok) {
                        const data = await res.json()
                        currentViews = data.views ?? 0
                    }
                } else {
                    // Get views
                    const res = await fetch(`/api/views/${slug}`, {
                        method: 'GET',
                    })
                    if (res.ok) {
                        const data = await res.json()
                        currentViews = data.views ?? 0
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
