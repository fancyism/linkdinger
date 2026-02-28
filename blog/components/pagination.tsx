import Link from 'next/link'

interface PaginationProps {
    currentPage: number
    totalPages: number
    basePath: string
}

export default function Pagination({ currentPage, totalPages, basePath }: PaginationProps) {
    if (totalPages <= 1) return null

    const getPageUrl = (pageNumber: number) => {
        if (pageNumber === 1) return '/'
        // Assumes root-level pagination uses /page/N
        return `/page/${pageNumber}`
    }

    return (
        <div className="flex justify-between items-center mt-8 px-4 w-full">
            {currentPage > 1 ? (
                <Link
                    href={getPageUrl(currentPage - 1)}
                    className="px-6 py-2 rounded-full border border-black/10 dark:border-white/10 text-gray-900 dark:text-white font-display font-medium hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                    Previous
                </Link>
            ) : (
                <span className="px-6 py-2 rounded-full border border-black/10 dark:border-white/10 text-gray-900/30 dark:text-white/30 font-display font-medium cursor-not-allowed">
                    Previous
                </span>
            )}

            <span className="text-sm text-gray-500 font-display">
                Page {currentPage} of {totalPages}
            </span>

            {currentPage < totalPages ? (
                <Link
                    href={getPageUrl(currentPage + 1)}
                    className="px-6 py-2 rounded-full border border-black/10 dark:border-white/10 text-gray-900 dark:text-white font-display font-medium hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                    Next
                </Link>
            ) : (
                <span className="px-6 py-2 rounded-full border border-black/10 dark:border-white/10 text-gray-900/30 dark:text-white/30 font-display font-medium cursor-not-allowed">
                    Next
                </span>
            )}
        </div>
    )
}
