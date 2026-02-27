'use client'

export default function NewsletterForm() {
    return (
        <form onSubmit={(e) => e.preventDefault()} className="flex gap-2 max-w-md mx-auto">
            <input
                type="email"
                placeholder="your@email.com"
                className="glass-input text-sm flex-1"
                aria-label="Email for newsletter"
            />
            <button type="submit" className="glass-button text-sm whitespace-nowrap">
                Subscribe
            </button>
        </form>
    )
}
