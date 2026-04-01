'use client'

import { useEffect, useRef } from 'react'

/**
 * ProseEnhancer — zero hardcoded params.
 *
 * Mounts inside the article wrapper and walks every <pre> node it finds via
 * DOM traversal (a linked-list walk: node → nextElementSibling). For each
 * block it injects:
 *   • a language pill (detected from the highlight.js class)
 *   • a Copy Code button  (clipboard API with fallback)
 *   • a Word Wrap toggle  (toggles `white-space: pre` ↔ `pre-wrap`)
 *
 * All state is stored in the DOM node itself (data-wrap attribute) so React
 * re-renders never undo the enhancements.
 */
export default function ProseEnhancer() {
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        // Walk up to the nearest article element from our sentinel div.
        const sentinel = containerRef.current
        if (!sentinel) return
        const article = sentinel.closest('article') ?? sentinel.parentElement
        if (!article) return

        // Linked-list traversal: collect every <pre> in the article.
        const preNodes: HTMLPreElement[] = Array.from(
            article.querySelectorAll('pre'),
        )

        preNodes.forEach((pre) => {
            // Skip if already enhanced (idempotent).
            if (pre.dataset.enhanced === '1') return
            pre.dataset.enhanced = '1'

            // Detect language from highlight.js class on the inner <code>.
            const code = pre.querySelector('code')
            const langClass = code
                ? Array.from(code.classList).find((c) => c.startsWith('language-'))
                : null
            const lang = langClass ? langClass.replace('language-', '') : null

            // ── Wrap pre in a positioned container ──
            const wrapper = document.createElement('div')
            wrapper.className = 'code-block-wrapper'
            pre.parentNode?.insertBefore(wrapper, pre)
            wrapper.appendChild(pre)

            // ── Header bar ──
            const header = document.createElement('div')
            header.className = 'code-block-header'

            // Language pill
            const pill = document.createElement('span')
            pill.className = 'code-lang-pill'
            pill.textContent = lang ?? 'code'
            header.appendChild(pill)

            // Button group (right-aligned)
            const btnGroup = document.createElement('div')
            btnGroup.className = 'code-btn-group'

            // ── Word Wrap toggle button ──
            const wrapBtn = document.createElement('button')
            wrapBtn.type = 'button'
            wrapBtn.className = 'code-action-btn'
            wrapBtn.setAttribute('aria-label', 'Toggle word wrap')
            wrapBtn.setAttribute('title', 'Toggle word wrap')
            wrapBtn.innerHTML = wrapIcon
            let wrapped = false
            wrapBtn.addEventListener('click', () => {
                wrapped = !wrapped
                if (code) {
                    code.style.whiteSpace = wrapped ? 'pre-wrap' : 'pre'
                    code.style.wordBreak = wrapped ? 'break-word' : 'normal'
                }
                pre.style.overflowX = wrapped ? 'hidden' : 'auto'
                wrapBtn.classList.toggle('code-action-btn--active', wrapped)
                wrapBtn.setAttribute(
                    'aria-label',
                    wrapped ? 'Disable word wrap' : 'Enable word wrap',
                )
            })
            btnGroup.appendChild(wrapBtn)

            // ── Copy button ──
            const copyBtn = document.createElement('button')
            copyBtn.type = 'button'
            copyBtn.className = 'code-action-btn'
            copyBtn.setAttribute('aria-label', 'Copy code')
            copyBtn.setAttribute('title', 'Copy code')
            copyBtn.innerHTML = copyIcon
            let copyTimer: ReturnType<typeof setTimeout> | null = null
            copyBtn.addEventListener('click', () => {
                const text = code?.textContent ?? pre.textContent ?? ''
                const doCopy = (success: boolean) => {
                    if (success) {
                        copyBtn.innerHTML = checkIcon
                        copyBtn.classList.add('code-action-btn--copied')
                        if (copyTimer) clearTimeout(copyTimer)
                        copyTimer = setTimeout(() => {
                            copyBtn.innerHTML = copyIcon
                            copyBtn.classList.remove('code-action-btn--copied')
                        }, 2000)
                    }
                }
                if (navigator.clipboard?.writeText) {
                    navigator.clipboard.writeText(text).then(() => doCopy(true)).catch(() => {})
                } else {
                    // fallback for older browsers / insecure origins
                    try {
                        const ta = document.createElement('textarea')
                        ta.value = text
                        ta.style.position = 'fixed'
                        ta.style.opacity = '0'
                        document.body.appendChild(ta)
                        ta.select()
                        document.execCommand('copy')
                        document.body.removeChild(ta)
                        doCopy(true)
                    } catch {}
                }
            })
            btnGroup.appendChild(copyBtn)

            header.appendChild(btnGroup)
            wrapper.insertBefore(header, pre)
        })
    }, [])

    // Sentinel div — invisible, just anchors the ref so we can find article.
    return <div ref={containerRef} aria-hidden style={{ display: 'none' }} />
}

// ── SVG icons (inline, no extra dependencies) ──

const wrapIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <polyline points="17 1 21 5 17 9"/>
  <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
  <polyline points="7 23 3 19 7 15"/>
  <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
</svg>`

const copyIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
  <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
</svg>`

const checkIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <path d="M20 6 9 17l-5-5"/>
</svg>`
