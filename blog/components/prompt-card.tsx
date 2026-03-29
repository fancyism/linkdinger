"use client";

import { useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Calendar, Sparkles } from "lucide-react";
import type { Prompt } from "@/lib/prompt-types";
import { getLocalizedPromptPath, getPlatformColor, inferPromptPreviewLayout } from "@/lib/prompt-types";
import PromptShareActions from "@/components/prompt-share-actions";

interface PromptCardProps {
  prompt: Prompt;
  index?: number;
  onOpenModal: (prompt: Prompt) => void;
}

export default function PromptCard({
  prompt,
  index = 0,
  onOpenModal,
}: PromptCardProps) {
  const [isImageLoading, setIsImageLoading] = useState(true);
  const ref = useRef<HTMLDivElement>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 });
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["4deg", "-4deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-4deg", "4deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const platformColor = getPlatformColor(prompt.platform);
  const promptUrl = getLocalizedPromptPath(prompt);
  const previewLayout = inferPromptPreviewLayout(prompt);

  // Cycle on asymmetric aspects — different rhythm than Home blog
  const aspectPatterns = [
    "aspect-[3/4]",
    "aspect-[16/10]",
    "aspect-square",
    "aspect-[4/3]",
    "aspect-[3/4]",
    "aspect-[16/10]",
  ];
  const aspectClass = aspectPatterns[index % aspectPatterns.length];

  // Format date
  const [, month, day] = (prompt.date || "").split("-");
  const formattedDate = month && day ? `${month}.${day}` : prompt.date;

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="group cursor-pointer"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{
        duration: 0.7,
        ease: [0.22, 1, 0.36, 1],
        delay: Math.min((index % 6) * 0.08, 0.4),
      }}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
        transformPerspective: 1000,
      }}
      onClick={() => onOpenModal(prompt)}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpenModal(prompt);
        }
      }}
      aria-label={`Open prompt ${prompt.title}`}
    >
      <article className="h-full flex flex-col">
        {/* Cover Image */}
        <div
          className={`${aspectClass} relative w-full overflow-hidden rounded-xl bg-black/10 transition-all duration-500 group-hover:-translate-y-2 group-hover:shadow-[0_20px_40px_rgba(0,0,0,0.15)] group-focus-within:ring-2 group-focus-within:ring-peach/35 dark:bg-black/50 dark:group-hover:shadow-[0_20px_40px_rgba(255,255,255,0.08)]`}
        >
          {/* Platform accent bar */}
          <div
            className="absolute top-0 left-0 w-1 h-full z-20 rounded-l-xl"
            style={{ background: platformColor }}
          />

          {prompt.coverImage ? (
            <>
              {previewLayout === "showcase" && (
                <>
                  <img
                    src={prompt.coverImage}
                    alt={prompt.title}
                    className="relative z-10 h-full w-full object-cover transition-all duration-700 group-hover:scale-105 dark:brightness-90 dark:group-hover:brightness-100"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                </>
              )}

              {previewLayout === "spotlight" && (
                <>
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(154,205,50,0.22),transparent_34%),radial-gradient(circle_at_18%_86%,rgba(255,107,53,0.18),transparent_30%),linear-gradient(135deg,#081007_0%,#0d140d_45%,#131313_100%)]" />
                  <div className="absolute inset-x-[12%] top-[9%] bottom-[14%] z-10 overflow-hidden rounded-[24px] border border-white/14 bg-white/[0.08] p-2 shadow-[0_20px_55px_rgba(0,0,0,0.35)] backdrop-blur-md">
                    <div className="h-full w-full overflow-hidden rounded-[18px] bg-white/95">
                      <img
                        src={prompt.coverImage}
                        alt={prompt.title}
                        className="h-full w-full object-contain transition-all duration-700 group-hover:scale-[1.03]"
                        loading="lazy"
                      />
                    </div>
                  </div>
                </>
              )}

              {previewLayout === "editorial" && (
                <>
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_22%,rgba(154,205,50,0.20),transparent_34%),radial-gradient(circle_at_16%_82%,rgba(255,107,53,0.14),transparent_30%),linear-gradient(135deg,#0d110b_0%,#121612_45%,#191919_100%)]" />
                  <div className="absolute inset-x-[6%] top-[10%] bottom-[14%] z-10 overflow-hidden rounded-[22px] border border-white/12 bg-white/[0.06] p-2 shadow-[0_18px_44px_rgba(0,0,0,0.32)] backdrop-blur-md">
                    <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-[16px] bg-[#f6f4ef]">
                      <img
                        src={prompt.coverImage}
                        alt={prompt.title}
                        className="h-full w-full object-contain p-1 transition-all duration-700 group-hover:scale-[1.02]"
                        loading="lazy"
                      />
                    </div>
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-black/5 to-black/10 dark:from-white/5 dark:to-white/10">
              <Sparkles
                size={48}
                className="opacity-20"
                style={{ color: platformColor }}
              />
            </div>
          )}

          {/* Prompt ID Badge — brutal neubrutalism */}
          <div className="absolute top-3 right-3 z-20">
            <span
              className="prompt-badge text-[0.65rem] font-display font-bold px-2.5 py-1 rounded-full uppercase tracking-wider"
              style={{
                background: platformColor,
                color: "#000",
                border: "2px solid #fff",
                boxShadow: "2px 2px 0 1px #fff",
              }}
            >
              {prompt.promptId}
            </span>
          </div>

          {/* Platform chip — bottom left on image */}
          <div className="absolute bottom-3 left-4 z-20 flex items-center gap-2">
            <span
              className="text-[0.6rem] font-display font-bold px-2 py-0.5 rounded-full uppercase tracking-widest backdrop-blur-sm"
              style={{
                background: `${platformColor}33`,
                color: "#fff",
                border: `1px solid ${platformColor}66`,
              }}
            >
              {prompt.platform}
            </span>
            
            {/* sref badge if present */}
            {prompt.sref && (
              <span className="text-[0.6rem] font-mono font-bold px-2 py-0.5 rounded-full bg-white/10 text-white border border-white/20 backdrop-blur-sm flex items-center gap-1">
                <Sparkles size={10} />
                sref
              </span>
            )}
          </div>

          <div className="absolute bottom-3 right-3 z-20">
            <PromptShareActions
              title={prompt.title}
              excerpt={prompt.excerpt}
              promptText={prompt.promptText}
              url={promptUrl}
              variant="overlay"
            />
          </div>

        </div>

        {/* Text content below image */}
          <div className="flex flex-1 flex-col pt-4">
            {/* Date + category */}
          <div className="mb-2 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-display uppercase tracking-widest text-slate-500 dark:text-gray-400">
              <Calendar size={12} />
              <span>{formattedDate}</span>
            </div>
            <span className="rounded-full border border-black/10 bg-black/[0.03] px-2 py-0.5 text-[0.65rem] font-display uppercase tracking-widest text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-gray-400">
              {prompt.category}
            </span>
          </div>

          {/* Title */}
          <h3 className="text-lg sm:text-xl font-display font-bold text-gray-900 dark:text-white group-hover:text-peach transition-colors leading-snug line-clamp-2 mb-2">
            {prompt.title}
          </h3>

          {/* Prompt preview — monospace */}
          <p className="mb-3 line-clamp-2 rounded-lg border border-black/8 bg-black/[0.03] px-3 py-2 font-mono text-xs leading-relaxed text-slate-500 dark:border-white/8 dark:bg-white/5 dark:text-gray-400">
            {prompt.promptText.slice(0, 120)}...
          </p>

          {/* Tags */}
          {prompt.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-auto">
              {prompt.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-black/10 bg-black/[0.03] px-2 py-0.5 text-[0.6rem] font-display text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-gray-400"
                >
                  #{tag}
                </span>
              ))}
              {prompt.tags.length > 3 && (
                <span className="px-2 py-0.5 text-[0.6rem] font-display text-slate-500 dark:text-gray-500">
                  +{prompt.tags.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      </article>
    </motion.div>
  );
}
