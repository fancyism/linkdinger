'use client'

import { useTheme } from 'next-themes'
import { useEffect, useRef } from 'react'

export default function GiscusComments() {
    const { resolvedTheme } = useTheme()
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!ref.current || ref.current.hasChildNodes()) return

        const scriptElem = document.createElement('script')
        scriptElem.src = 'https://giscus.app/client.js'
        scriptElem.async = true
        scriptElem.crossOrigin = 'anonymous'

        // TODO: Replace with real Giscus values from giscus.app
        scriptElem.setAttribute('data-repo', 'fancyism/linkdinger')
        scriptElem.setAttribute('data-repo-id', 'PLACEHOLDER')
        scriptElem.setAttribute('data-category', 'Announcements')
        scriptElem.setAttribute('data-category-id', 'PLACEHOLDER')
        scriptElem.setAttribute('data-mapping', 'pathname')
        scriptElem.setAttribute('data-strict', '0')
        scriptElem.setAttribute('data-reactions-enabled', '1')
        scriptElem.setAttribute('data-emit-metadata', '0')
        scriptElem.setAttribute('data-input-position', 'bottom')
        scriptElem.setAttribute('data-lang', 'en')

        // Sync theme
        const theme = resolvedTheme === 'dark' ? 'transparent_dark' : 'light'
        scriptElem.setAttribute('data-theme', theme)

        ref.current.appendChild(scriptElem)
    }, [])

    // Update theme dynamically
    useEffect(() => {
        const iframe = document.querySelector<HTMLIFrameElement>('iframe.giscus-frame')
        if (!iframe) return

        const theme = resolvedTheme === 'dark' ? 'transparent_dark' : 'light'
        iframe.contentWindow?.postMessage(
            { giscus: { setConfig: { theme } } },
            'https://giscus.app'
        )
    }, [resolvedTheme])

    return (
        <div className="mt-10">
            <h2 className="text-2xl font-display font-bold mb-6">Comments</h2>
            <div ref={ref} className="min-h-[300px]" />
        </div>
    )
}
