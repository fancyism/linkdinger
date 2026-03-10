'use client'

import { useState, useEffect } from 'react'
import { SmilePlus } from 'lucide-react'

interface ReactionsProps {
    slug: string
}

const EMOJIS = [
    { id: 'thumbsup', emoji: '👍', label: 'Like' },
    { id: 'fire', emoji: '🔥', label: 'Hot' },
    { id: 'heart', emoji: '❤️', label: 'Love' },
    { id: 'mindblown', emoji: '🤯', label: 'Mind Blown' },
]

export default function Reactions({ slug }: ReactionsProps) {
    const [counts, setCounts] = useState<Record<string, number>>({})
    const [userReactions, setUserReactions] = useState<Record<string, boolean>>({})
    const [mounted, setMounted] = useState(false)

    // Load initial counts (mock global + precise local)
    useEffect(() => {
        setMounted(true)
        const localData = localStorage.getItem(`reactions_${slug}`)
        const localReactions = localData ? JSON.parse(localData) : {}
        setUserReactions(localReactions)

        // Mock base counts using a pseudo-random seed based on slug
        const seed = slug.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
        setCounts({
            thumbsup: (seed % 20) + (localReactions.thumbsup ? 1 : 0),
            fire: (seed % 15) + (localReactions.fire ? 1 : 0),
            heart: (seed % 30) + (localReactions.heart ? 1 : 0),
            mindblown: (seed % 10) + (localReactions.mindblown ? 1 : 0),
        })
    }, [slug])

    const handleReact = (id: string) => {
        const hasReacted = userReactions[id]
        const newLocalReactions = { ...userReactions, [id]: !hasReacted }

        setUserReactions(newLocalReactions)
        setCounts(prev => ({
            ...prev,
            [id]: prev[id] + (hasReacted ? -1 : 1)
        }))

        localStorage.setItem(`reactions_${slug}`, JSON.stringify(newLocalReactions))
    }

    if (!mounted) return <div className="animate-pulse h-12 glass-card rounded-full w-64 mx-auto mb-10"></div>

    return (
        <div className="flex flex-col items-center mb-10">
            <div className="flex items-center gap-2 mb-3 text-sm text-gray-400 font-display uppercase tracking-widest">
                <SmilePlus size={14} />
                <span>React to this post</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
                {EMOJIS.map(item => (
                    <button
                        key={item.id}
                        onClick={() => handleReact(item.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full font-display font-medium text-sm transition-all duration-200
                            ${userReactions[item.id]
                                ? 'bg-peach/20 border-peach/50 text-peach shadow-[0_0_15px_rgba(255,107,53,0.2)]'
                                : 'glass-card hover:bg-white/5 dark:hover:bg-white/5 border-glass-border hover:border-peach/30 text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'
                            }`}
                        aria-label={item.label}
                    >
                        <span className="text-lg">{item.emoji}</span>
                        <span>{counts[item.id] || 0}</span>
                    </button>
                ))}
            </div>
        </div>
    )
}
