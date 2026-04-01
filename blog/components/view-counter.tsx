'use client'

import { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
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
    const t = useTranslations('ViewCounter')
    const [views, setViews] = useState<number | null>(staticViews ?? null)
    const hasFetched = useRef(false)

    useEffect(() => {
        if (staticViews !== undefined) {
            setViews(staticViews)
        }
    }, [staticViews])

    useEffect(() => {
        if (staticViews !== undefined && !trackView) return
        if (hasFetched.current) return
        hasFetched.current = true

        const fetchViews = async () => {
            try {
                let currentViews = 0

                // Use origin-absolute URL so next-intl locale middleware
                // does not rewrite /api/views/* under the /en/ prefix.
                const apiBase = typeof window !== 'undefined'
                    ? window.location.origin
                    : ''
                if (trackView) {
                    const res = await fetch(`${apiBase}/api/views/${slug}`, {
                        method: 'POST',
                    })
                    if (res.ok) {
                        const data = await res.json()
                        currentViews = data.views ?? 0
                    }
                } else {
                    const res = await fetch(`${apiBase}/api/views/${slug}`, {
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

    if (views === null) return null

    return (
        <span className="flex items-center gap-1.5 align-middle">
            <Eye size={14} className="opacity-70" />
            {t('views', { count: views })}
        </span>
    )
}
