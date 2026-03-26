"use client";

import { Link } from "@/i18n/navigation";
import { useState } from "react";
import BrutalTag from "./ui/brutal-tag";

interface HeroProps {
  title: string;
  excerpt: string;
  slug: string;
  date: string;
  readTime: string;
  tags?: string[];
  coverImage?: string;
  badgeText?: string;
}

export default function Hero({
  title,
  excerpt,
  slug,
  date,
  readTime,
  tags = [],
  coverImage,
  badgeText = "🌟 Latest Entry",
}: HeroProps) {
  const [isImageLoading, setIsImageLoading] = useState(true);

  // Format date: "2024-03-25" → "03.25"
  const formatDate = (dateStr: string) => {
    try {
      const [year, month, day] = dateStr.split("-");
      return month && day ? `${month}.${day}` : dateStr;
    } catch {
      return dateStr;
    }
  };

  const formattedDate = formatDate(date);

  return (
    <Link
      href={`/blog/${slug}`}
      className="block group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-peach/50 focus-visible:ring-offset-4 focus-visible:ring-offset-dark dark:focus-visible:ring-offset-dark rounded-2xl sm:rounded-3xl mb-8 sm:mb-12"
      aria-labelledby="hero-title"
    >
      <article
        className="relative overflow-hidden rounded-2xl sm:rounded-3xl glass-card border border-black/10 dark:border-white/20 transition-all duration-500 hover:border-peach/40 dark:hover:border-peach/60 hover:shadow-lg dark:hover:shadow-[0_0_60px_rgba(255,107,53,0.15)] hover:-translate-y-1"
        aria-label={`Featured post: ${title}`}
      >
        {/* Ambient glow behind card - only visible in dark mode */}
        <div className="hidden dark:block absolute -inset-4 bg-peach/10 rounded-full blur-[80px] opacity-30 group-hover:opacity-50 transition-opacity duration-500 pointer-events-none" />

        {coverImage ? (
          <div className="relative flex flex-col md:flex-row min-h-[320px] sm:min-h-[380px] md:min-h-[420px] lg:min-h-[480px] xl:min-h-[520px]">
            {/* Content Area */}
            <div className="flex-1 p-6 sm:p-8 lg:p-10 xl:p-12 flex flex-col justify-between relative z-10 w-full md:w-[55%] lg:w-[60%]">
              <div>
                {/* Badge */}
                {badgeText && (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-peach/10 text-peach border border-peach/30 text-xs font-bold tracking-widest uppercase mb-4 sm:mb-6 shadow-sm backdrop-blur-md">
                    <span className="w-2 h-2 bg-peach rounded-full animate-pulse shadow-[0_0_8px_rgba(255,107,53,0.8)]" />
                    {badgeText}
                  </div>
                )}

                {/* Title */}
                <h1
                  id="hero-title"
                  className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-display font-black leading-tight lg:leading-[1.1] tracking-tight lg:tracking-tighter text-gray-900 dark:text-white group-hover:text-peach transition-colors duration-300"
                >
                  {title}
                </h1>

                {/* Excerpt - Always visible */}
                {excerpt && (
                  <p className="mt-4 sm:mt-6 text-sm sm:text-base lg:text-lg text-gray-500 dark:text-gray-400 line-clamp-2 sm:line-clamp-3 lg:line-clamp-none leading-relaxed max-w-xl">
                    {excerpt}
                  </p>
                )}

                {/* Tags */}
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4 sm:mt-6">
                    {tags.slice(0, 3).map((tag) => (
                      <BrutalTag key={tag}>{tag}</BrutalTag>
                    ))}
                  </div>
                )}
              </div>

              {/* Meta Row */}
              <div className="flex items-center justify-between mt-6 sm:mt-8 lg:mt-10">
                <time className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-gray-400 dark:text-gray-500 group-hover:text-gray-900 dark:group-hover:text-white transition-colors tracking-tight">
                  {formattedDate}
                </time>
                <span className="text-sm sm:text-base text-gray-400 dark:text-gray-500 font-display">
                  {readTime} read
                </span>
              </div>
            </div>

            {/* Image Area */}
            <div className="relative overflow-hidden w-full md:w-[45%] lg:w-[40%] min-h-[180px] sm:min-h-[220px] md:min-h-0 rounded-b-2xl sm:rounded-b-3xl md:rounded-bl-none md:rounded-tr-none md:rounded-br-3xl">
              {/* Loading skeleton */}
              {isImageLoading && (
                <div className="absolute inset-0 bg-gray-900/50 animate-pulse skeleton z-0" />
              )}

              <img
                src={coverImage}
                alt={title}
                className={`absolute inset-0 w-full h-full object-cover object-center filter brightness-90 group-hover:brightness-110 transition-all duration-700 z-10 ${
                  isImageLoading ? "opacity-0 scale-105" : "opacity-100 group-hover:scale-105"
                }`}
                onLoad={() => setIsImageLoading(false)}
              />

              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:to-black/20 pointer-events-none z-20" />

              {/* Vertical decoration text */}
              <span className="hidden lg:flex absolute right-4 top-0 bottom-0 items-center text-white/30 dark:text-white/60 font-display font-black tracking-[0.3em] text-xs uppercase rotate-90 origin-right translate-x-1/2 whitespace-nowrap drop-shadow-sm mix-blend-overlay z-30">
                LINKDINGER
              </span>
            </div>
          </div>
        ) : (
          /* No image fallback */
          <div className="liquid-glass p-8 sm:p-12 lg:p-16 text-center">
            {/* Badge */}
            {badgeText && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-peach/10 text-peach border border-peach/30 text-xs font-bold tracking-widest uppercase mb-6 shadow-sm backdrop-blur-md">
                <span className="w-2 h-2 bg-peach rounded-full animate-pulse shadow-[0_0_8px_rgba(255,107,53,0.8)]" />
                {badgeText}
              </div>
            )}

            <h1
              id="hero-title"
              className="text-4xl sm:text-5xl lg:text-6xl font-display font-black mb-4 tracking-tight lg:tracking-tighter group-hover:text-peach transition-colors"
            >
              {title}
            </h1>

            {excerpt && (
              <p className="text-gray-400 dark:text-gray-400 text-lg sm:text-xl max-w-2xl mx-auto mb-6 font-medium leading-relaxed">
                {excerpt}
              </p>
            )}

            {/* Tags */}
            {tags.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2 mb-6">
                {tags.slice(0, 3).map((tag) => (
                  <BrutalTag key={tag}>{tag}</BrutalTag>
                ))}
              </div>
            )}

            <div className="flex justify-center items-center gap-4 text-sm text-gray-500 font-bold uppercase tracking-widest">
              <time className="text-xl sm:text-2xl font-display">{formattedDate}</time>
              <span className="text-gray-400">·</span>
              <span>{readTime} read</span>
            </div>
          </div>
        )}
      </article>
    </Link>
  );
}
