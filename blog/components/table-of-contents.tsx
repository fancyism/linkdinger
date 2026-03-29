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
            <h4 className="mb-3 text-sm font-display font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400">
                {t('title')}
            </h4>
            <ul className="space-y-1">
                {headings.map(({ id, text, level }) => (
                    <li key={id} className={level === 3 ? 'ml-2' : ''}>
                        <a
                            href={`#${id}`}
                            aria-current={activeId === id ? 'location' : undefined}
                            className={`relative block rounded-lg py-1.5 pr-2 text-sm transition-all ${level === 3 ? 'pl-7 text-[0.92rem]' : 'pl-0'
                                } ${activeId === id
                                    ? 'bg-peach/[0.10] pl-3 font-semibold text-peach shadow-[inset_0_0_0_1px_rgba(255,107,53,0.16)] dark:bg-peach/[0.12]'
                                    : 'text-slate-500 hover:bg-black/[0.03] hover:text-slate-700 dark:text-gray-500 dark:hover:bg-white/[0.03] dark:hover:text-gray-300'
                                }`}
                        >
                            {activeId === id && (
                                <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-full bg-peach" />
                            )}
                            {level === 3 && (
                                <span className={`absolute left-3 top-1/2 h-px w-2 -translate-y-1/2 rounded-full transition-colors ${activeId === id ? 'bg-peach/80' : 'bg-slate-300 dark:bg-white/12'}`} />
                            )}
                            {text}
                        </a>
                    </li>
                ))}
            </ul>
        </nav>
    )
}
