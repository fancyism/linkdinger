"use client";

import { useEffect, useCallback, useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Copy,
  Check,
  Lightbulb,
  Tag,
  Calendar,
  Layers,
  Sparkles,
} from "lucide-react";
import type { Prompt } from "@/lib/prompt-types";
import { getLocalizedPromptPath, getPlatformColor } from "@/lib/prompt-types";
import PromptShareActions from "@/components/prompt-share-actions";

interface PromptModalProps {
  prompt: Prompt | null;
  onClose: () => void;
}

export default function PromptModal({ prompt, onClose }: PromptModalProps) {
  const t = useTranslations("PromptModal");
  const [copiedSmall, setCopiedSmall] = useState(false);
  const [copiedBig, setCopiedBig] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Close on ESC
  useEffect(() => {
    if (!prompt) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [prompt, onClose]);

  // Focus trap
  useEffect(() => {
    if (!prompt || !modalRef.current) return;

    const focusable = modalRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    const firstEl = focusable[0];
    const lastEl = focusable[focusable.length - 1];

    const trapFocus = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      if (e.shiftKey) {
        if (document.activeElement === firstEl) {
          e.preventDefault();
          lastEl?.focus();
        }
      } else {
        if (document.activeElement === lastEl) {
          e.preventDefault();
          firstEl?.focus();
        }
      }
    };

    document.addEventListener("keydown", trapFocus);
    firstEl?.focus();

    return () => document.removeEventListener("keydown", trapFocus);
  }, [prompt]);

  const handleCopySmall = useCallback(async () => {
    if (!prompt) return;
    try {
      await navigator.clipboard.writeText(prompt.promptText);
      setCopiedSmall(true);
      setTimeout(() => setCopiedSmall(false), 2500);
    } catch {
      /* fallback */
    }
  }, [prompt]);

  const handleCopyBig = useCallback(async () => {
    if (!prompt) return;
    try {
      await navigator.clipboard.writeText(prompt.promptText);
      setCopiedBig(true);
      setTimeout(() => setCopiedBig(false), 2500);
    } catch {
      /* fallback */
    }
  }, [prompt]);

  if (!prompt) return null;

  const platformColor = getPlatformColor(prompt.platform);
  const promptUrl = getLocalizedPromptPath(prompt);

  // Format date
  const dateStr = prompt.date
    ? new Date(prompt.date + "T00:00:00").toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "";

  // Split prompt text into lines for terminal display
  const promptLines = prompt.promptText.split("\n").filter((l) => l.trim());

  return (
    <AnimatePresence>
      {prompt && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

          {/* Modal */}
          <motion.div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-label={prompt.title}
            className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto glass-modal rounded-2xl"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Cover Image Banner */}
            {prompt.coverImage && (
              <div className="relative h-48 sm:h-56 w-full overflow-hidden rounded-t-2xl">
                <img
                  src={prompt.coverImage}
                  alt={prompt.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                {/* Prompt ID on cover */}
                <div className="absolute top-4 left-4 z-10">
                  <span
                    className="text-xs font-display font-bold px-3 py-1.5 rounded-full uppercase tracking-wider"
                    style={{
                      background: platformColor,
                      color: "#000",
                      border: "2px solid rgba(255,255,255,0.8)",
                      boxShadow: "3px 3px 0 rgba(0,0,0,0.3)",
                    }}
                  >
                    {prompt.promptId}
                  </span>
                </div>

                {/* Platform badge on cover */}
                <div className="absolute bottom-4 left-4 z-10">
                  <span
                    className="text-xs font-display font-bold px-3 py-1 rounded-full uppercase tracking-wider backdrop-blur-sm"
                    style={{
                      background: `${platformColor}44`,
                      color: "#fff",
                      border: `1px solid ${platformColor}88`,
                    }}
                  >
                    <Sparkles size={10} className="inline mr-1 -mt-0.5" />
                    {prompt.platform}
                  </span>
                </div>
              </div>
            )}

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-20 rounded-full border border-black/10 bg-white/78 p-2 text-slate-800 shadow-[0_12px_24px_rgba(15,23,42,0.14)] backdrop-blur-sm transition-colors hover:bg-white dark:border-white/20 dark:bg-black/30 dark:text-white dark:shadow-none dark:hover:bg-black/50"
              aria-label={t("close")}
            >
              <X size={18} />
            </button>

            {/* Content */}
            <div className="p-6 sm:p-8">
              {/* Title */}
              <h2 className="mb-4 text-2xl font-display font-bold leading-tight text-slate-900 dark:text-white sm:text-3xl">
                {prompt.title}
              </h2>

              {/* Meta row */}
              <div className="mb-6 flex flex-wrap items-center gap-3 text-sm text-slate-500 dark:text-gray-400">
                {dateStr && (
                  <span className="flex items-center gap-1.5">
                    <Calendar size={14} />
                    {dateStr}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Layers size={14} />
                  {prompt.category}
                </span>
              </div>

              {/* Excerpt */}
              <p className="mb-6 text-sm leading-relaxed text-slate-600 dark:text-gray-300">
                {prompt.excerpt}
              </p>

              <div className="mb-6 border-b border-black/8 pb-6 dark:border-white/8">
                <p className="mb-3 text-[0.68rem] font-display font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
                  {t("shareAndCopy")}
                </p>
                <PromptShareActions
                  title={prompt.title}
                  excerpt={prompt.excerpt}
                  promptText={prompt.promptText}
                  url={promptUrl}
                  variant="detail"
                />
              </div>

              {/* Prompt Code Block — Terminal Style */}
              <div className="prompt-code-block rounded-xl overflow-hidden mb-6">
                <div className="flex items-center justify-between border-b border-slate-700/80 bg-[#182230] px-4 py-2.5 dark:border-white/10 dark:bg-black/40">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500/80" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                      <div className="w-3 h-3 rounded-full bg-green-500/80" />
                    </div>
                    <span className="ml-2 text-[0.65rem] font-mono text-slate-400 dark:text-gray-500">
                      prompt.txt
                    </span>
                  </div>
                  <button
                    onClick={handleCopySmall}
                    className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-display font-bold transition-all duration-200 ${
                      copiedSmall
                        ? "border-green-500/30 bg-green-500/20 text-green-400"
                        : "border-[#e55a2b] bg-[#ff6b35] text-[#111111] shadow-[0_8px_20px_rgba(255,107,53,0.22)] hover:-translate-y-0.5 hover:bg-[#ff7b47]"
                    }`}
                  >
                    {copiedSmall ? (
                      <>
                        <Check size={12} />
                        {t("copied")}
                      </>
                    ) : (
                      <>
                        <Copy size={12} />
                        {t("copyPrompt")}
                      </>
                    )}
                  </button>
                </div>
                <div className="overflow-x-auto bg-[#101722] p-4 dark:bg-[#0a0a0a] sm:p-5">
                  <pre className="whitespace-pre-wrap text-sm font-mono leading-relaxed text-slate-200 dark:text-gray-300">
                    {promptLines.map((line, i) => (
                      <div key={i} className="flex">
                        <span className="mr-4 w-8 shrink-0 select-none text-right text-xs leading-relaxed text-slate-500 dark:text-gray-600">
                          {i + 1}
                        </span>
                        <span>{line}</span>
                      </div>
                    ))}
                  </pre>
                </div>
              </div>

              {/* Usage Tips */}
              {prompt.usageTips && (
                <div className="mb-6 rounded-xl border border-black/8 bg-white/72 p-4 shadow-[0_16px_30px_rgba(15,23,42,0.08)] backdrop-blur-sm dark:border-white/8 dark:bg-white/[0.03] dark:shadow-none sm:p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Lightbulb
                      size={16}
                      className="text-peach"
                    />
                    <h3 className="text-sm font-display font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                      {t("usageTips")}
                    </h3>
                  </div>
                  <p className="text-sm leading-relaxed text-slate-600 dark:text-gray-400">
                    {prompt.usageTips}
                  </p>
                </div>
              )}

              {/* sref Code */}
              {prompt.sref && (
                <div 
                  className="glass-card flex items-center justify-between p-4 sm:p-5 rounded-xl mb-6 border-l-4" 
                  style={{ borderLeftColor: platformColor }}
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg border border-black/8 bg-black/[0.04] p-2 dark:border-white/10 dark:bg-white/5">
                      <Sparkles size={16} className="text-slate-700 dark:text-white" />
                    </div>
                    <div>
                      <h3 className="mb-0.5 text-xs font-display font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400">
                        {t("srefCode")}
                      </h3>
                      <code className="text-sm font-mono text-slate-900 dark:text-white">
                        {prompt.sref}
                      </code>
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(prompt.sref || "");
                        // Could add a local copied state if desired, but this is fine for quick copy
                      } catch {
                        /* fallback */
                      }
                    }}
                    className="rounded-lg border border-black/10 bg-black/4 p-2 text-slate-600 transition-colors hover:bg-black/8 hover:text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-white"
                    title={t("copyPrompt")}
                  >
                    <Copy size={16} />
                  </button>
                </div>
              )}

              {/* Tags */}
              {prompt.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <Tag
                    size={14}
                    className="text-gray-500 mt-0.5"
                  />
                  {prompt.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-black/10 bg-black/[0.03] px-2.5 py-1 text-xs font-display text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-gray-400"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Big Copy CTA */}
              <button
                onClick={handleCopyBig}
                className={`w-full mt-6 flex items-center justify-center gap-2 py-3.5 rounded-xl font-display font-bold text-sm uppercase tracking-wider transition-all duration-200 ${
                  copiedBig
                    ? "bg-green-500/20 text-green-400 border-2 border-green-500/30"
                    : "brutal-btn"
                }`}
              >
                {copiedBig ? (
                  <>
                    <Check size={18} />
                    {t("copiedFull")}
                  </>
                ) : (
                  <>
                    <Copy size={18} />
                    {t("copyEntirePrompt")}
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
