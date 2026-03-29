"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Terminal, Sparkles, Hash } from "lucide-react";
import BrutalTag from "./ui/brutal-tag";

interface PromptHeroProps {
  totalPrompts: number;
  platforms: string[];
  onPlatformFilter: (platform: string | null) => void;
  activePlatform: string | null;
}

export default function PromptHero({
  totalPrompts,
  platforms,
  onPlatformFilter,
  activePlatform,
}: PromptHeroProps) {
  const t = useTranslations("PromptsPage");

  return (
    <section className="relative pt-8 pb-12 px-4 sm:px-6 overflow-hidden">
      {/* Ambient gradient orbs — behind glass */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-peach/8 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-purple-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Top bar — editorial label */}
        <motion.div
          className="flex items-center gap-3 mb-6"
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="flex items-center gap-2 text-peach">
            <Terminal size={16} />
            <span className="text-xs font-display font-bold uppercase tracking-[0.2em]">
              {t("heroLabel")}
            </span>
          </div>
          <div className="h-px flex-1 bg-gradient-to-r from-peach/30 to-transparent" />
        </motion.div>

        {/* Main heading — two-line editorial layout */}
        <div className="mb-8">
          <motion.h1
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-bold leading-[0.95] mb-4"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.6,
              ease: [0.22, 1, 0.36, 1],
              delay: 0.1,
            }}
          >
            <span className="text-gray-900 dark:text-white">
              {t("heroTitleLine1")}
            </span>
            <br />
            <span className="text-stroke-hero relative inline-block">
              {t("heroTitleLine2")}
              {/* Glitch accent slab */}
              <span className="absolute -bottom-1 left-0 w-full h-2 bg-peach/30 hero-glitch-slab rounded-sm" />
            </span>
          </motion.h1>

          <motion.p
            className="text-base sm:text-lg text-gray-500 dark:text-gray-400 max-w-xl leading-relaxed"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.5,
              ease: [0.22, 1, 0.36, 1],
              delay: 0.25,
            }}
          >
            {t("heroDescription")}
          </motion.p>
        </div>

        {/* Stats bar — glass card */}
        <motion.div
          className="flex flex-wrap items-center gap-4 sm:gap-6 mb-8"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.5,
            ease: [0.22, 1, 0.36, 1],
            delay: 0.35,
          }}
        >
          <div className="flex items-center gap-2 glass-card px-4 py-2 rounded-xl">
            <Sparkles size={14} className="text-peach" />
            <span className="text-sm font-display font-bold text-white">
              {totalPrompts}
            </span>
            <span className="text-xs text-gray-400">
              {t("totalPrompts")}
            </span>
          </div>
          <div className="flex items-center gap-2 glass-card px-4 py-2 rounded-xl">
            <Hash size={14} className="text-peach" />
            <span className="text-sm font-display font-bold text-white">
              {platforms.length}
            </span>
            <span className="text-xs text-gray-400">
              {t("platforms")}
            </span>
          </div>
        </motion.div>

        {/* Platform filter chips — brutal neubrutalism */}
        <motion.div
          className="flex flex-wrap items-center gap-2"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.5,
            ease: [0.22, 1, 0.36, 1],
            delay: 0.45,
          }}
        >
          <button
            onClick={() => onPlatformFilter(null)}
            className={
              !activePlatform ? "opacity-100" : "opacity-70 hover:opacity-100"
            }
          >
            <BrutalTag
              className={
                !activePlatform ? "bg-peach text-black border-peach" : ""
              }
            >
              {t("allPlatforms")} ({totalPrompts})
            </BrutalTag>
          </button>
          {platforms.map((platform) => (
            <button
              key={platform}
              onClick={() =>
                onPlatformFilter(
                  activePlatform === platform ? null : platform,
                )
              }
              className={
                activePlatform === platform
                  ? "opacity-100"
                  : "opacity-70 hover:opacity-100"
              }
            >
              <BrutalTag
                className={
                  activePlatform === platform
                    ? "bg-peach text-black border-peach"
                    : ""
                }
              >
                {platform}
              </BrutalTag>
            </button>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
