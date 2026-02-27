'use client'

import { useState } from 'react'
import { Link2, Twitter, Check } from 'lucide-react'

interface ShareButtonsProps {
    title: string
    url?: string
}

export default function ShareButtons({ title, url }: ShareButtonsProps) {
    const [copied, setCopied] = useState(false)

    const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '')

    const copyLink = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch {
            /* fallback */
        }
    }

    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        title
    )}&url=${encodeURIComponent(shareUrl)}`

    return (
        <div className="flex items-center gap-2">
            <button
                onClick={copyLink}
                className="glass-button !p-2 !rounded-lg flex items-center gap-2 text-sm"
                aria-label="Copy link"
            >
                {copied ? <Check size={16} /> : <Link2 size={16} />}
                {copied ? 'Copied!' : 'Copy'}
            </button>
            <a
                href={tweetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="glass-button !p-2 !rounded-lg flex items-center gap-2 text-sm"
                aria-label="Share on Twitter"
            >
                <Twitter size={16} />
                Tweet
            </a>
        </div>
    )
}
