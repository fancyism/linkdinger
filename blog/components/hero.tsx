"use client";

import { Link } from "@/i18n/navigation";
import { useState, useMemo, useEffect } from "react";
import Image from "next/image";

/* ── Accent Color System ── */
const ACCENT_COLORS = [
  { name: "Peach", hex: "#FF6B35", glow: "rgba(255,107,53,0.25)" },
  { name: "Lime", hex: "#C1FF72", glow: "rgba(193,255,114,0.20)" },
  { name: "Violet", hex: "#A78BFA", glow: "rgba(167,139,250,0.22)" },
  { name: "Blue", hex: "#38BDF8", glow: "rgba(56,189,248,0.22)" },
  { name: "Rose", hex: "#FB7185", glow: "rgba(251,113,133,0.22)" },
] as const;

interface HeroProps {
  title: string;
  excerpt: string;
  slug: string;
  date: string;
  readTime: string;
  tags?: string[];
  coverImage?: string;
  badgeText?: string;
  category?: string;
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
  category = "General",
}: HeroProps) {
  const [imgError, setImgError] = useState(false);

  // Always start with Peach Orange (#FF6B35) — the brand default
  const [activeColorIndex, setActiveColorIndex] = useState(0);
  const accent = ACCENT_COLORS[activeColorIndex];

  const formattedDate = useMemo(() => {
    try {
      const [, month, day] = date.split("-");
      return month && day ? `${month}.${day}` : date;
    } catch {
      return date;
    }
  }, [date]);

  // Split title into visually balanced lines
  const titleLines = useMemo(() => {
    const words = title.split(" ");
    const lines: string[] = [];
    const wordsPerLine = Math.max(
      2,
      Math.ceil(words.length / Math.min(4, Math.ceil(words.length / 3)))
    );
    for (let i = 0; i < words.length; i += wordsPerLine) {
      lines.push(words.slice(i, i + wordsPerLine).join(" "));
    }
    return lines;
  }, [title]);

  // Check if coverImage is a valid remote URL for next/image
  const isRemoteImage =
    coverImage && (coverImage.startsWith("http://") || coverImage.startsWith("https://"));

  return (
    <Link
      href={`/blog/${slug}`}
      className="hero-link block group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-peach/50 focus-visible:ring-offset-4 focus-visible:ring-offset-dark"
      aria-labelledby="hero-title"
    >
      {/* ═══════════════════════════════════════════
          FULL-BLEED EDITORIAL HERO
          No background, no border — pure content
          ═══════════════════════════════════════════ */}
      <article
        className="relative mb-12 sm:mb-16 lg:mb-20"
        style={{ "--hero-accent": accent.hex } as React.CSSProperties}
        aria-label={`Featured post: ${title}`}
      >
        {/* Ambient glow (dark mode only) */}
        <div
          className="hidden dark:block absolute -top-20 -right-20 w-[350px] h-[350px] rounded-full blur-[120px] opacity-20 pointer-events-none"
          style={{ background: accent.glow }}
        />

        {/* ── Row 1: Badge ── */}
        <div className="hero-stagger-1 mb-8 sm:mb-10 lg:mb-8">
          {badgeText && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-peach/10 dark:bg-white/5 text-peach border border-peach/20 dark:border-white/10 text-[10px] sm:text-xs font-bold tracking-widest uppercase backdrop-blur-sm">
              <span
                className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full animate-pulse"
                style={{ background: accent.hex, boxShadow: `0 0 8px ${accent.hex}` }}
              />
              {badgeText}
            </div>
          )}
        </div>

        {/* ── Row 2: Editorial Grid — Title + Image + Category ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-0 items-start">
          {/* ──── LEFT: Title ──── */}
          <div className="lg:col-span-5 xl:col-span-5 relative z-20 lg:pr-0">
            <h1
              id="hero-title"
              className="hero-title font-display font-black tracking-tight leading-[1.0] text-gray-900 dark:text-white transition-colors duration-300"
            >
              {titleLines.map((line, i) => (
                <span
                  key={i}
                  className={`hero-stagger-${i + 2} block text-[1.75rem] sm:text-[2.25rem] lg:text-[2.5rem] xl:text-[2.75rem]`}
                  style={{ paddingLeft: `${i * 0.6}rem` }}
                >
                  {line}
                </span>
              ))}
            </h1>
          </div>

          {/* ──── RIGHT: Image + Accent Slab + Category ──── */}
          <div className="lg:col-span-7 xl:col-span-7 relative">
            {/* Category — vertical label */}
            <div className="hero-category-reveal absolute -right-2 sm:-right-4 lg:-right-8 top-0 z-30">
              <span
                className="hero-category-vertical font-display font-black text-[11px] sm:text-xs tracking-[0.3em] uppercase select-none"
                style={{ color: accent.hex }}
              >
                {category}
              </span>
            </div>

            {coverImage && !imgError ? (
              <div className="relative">
                {/* ── Accent Color Slab — GLITCH ART animation ── */}
                <div
                  className="hero-accent-slab hero-glitch-slab absolute -left-4 sm:-left-6 lg:-left-10 top-6 sm:top-8 bottom-0 w-16 sm:w-20 lg:w-24 z-0"
                  style={{
                    background: accent.hex,
                    boxShadow: `4px 4px 0 rgba(0,0,0,0.2)`,
                  }}
                />

                {/* ── Image — Next.js optimized ── */}
                <div className="hero-image-wrapper relative overflow-hidden z-10 aspect-[16/10] sm:aspect-[16/9] lg:aspect-[4/3]">
                  {isRemoteImage ? (
                    <Image
                      src={coverImage}
                      alt={title}
                      fill
                      priority
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 60vw, 55vw"
                      className="object-cover object-center"
                      quality={85}
                      onError={() => setImgError(true)}
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={coverImage}
                      alt={title}
                      className="absolute inset-0 w-full h-full object-cover object-center"
                      loading="eager"
                      onError={() => setImgError(true)}
                    />
                  )}
                </div>
              </div>
            ) : (
              /* No image / error: large accent block as art */
              <div className="relative h-40 sm:h-56 lg:h-64">
                <div
                  className="hero-accent-slab hero-glitch-slab absolute inset-y-4 left-0 w-2/3 z-0"
                  style={{ background: accent.hex, boxShadow: `6px 6px 0 rgba(0,0,0,0.2)` }}
                />
              </div>
            )}
          </div>
        </div>

        {/* ── Row 3: Bottom — Date / Dots / Excerpt ── */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 sm:gap-6 mt-8 sm:mt-10 lg:mt-8 items-end">
          {/* Date */}
          <div className="sm:col-span-3 hero-stagger-4">
            <time
              className="block text-3xl sm:text-4xl lg:text-[3.25rem] font-display font-black tracking-tighter leading-none"
              style={{ color: accent.hex }}
            >
              {formattedDate}
            </time>
            <span className="block mt-1.5 text-[10px] sm:text-xs text-gray-400 dark:text-white/30 font-display font-medium tracking-widest uppercase">
              {readTime} read
            </span>
          </div>

          {/* Color dots */}
          <div className="sm:col-span-3 flex sm:justify-center items-end hero-stagger-5">
            <div
              className="flex items-center gap-2.5"
              role="radiogroup"
              aria-label="Accent color selector"
              onClick={(e) => e.preventDefault()}
            >
              {ACCENT_COLORS.map((color, i) => (
                <button
                  key={color.name}
                  type="button"
                  className={`hero-color-dot ${activeColorIndex === i ? "active" : ""}`}
                  style={{ background: color.hex }}
                  aria-label={`Switch accent to ${color.name}`}
                  aria-checked={activeColorIndex === i}
                  role="radio"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setActiveColorIndex(i);
                  }}
                />
              ))}
            </div>
          </div>

          {/* Excerpt */}
          <div className="sm:col-span-6 hero-stagger-6">
            {excerpt && (
              <p className="text-xs sm:text-sm text-gray-500 dark:text-white/40 leading-relaxed line-clamp-3 max-w-sm sm:max-w-md ml-auto">
                {excerpt}
              </p>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}
