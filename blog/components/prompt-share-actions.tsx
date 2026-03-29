"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Copy, Facebook, Link2 } from "lucide-react";
import { buildShareLinks, DEFAULT_SHARE_SITE_URL } from "@/lib/share";

interface PromptShareActionsProps {
  title: string;
  excerpt?: string;
  promptText: string;
  url: string;
  variant?: "overlay" | "detail";
}

function XSocialIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="currentColor"
    >
      <path d="M18.901 1.153h3.68l-8.042 9.19L24 22.847h-7.406l-5.8-7.584-6.637 7.584H.476l8.602-9.83L0 1.154h7.594l5.243 6.932L18.901 1.153Zm-1.291 19.492h2.039L6.486 3.24H4.298L17.61 20.645Z" />
    </svg>
  );
}

function ActionTooltip({ label }: { label: string }) {
  return (
    <span className="pointer-events-none absolute -top-10 left-1/2 z-20 hidden -translate-x-1/2 whitespace-nowrap rounded-full border border-white/18 bg-slate-950/96 px-3 py-1.5 text-[0.62rem] font-display font-bold uppercase tracking-[0.16em] text-[#ffffff] opacity-0 shadow-[0_14px_32px_rgba(0,0,0,0.42)] ring-1 ring-black/10 transition-all duration-150 md:block md:group-hover/tooltip:-translate-y-0.5 md:group-hover/tooltip:opacity-100 md:group-focus-within/tooltip:-translate-y-0.5 md:group-focus-within/tooltip:opacity-100 dark:border-white/14 dark:bg-slate-950/92 dark:ring-white/8">
      {label}
    </span>
  );
}

export default function PromptShareActions({
  title,
  excerpt,
  promptText,
  url,
  variant = "overlay",
}: PromptShareActionsProps) {
  const t = useTranslations("PromptShareActions");
  const [copiedType, setCopiedType] = useState<"link" | "prompt" | null>(null);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SHARE_SITE_URL;
  const { fullUrl, tweetUrl, facebookUrl } = useMemo(
    () =>
      buildShareLinks({
        title,
        excerpt,
        url,
        siteUrl,
      }),
    [excerpt, siteUrl, title, url],
  );

  const isDetail = variant === "detail";
  const isOverlay = variant === "overlay";
  const showTooltips = isOverlay;

  const baseButtonClass = isDetail
    ? "inline-flex h-11 min-w-11 items-center justify-center rounded-xl border border-[#d7dce5] bg-[#f8f5f1] px-3 text-sm text-[#536076] shadow-[0_10px_24px_rgba(15,23,42,0.08)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#94a3b8] hover:bg-[#e8eef6] hover:text-[#0f172a] hover:shadow-[0_16px_30px_rgba(15,23,42,0.14)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-peach/50 active:scale-[0.98] dark:border-white/12 dark:bg-white/[0.04] dark:text-gray-300 dark:shadow-none dark:hover:border-white/25 dark:hover:bg-white/[0.08] dark:hover:text-white"
    : "inline-flex h-9 min-w-9 items-center justify-center rounded-[12px] border border-white/24 bg-white/10 px-2.5 text-sm text-slate-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:border-white/40 hover:bg-white/18 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-peach/50 active:scale-[0.98]";

  const iconButtonClass = `${baseButtonClass} px-0`;
  const copyButtonClass = "inline-flex h-9 items-center justify-center gap-1.5 rounded-[12px] border border-[#e55a2b] bg-[#ff6b35] px-2.5 text-[0.72rem] font-display font-bold uppercase tracking-[0.12em] text-[#111111] shadow-[0_12px_28px_rgba(255,107,53,0.30)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#ff8c5a] hover:bg-[#ff7b47] hover:shadow-[0_16px_34px_rgba(255,107,53,0.34)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-peach/50 active:scale-[0.98]";

  const setTemporaryState = (type: "link" | "prompt") => {
    setCopiedType(type);
    window.setTimeout(() => setCopiedType(null), 1800);
  };

  const handleCopyLink = async (event?: React.MouseEvent) => {
    event?.stopPropagation();
    await navigator.clipboard.writeText(fullUrl);
    setTemporaryState("link");
  };

  const handleCopyPrompt = async (event?: React.MouseEvent) => {
    event?.stopPropagation();
    await navigator.clipboard.writeText(promptText);
    setTemporaryState("prompt");
  };

  return (
    <div
      className={
        isDetail
          ? "relative flex flex-wrap items-center gap-2"
          : "relative inline-flex items-center gap-1.5 rounded-[20px] border border-white/22 bg-slate-900/62 p-1.5 shadow-[0_18px_40px_rgba(0,0,0,0.36),0_0_0_1px_rgba(255,255,255,0.04)] backdrop-blur-xl transition-transform duration-300 md:group-hover:-translate-y-0.5 md:group-focus-within:-translate-y-0.5 before:absolute before:inset-0 before:-z-10 before:rounded-[24px] before:bg-[radial-gradient(circle_at_center,rgba(255,107,53,0.14),transparent_70%)]"
      }
    >
      <div className={showTooltips ? "group/tooltip relative" : "relative"}>
        {showTooltips ? <ActionTooltip label={copiedType === "link" ? t("copiedLink") : t("copyLink")} /> : null}
        <button
          type="button"
          onClick={handleCopyLink}
          className={iconButtonClass}
          aria-label={copiedType === "link" ? t("copiedLink") : t("copyLink")}
          title={copiedType === "link" ? t("copiedLink") : t("copyLink")}
        >
          {copiedType === "link" ? <Check size={14} /> : <Link2 size={14} />}
        </button>
      </div>

      <div className={showTooltips ? "group/tooltip relative" : "relative"}>
        {showTooltips ? <ActionTooltip label={t("shareOnX")} /> : null}
        <a
          href={tweetUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(event) => event.stopPropagation()}
          className={`${iconButtonClass} hover:text-[#E8ECF6] ${isOverlay ? "hover:border-[#9099AA] hover:bg-[#111827]/88" : "hover:border-[#a8b4c8] hover:bg-[#edf2f8] hover:text-[#111827]"}`}
          aria-label={t("shareOnX")}
          title={t("shareOnX")}
        >
          <XSocialIcon className="h-3.5 w-3.5" />
        </a>
      </div>

      <div className={showTooltips ? "group/tooltip relative" : "relative"}>
        {showTooltips ? <ActionTooltip label={t("shareOnFacebook")} /> : null}
        <a
          href={facebookUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(event) => event.stopPropagation()}
          className={`${iconButtonClass} hover:text-[#EAF1FF] ${isOverlay ? "hover:border-[#7ea1ff] hover:bg-[#1d4ed8]/28" : "hover:border-[#93b4ff] hover:bg-[#eaf1ff] hover:text-[#1d4ed8]"}`}
          aria-label={t("shareOnFacebook")}
          title={t("shareOnFacebook")}
        >
          <Facebook size={14} />
        </a>
      </div>

      {isOverlay && (
        <div className="group/tooltip relative">
          <ActionTooltip label={copiedType === "prompt" ? t("copiedPrompt") : t("copyPrompt")} />
          <button
            type="button"
            onClick={handleCopyPrompt}
            className={copyButtonClass}
            aria-label={copiedType === "prompt" ? t("copiedPrompt") : t("copyPrompt")}
          >
            {copiedType === "prompt" ? <Check size={14} /> : <Copy size={14} />}
            <span className="hidden">
              {copiedType === "prompt" ? t("copiedShort") : t("copyShort")}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
