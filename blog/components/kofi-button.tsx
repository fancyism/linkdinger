"use client";

import { Coffee } from "lucide-react";

interface KofiButtonProps {
  variant?: "inline" | "floating";
  className?: string;
}

const KOFI_URL = "https://ko-fi.com/linkdinger";

export default function KofiButton({
  variant = "inline",
  className = "",
}: KofiButtonProps) {
  if (variant === "floating") {
    return (
      <a
        href={KOFI_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={`fixed bottom-6 left-6 z-50 group flex items-center gap-2 px-4 py-3 rounded-full
          bg-gradient-to-r from-[#FF6B35] to-[#ff8f5e] text-white font-display font-bold text-sm
          shadow-lg shadow-[#FF6B35]/20 hover:shadow-xl hover:shadow-[#FF6B35]/30
          hover:scale-105 active:scale-95 transition-all duration-200
          ${className}`}
        aria-label="Support on Ko-fi"
      >
        <Coffee size={18} className="group-hover:animate-bounce" />
        <span className="hidden sm:inline">Buy me a coffee</span>
      </a>
    );
  }

  return (
    <a
      href={KOFI_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl
        glass-card border border-[#FF6B35]/20 hover:border-[#FF6B35]/50
        text-sm font-medium text-gray-600 dark:text-gray-300
        hover:text-[#FF6B35] transition-all duration-200 group
        ${className}`}
      aria-label="Support on Ko-fi"
    >
      <Coffee size={16} className="text-[#FF6B35] group-hover:animate-bounce" />
      <span>Support this blog</span>
    </a>
  );
}
