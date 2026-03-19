'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'

interface TocItem {
    id: string
    text: string
    level: number
}

interface TableOfContentsProps {
    headings: TocItem[]
}

export default function TableOfContents({ headings }: TableOfContentsProps) {
    const t = useTranslations('TableOfContents')
    const [activeId, setActiveId] = useState<string>('')

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setActiveId(entry.target.id)
                    }
                })
            },
            { rootMargin: '-80px 0px -70% 0px' }
        )

        headings.forEach(({ id }) => {
            const el = document.getElementById(id)
            if (el) observer.observe(el)
        })

        return () => observer.disconnect()
    }, [headings])

    if (headings.length === 0) return null

    return (
        <nav className="glass-card sticky top-24 p-4" aria-label={t('ariaLabel')}>
            <h4 className="mb-3 text-sm font-display font-bold uppercase tracking-wider text-gray-400">
                {t('title')}
            </h4>
            <ul className="space-y-1">
                {headings.map(({ id, text, level }) => (
                    <li key={id}>
                        <a
                            href={`#${id}`}
                            className={`block py-1 text-sm transition-colors ${level === 3 ? 'pl-4' : 'pl-0'
                                } ${activeId === id
                                    ? 'font-medium text-peach'
                                    : 'text-gray-500 hover:text-gray-300'
                                }`}
                        >
                            {text}
                        </a>
                    </li>
                ))}
            </ul>
        </nav>
    )
}
