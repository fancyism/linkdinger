"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { Post } from "@/lib/posts";

interface SeriesNavProps {
  adjacent: {
    prev: Post | null;
    next: Post | null;
  };
}

export default function SeriesNav({ adjacent }: SeriesNavProps) {
  const t = useTranslations("SeriesNav");

  if (!adjacent.prev && !adjacent.next) {
    return null;
  }

  return (
    <div className="relative my-6 border-t border-white/5 py-6">
      <div className="glass absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full px-3 text-[0.6rem] font-display uppercase tracking-widest whitespace-nowrap text-[#FF6B35]">
        {t("keepReading")}
      </div>

      <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          {adjacent.prev ? (
            <Link
              href={`/blog/${encodeURIComponent(adjacent.prev.slug)}`}
              className="glass-card group flex w-full flex-col gap-1.5 rounded-xl p-4 transition-all hover:border-[#FF6B35]/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B35]/50 active:scale-[0.98]"
            >
              <span className="flex items-center gap-1 text-[0.65rem] font-display uppercase text-gray-500 transition-colors group-hover:text-[#FF6B35]">
                <ArrowLeft
                  size={11}
                  className="transition-transform group-hover:-translate-x-0.5"
                />
                {t("previous")}
              </span>
              <span className="line-clamp-2 text-sm leading-snug text-gray-700 transition-colors group-hover:text-gray-900 dark:text-gray-300 dark:group-hover:text-white">
                {adjacent.prev.title}
              </span>
            </Link>
          ) : (
            <div />
          )}
        </div>

        <div>
          {adjacent.next ? (
            <Link
              href={`/blog/${encodeURIComponent(adjacent.next.slug)}`}
              className="glass-card group flex w-full flex-col items-end gap-1.5 rounded-xl p-4 text-right transition-all hover:border-[#FF6B35]/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B35]/50 active:scale-[0.98]"
            >
              <span className="flex items-center gap-1 text-[0.65rem] font-display uppercase text-gray-500 transition-colors group-hover:text-[#FF6B35]">
                {t("next")}
                <ArrowRight
                  size={11}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </span>
              <span className="line-clamp-2 text-sm leading-snug text-gray-700 transition-colors group-hover:text-gray-900 dark:text-gray-300 dark:group-hover:text-white">
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
