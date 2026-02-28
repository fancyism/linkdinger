'use client'

import Link from 'next/link'
import { useState } from 'react'

interface TagCloudProps {
    tags: Array<{ name: string; count: number }>
}

export default function TagCloud({ tags }: TagCloudProps) {
    const [isExpanded, setIsExpanded] = useState(false)
    const INITIAL_LIMIT = 12

    if (tags.length === 0) return null

    // Sort tags by count descending, then alphabetically
    const sortedTags = [...tags].sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count
        return a.name.localeCompare(b.name)
    })

    const maxCount = Math.max(...sortedTags.map(t => t.count))

    const getSize = (count: number) => {
        const ratio = count / maxCount
        if (ratio >= 0.7) return 'text-lg px-4 py-1.5'
        if (ratio >= 0.4) return 'text-sm px-3 py-1'
        return 'text-xs px-2.5 py-0.5'
    }

    const visibleTags = isExpanded ? sortedTags : sortedTags.slice(0, INITIAL_LIMIT)
    const hasMoreTags = sortedTags.length > INITIAL_LIMIT
    const remainingCount = sortedTags.length - INITIAL_LIMIT

    return (
        <div className="mb-10">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-display font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                    Popular Tags
                </h3>
                {hasMoreTags && (
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="text-xs font-display text-gray-500 hover:text-peach transition-colors"
                    >
                        {isExpanded ? 'Show less' : `View all ${sortedTags.length} tags`}
                    </button>
                )}
            </div>

            <div className="flex flex-wrap gap-2 items-center">
                {visibleTags.map(({ name, count }) => (
                    <Link
                        key={name}
                        href={`/blog/tag/${encodeURIComponent(name)}`}
                        className={`
                            ${getSize(count)}
                            inline-flex items-center gap-1.5
                            rounded-full border
                            border-black/5 dark:border-white/10
                            bg-black/5 dark:bg-white/5
                            text-gray-600 dark:text-gray-300
                            hover:border-peach/50 hover:text-peach hover:bg-peach/10
                            transition-all duration-300
                            font-display
                        `}
                    >
                        <span className="opacity-40">#</span>
                        {name}
                        <span className="text-[0.65em] opacity-40 ml-0.5">{count}</span>
                    </Link>
                ))}

                {hasMoreTags && !isExpanded && (
                    <button
                        onClick={() => setIsExpanded(true)}
                        className="
                            text-xs px-3 py-1.5
                            inline-flex items-center gap-1.5
                            rounded-full border border-dashed
                            border-black/20 dark:border-white/20
                            text-gray-500 dark:text-gray-400
                            hover:border-peach hover:text-peach
                            transition-all duration-300
                            font-display
                        "
                    >
                        +{remainingCount} more
                    </button>
                )}
            </div>
        </div>
    )
}
