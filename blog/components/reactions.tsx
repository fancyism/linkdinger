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

// Storage key for all reactions across all posts
const STORAGE_KEY = 'linkdinger_reactions'

// Get all reactions from localStorage
function getAllReactions(): Record<string, Record<string, number>> {
    if (typeof window === 'undefined') return {}
    try {
        const data = localStorage.getItem(STORAGE_KEY)
        return data ? JSON.parse(data) : {}
    } catch {
        return {}
    }
}

// Get user's reaction state for a specific post
function getUserReactions(slug: string): Record<string, boolean> {
    const allReactions = getAllReactions()
    const postReactions = allReactions[slug] || {}
    
    // Convert counts to boolean (user has reacted if count > 0)
    const userState: Record<string, boolean> = {}
    EMOJIS.forEach(emoji => {
        userState[emoji.id] = (postReactions[emoji.id] || 0) > 0
    })
    return userState
}

// Get total counts for a specific post
function getPostCounts(slug: string): Record<string, number> {
    const allReactions = getAllReactions()
    return allReactions[slug] || {}
}

export default function Reactions({ slug }: ReactionsProps) {
    const [counts, setCounts] = useState<Record<string, number>>({})
    const [userReactions, setUserReactions] = useState<Record<string, boolean>>({})
    const [mounted, setMounted] = useState(false)

    // Load real data from localStorage
    useEffect(() => {
        setMounted(true)
        
        // Load user's reaction state
        const userState = getUserReactions(slug)
        setUserReactions(userState)
        
        // Load counts (only this user's reactions since we don't have a backend)
        const postCounts = getPostCounts(slug)
        setCounts(postCounts)
    }, [slug])

    const handleReact = (id: string) => {
        const hasReacted = userReactions[id]
        
        // Update user reactions
        const newUserReactions = { ...userReactions, [id]: !hasReacted }
        setUserReactions(newUserReactions)
        
        // Update counts
        const newCounts = { ...counts }
        if (hasReacted) {
            newCounts[id] = Math.max(0, (newCounts[id] || 1) - 1)
        } else {
            newCounts[id] = (newCounts[id] || 0) + 1
        }
        setCounts(newCounts)
        
        // Save to localStorage
        const allReactions = getAllReactions()
        allReactions[slug] = newCounts
        localStorage.setItem(STORAGE_KEY, JSON.stringify(allReactions))
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
