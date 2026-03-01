import Link from 'next/link'

export const metadata = {
    title: 'Page Not Found',
    description: 'The page you are looking for does not exist.',
    robots: { index: false, follow: false },
}

export default function NotFound() {
    return (
        <section className="py-24 px-4 sm:px-6 flex items-center justify-center min-h-[60vh]">
            <div className="text-center max-w-md">
                <h1 className="text-8xl font-display font-black text-peach mb-4">404</h1>
                <h2 className="text-2xl font-display font-bold mb-4 text-gray-900 dark:text-white">
                    Page Not Found
                </h2>
                <p className="text-gray-400 mb-8 font-light">
                    The page you&apos;re looking for doesn&apos;t exist or has been moved.
                </p>
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-peach text-black font-display font-bold rounded-lg hover:bg-peach/90 transition-colors"
                >
                    ← Back to Home
                </Link>
            </div>
        </section>
    )
}
