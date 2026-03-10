'use client'

import { useState } from 'react'
import { Link2, Twitter, Check, Linkedin, Facebook, MessageCircle } from 'lucide-react'

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
    const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
    const lineUrl = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(title)}`

    return (
        <div className="flex flex-wrap items-center gap-2">
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
                className="glass-button !p-2 !rounded-lg flex items-center gap-2 text-sm text-[#1DA1F2]"
                aria-label="Share on Twitter"
            >
                <Twitter size={16} />
                <span className="hidden sm:inline">Tweet</span>
            </a>
            <a
                href={linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="glass-button !p-2 !rounded-lg flex items-center gap-2 text-sm text-[#0077b5]"
                aria-label="Share on LinkedIn"
            >
                <Linkedin size={16} />
                <span className="hidden sm:inline">Share</span>
            </a>
            <a
                href={facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="glass-button !p-2 !rounded-lg flex items-center gap-2 text-sm text-[#1877f2]"
                aria-label="Share on Facebook"
            >
                <Facebook size={16} />
                <span className="sr-only">Facebook</span>
            </a>
            <a
                href={lineUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="glass-button !p-2 !rounded-lg flex items-center gap-2 text-sm text-[#00c300]"
                aria-label="Share on Line"
            >
                <MessageCircle size={16} />
                <span className="sr-only">Line</span>
            </a>
        </div>
    )
}

