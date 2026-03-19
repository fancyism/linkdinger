'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import {
    Link2,
    Twitter,
    Check,
    Linkedin,
    Facebook,
    MessageCircle,
    Share2
} from 'lucide-react'

interface ShareButtonsProps {
    title: string
    url?: string
    excerpt?: string
    coverImage?: string
}

export default function ShareButtons({ title, url, excerpt }: ShareButtonsProps) {
    const t = useTranslations('ShareButtons')
    const [copied, setCopied] = useState(false)
    const [canShare, setCanShare] = useState(false)

    useEffect(() => {
        setCanShare(typeof navigator !== 'undefined' && 'share' in navigator)
    }, [])

    const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '')
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://linkdinger.com'
    const fullUrl = shareUrl.startsWith('http') ? shareUrl : `${siteUrl}${shareUrl}`

    const shareText = excerpt ? `${title}\n\n${excerpt}` : title

    const handleShare = async () => {
        try {
            if (canShare && navigator.share) {
                await navigator.share({
                    title,
                    text: excerpt || title,
                    url: fullUrl,
                })
                setCopied(true)
                setTimeout(() => setCopied(false), 2000)
            } else {
                await navigator.clipboard.writeText(fullUrl)
                setCopied(true)
                setTimeout(() => setCopied(false), 2000)
            }
        } catch (err) {
            if ((err as Error).name !== 'AbortError') {
                try {
                    await navigator.clipboard.writeText(fullUrl)
                    setCopied(true)
                    setTimeout(() => setCopied(false), 2000)
                } catch {
                    /* fallback */
                }
            }
        }
    }

    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(fullUrl)}`
    const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(fullUrl)}`
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullUrl)}`
    const lineUrl = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(fullUrl)}&text=${encodeURIComponent(shareText)}`

    return (
        <div className="flex flex-wrap items-center gap-2">
            <button
                onClick={handleShare}
                className="glass-button !rounded-lg !p-2 flex items-center gap-2 text-sm"
                aria-label={copied ? t('shared') : canShare ? t('share') : t('copyLink')}
            >
                {copied ? <Check size={16} /> : canShare ? <Share2 size={16} /> : <Link2 size={16} />}
                {copied ? t('shared') : canShare ? t('share') : t('copy')}
            </button>
            <a
                href={tweetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="glass-button !rounded-lg !p-2 flex items-center gap-2 text-sm text-[#1DA1F2]"
                aria-label={t('shareOnTwitter')}
            >
                <Twitter size={16} />
                <span className="hidden sm:inline">{t('tweet')}</span>
            </a>
            <a
                href={linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="glass-button !rounded-lg !p-2 flex items-center gap-2 text-sm text-[#0077b5]"
                aria-label={t('shareOnLinkedIn')}
            >
                <Linkedin size={16} />
                <span className="hidden sm:inline">{t('networkShare')}</span>
            </a>
            <a
                href={facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="glass-button !rounded-lg !p-2 flex items-center gap-2 text-sm text-[#1877f2]"
                aria-label={t('shareOnFacebook')}
            >
                <Facebook size={16} />
                <span className="sr-only">{t('facebook')}</span>
            </a>
            <a
                href={lineUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="glass-button !rounded-lg !p-2 flex items-center gap-2 text-sm text-[#00c300]"
                aria-label={t('shareOnLine')}
            >
                <MessageCircle size={16} />
                <span className="sr-only">{t('line')}</span>
            </a>
        </div>
    )
}
