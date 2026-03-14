"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { Post } from "@/lib/posts";

interface SeriesNavProps {
  adjacent: {
    prev: Post | null;
    next: Post | null;
  };
}

export default function SeriesNav({ adjacent }: SeriesNavProps) {
  if (!adjacent.prev && !adjacent.next) return null;

  return (
    <div className="border-t border-white/5 py-6 my-6 relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-3 glass text-[0.6rem] font-display tracking-widest text-[#FF6B35] uppercase rounded-full whitespace-nowrap">
        Keep Reading
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
        {/* Previous (Older) Post */}
        <div>
          {adjacent.prev ? (
            <Link
              href={`/blog/${encodeURIComponent(adjacent.prev.slug)}`}
              className="group flex flex-col gap-1.5 p-4 w-full rounded-xl glass-card hover:border-[#FF6B35]/30 transition-all"
            >
              <span className="text-[0.65rem] font-display text-gray-500 uppercase flex items-center gap-1 group-hover:text-[#FF6B35] transition-colors">
                <ArrowLeft
                  size={11}
                  className="group-hover:-translate-x-0.5 transition-transform"
                />
                Previous
              </span>
              <span className="font-medium text-sm leading-snug line-clamp-2 text-gray-300 group-hover:text-white transition-colors">
                {adjacent.prev.title}
              </span>
            </Link>
          ) : (
            <div />
          )}
        </div>

        {/* Next (Newer) Post */}
        <div>
          {adjacent.next ? (
            <Link
              href={`/blog/${encodeURIComponent(adjacent.next.slug)}`}
              className="group flex flex-col gap-1.5 p-4 w-full rounded-xl glass-card hover:border-[#FF6B35]/30 transition-all items-end text-right"
            >
              <span className="text-[0.65rem] font-display text-gray-500 uppercase flex items-center gap-1 group-hover:text-[#FF6B35] transition-colors">
                Next
                <ArrowRight
                  size={11}
                  className="group-hover:translate-x-0.5 transition-transform"
                />
              </span>
              <span className="font-medium text-sm leading-snug line-clamp-2 text-gray-300 group-hover:text-white transition-colors">
                {adjacent.next.title}
              </span>
            </Link>
          ) : (
            <div />
          )}
        </div>
      </div>
    </div>
  );
}
