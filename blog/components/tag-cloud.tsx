'use client'

import Link from 'next/link'

interface TagCloudProps {
    tags: Array<{ name: string; count: number }>
}

export default function TagCloud({ tags }: TagCloudProps) {
    if (tags.length === 0) return null

    const maxCount = Math.max(...tags.map(t => t.count))

    const getSize = (count: number) => {
        const ratio = count / maxCount
        if (ratio >= 0.7) return 'text-lg px-4 py-1.5'
        if (ratio >= 0.4) return 'text-sm px-3 py-1'
        return 'text-xs px-2.5 py-0.5'
    }

    return (
        <div className="mb-10">
            <h3 className="text-sm font-display font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-4">
                Tags
            </h3>
            <div className="flex flex-wrap gap-2">
                {tags.map(({ name, count }) => (
                    <Link
                        key={name}
                        href={`/blog/tag/${encodeURIComponent(name)}`}
                        className={`
              ${getSize(count)}
              inline-flex items-center gap-1.5
              rounded-full border
              border-white/10 dark:border-white/10
              bg-white/5 dark:bg-white/5
              text-gray-600 dark:text-gray-300
              hover:border-peach/50 hover:text-peach hover:bg-peach/5
              transition-all duration-300
              font-display
            `}
                    >
                        <span className="opacity-40">#</span>
                        {name}
                        <span className="text-[0.65em] opacity-40 ml-0.5">{count}</span>
                    </Link>
                ))}
            </div>
        </div>
    )
}
