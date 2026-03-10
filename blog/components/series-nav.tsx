'use client'

import Link from 'next/link'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import type { Post } from '@/lib/posts'

interface SeriesNavProps {
    adjacent: {
        prev: Post | null
        next: Post | null
    }
}

export default function SeriesNav({ adjacent }: SeriesNavProps) {
    if (!adjacent.prev && !adjacent.next) return null

    return (
        <div className="border-t border-b border-white/5 py-8 my-10 relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 glass text-xs font-display tracking-widest text-[#FF6B35] uppercase rounded-full">
                Continuing the Series
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Previous (Older) Post */}
                <div className="flex flex-col items-start text-left">
                    {adjacent.prev && (
                        <Link
                            href={`/blog/${adjacent.prev.slug}`}
                            className="group flex flex-col gap-2 p-4 w-full rounded-2xl glass-card hover:border-[#FF6B35]/30 transition-all"
                        >
                            <span className="text-xs font-display text-gray-500 uppercase flex items-center gap-1 group-hover:text-[#FF6B35] transition-colors">
                                <ArrowLeft size={12} className="group-hover:-translate-x-1 transition-transform" />
                                Previous
                            </span>
                            <span className="font-medium text-sm line-clamp-2 md:line-clamp-1">{adjacent.prev.title}</span>
                        </Link>
                    )}
                </div>

                {/* Next (Newer) Post */}
                <div className="flex flex-col items-end text-right">
                    {adjacent.next && (
                        <Link
                            href={`/blog/${adjacent.next.slug}`}
                            className="group flex flex-col gap-2 p-4 w-full rounded-2xl glass-card hover:border-[#FF6B35]/30 transition-all items-end"
                        >
                            <span className="text-xs font-display text-gray-500 uppercase flex items-center gap-1 group-hover:text-[#FF6B35] transition-colors">
                                Next
                                <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                            </span>
                            <span className="font-medium text-sm line-clamp-2 md:line-clamp-1">{adjacent.next.title}</span>
                        </Link>
                    )}
                </div>
            </div>
        </div>
    )
}
