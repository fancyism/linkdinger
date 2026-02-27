'use client'

import { useEffect, useState } from 'react'

interface TocItem {
    id: string
    text: string
    level: number
}

interface TableOfContentsProps {
    headings: TocItem[]
}

export default function TableOfContents({ headings }: TableOfContentsProps) {
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
        <nav className="glass-card p-4 sticky top-24" aria-label="Table of contents">
            <h4 className="font-display font-bold text-sm uppercase tracking-wider mb-3 text-gray-400">
                On this page
            </h4>
            <ul className="space-y-1">
                {headings.map(({ id, text, level }) => (
                    <li key={id}>
                        <a
                            href={`#${id}`}
                            className={`block text-sm py-1 transition-colors ${level === 3 ? 'pl-4' : 'pl-0'
                                } ${activeId === id
                                    ? 'text-peach font-medium'
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
