"use client";

import { Link } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { ArrowLeft, Calendar, ExternalLink, Layers, Sparkles, Tag } from "lucide-react";
import PromptShareActions from "@/components/prompt-share-actions";
import type { Prompt } from "@/lib/prompt-types";
import { getPlatformColor } from "@/lib/prompt-types";

interface PromptDetailProps {
  prompt: Prompt;
  html: string;
  shareUrl: string;
}

function formatPromptDate(date: string, locale: string): string {
  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(parsed);
}

export default function PromptDetail({ prompt, html, shareUrl }: PromptDetailProps) {
  const t = useTranslations("PromptDetail");
  const locale = useLocale();
  const platformColor = getPlatformColor(prompt.platform);
  const promptLines = prompt.promptText.split("\n").filter((line) => line.trim());
  const formattedDate = formatPromptDate(prompt.date, locale);
  const metadataChips = [
    prompt.promptId ? { label: t("promptId"), value: prompt.promptId } : null,
    prompt.difficulty ? { label: t("difficulty"), value: prompt.difficulty } : null,
    prompt.model ? { label: t("model"), value: prompt.model } : null,
  ].filter(Boolean) as Array<{ label: string; value: string }>;

  return (
    <section className="px-4 pb-20 pt-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/prompts"
          className="mb-8 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400 transition-colors hover:text-peach"
        >
          <ArrowLeft size={14} />
          {t("backToGallery")}
        </Link>

        <article className="glass-modal overflow-hidden rounded-[28px] border border-white/10">
          {prompt.coverImage && (
            <div className="relative h-56 w-full overflow-hidden sm:h-72">
              <img
                src={prompt.coverImage}
                alt={prompt.title}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent" />

              <div className="absolute left-5 top-5 z-10">
                <span
                  className="prompt-badge text-xs font-display font-bold px-3 py-1.5 rounded-full uppercase tracking-wider"
                  style={{
                    background: platformColor,
                    color: "#000",
                    border: "2px solid rgba(255,255,255,0.9)",
                    boxShadow: "3px 3px 0 rgba(255,255,255,0.8)",
                  }}
                >
                  {prompt.promptId}
                </span>
              </div>

              <div className="absolute bottom-5 left-5 z-10">
                <span
                  className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-display font-bold uppercase tracking-wider text-white backdrop-blur-sm"
                  style={{
                    background: `${platformColor}44`,
                    border: `1px solid ${platformColor}88`,
                  }}
                >
                  <Sparkles size={10} />
                  {prompt.platform}
                </span>
              </div>
            </div>
          )}

          <div className="px-5 py-6 sm:px-8 sm:py-8">
            <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-slate-500 dark:text-gray-400">
              <span className="flex items-center gap-1.5">
                <Calendar size={14} />
                {formattedDate}
              </span>
              <span className="flex items-center gap-1.5">
                <Layers size={14} />
                {prompt.category}
              </span>
            </div>

            <h1 className="mb-4 text-3xl font-display font-black leading-[1.1] text-slate-900 dark:text-white sm:text-4xl">
              {prompt.title}
            </h1>

            <p className="mb-6 max-w-3xl text-base leading-relaxed text-slate-600 dark:text-gray-300 sm:text-lg">
              {prompt.excerpt}
            </p>

            {(metadataChips.length > 0 || prompt.demoUrl) && (
              <div className="mb-8 flex flex-wrap items-center gap-3 border-b border-black/8 pb-6 dark:border-white/8">
                {metadataChips.map((item) => (
                  <div
                    key={`${item.label}-${item.value}`}
                    className="rounded-2xl border border-black/8 bg-black/[0.03] px-3 py-2 dark:border-white/10 dark:bg-white/[0.04]"
                  >
                    <p className="text-[0.62rem] font-display uppercase tracking-[0.16em] text-slate-500 dark:text-gray-500">
                      {item.label}
                    </p>
                    <p className="mt-1 text-sm font-display font-semibold capitalize text-slate-900 dark:text-white">
                      {item.value}
                    </p>
                  </div>
                ))}

                {prompt.demoUrl && (
                  <a
                    href={prompt.demoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-11 items-center gap-2 rounded-2xl border border-[#e55a2b] bg-[#ff6b35] px-4 text-sm font-display font-bold uppercase tracking-[0.12em] text-[#111111] shadow-[0_12px_24px_rgba(255,107,53,0.24)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#ff7b47] hover:shadow-[0_16px_30px_rgba(255,107,53,0.28)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-peach/50"
                  >
                    <ExternalLink size={15} />
                    {t("viewDemo")}
                  </a>
                )}
              </div>
            )}

            <div className="mb-8 border-b border-black/8 pb-6 dark:border-white/8">
              <p className="mb-3 text-[0.68rem] font-display font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-gray-400">
                {t("shareAndCopy")}
              </p>
              <PromptShareActions
                title={prompt.title}
                excerpt={prompt.excerpt}
                promptText={prompt.promptText}
                url={shareUrl}
                variant="detail"
              />
            </div>

            <div className="prompt-code-block mb-8 overflow-hidden rounded-2xl">
              <div className="flex items-center justify-between border-b border-slate-700/80 bg-[#182230] px-4 py-3 dark:border-white/10 dark:bg-black/40">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-red-500/80" />
                    <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
                    <div className="h-3 w-3 rounded-full bg-green-500/80" />
                  </div>
                  <span className="ml-2 text-[0.7rem] font-mono text-slate-400 dark:text-gray-500">
                    prompt.txt
                  </span>
                </div>
                <span className="text-[0.65rem] font-display uppercase tracking-[0.18em] text-slate-400 dark:text-gray-500">
                  {t("readyToCopy")}
                </span>
              </div>

              <div className="overflow-x-auto bg-[#101722] p-4 dark:bg-[#0a0a0a] sm:p-5">
                <pre className="whitespace-pre-wrap text-sm font-mono leading-relaxed text-slate-200 dark:text-gray-300">
                  {promptLines.map((line, index) => (
                    <div key={`${prompt.slug}-${index}`} className="flex">
                      <span className="mr-4 w-8 shrink-0 select-none text-right text-xs leading-relaxed text-slate-500 dark:text-gray-600">
                        {index + 1}
                      </span>
                      <span>{line}</span>
                    </div>
                  ))}
                </pre>
              </div>
            </div>

            {prompt.usageTips && (
              <div className="glass-card mb-8 rounded-2xl p-5 sm:p-6">
                <div className="mb-3 flex items-center gap-2">
                  <Sparkles size={16} className="text-peach" />
                  <h2 className="text-sm font-display font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    {t("usageTips")}
                  </h2>
                </div>
                <p className="text-sm leading-relaxed text-slate-600 dark:text-gray-300 sm:text-base">
                  {prompt.usageTips}
                </p>
              </div>
            )}

            {html.trim() && (
              <div
                className="prose prose-slate max-w-none dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            )}

            {prompt.tags.length > 0 && (
              <div className="mt-8 flex flex-wrap items-center gap-2 border-t border-black/8 pt-6 dark:border-white/8">
                <Tag size={14} className="text-slate-500 dark:text-gray-500" />
                {prompt.tags.map((tag) => (
                  <span
                    key={tag}
                  className="rounded-full border border-black/10 bg-black/[0.03] px-3 py-1 text-xs font-display text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-gray-300"
                >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </article>
      </div>
    </section>
  );
}
