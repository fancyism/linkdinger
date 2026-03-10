'use client'

import { useState } from 'react'

export default function NewsletterForm() {
    const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
    const buttondownUsername = 'linkdinger' // TODO: Replace with real Buttondown username

    // Using Buttondown's built-in form action (opens in new tab)
    return (
        <form
            action={`https://buttondown.com/api/emails/embed-subscribe/${buttondownUsername}`}
            method="post"
            target="popupwindow"
            onSubmit={() => {
                setStatus('submitting')
                window.open(`https://buttondown.com/${buttondownUsername}`, 'popupwindow')
                setTimeout(() => setStatus('success'), 1000)
            }}
            className="flex gap-2 max-w-md mx-auto sm:mx-0"
        >
            <input
                type="email"
                name="email"
                id="bd-email"
                required
                placeholder="your@email.com"
                className="glass-input text-sm flex-1"
                aria-label="Email for newsletter"
            />
            <button
                type="submit"
                disabled={status === 'submitting' || status === 'success'}
                className="brutal-btn whitespace-nowrap disabled:opacity-50"
            >
                {status === 'success' ? 'Subscribed!' : 'Subscribe'}
            </button>
        </form>
    )
}
