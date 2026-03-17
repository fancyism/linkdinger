"use client";

import { useState, useEffect } from "react";
import { Coffee } from "lucide-react";

interface KofiButtonProps {
  variant?: "inline" | "floating";
  className?: string;
}

const KOFI_URL = "https://ko-fi.com/linkdinger";

const CONVERSATION_MESSAGES = [
  "Support me? 🥺",
  "Buy me coffee? ☕",
  "Click me! ✨",
  "Keep building! 💪",
  "Fuel dev! 🚀",
];

export default function KofiButton({
  variant = "inline",
  className = "",
}: KofiButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [messageIndex, setMessageIndex] = useState(0);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    if (!isHovered) return;
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % CONVERSATION_MESSAGES.length);
    }, 800);
    return () => clearInterval(interval);
  }, [isHovered]);

  if (variant === "floating") {
    return (
      <div 
        className={`fixed bottom-6 left-6 z-50 ${className}`}
        onMouseEnter={() => {
          setIsHovered(true);
          setTimeout(() => setShowTooltip(true), 100);
        }}
        onMouseLeave={() => {
          setIsHovered(false);
          setShowTooltip(false);
        }}
      >
        {/* Thought Bubble */}
        <div 
          className={`
            absolute bottom-full mb-3 left-full ml-3
            pointer-events-none
            transition-all duration-300 ease-out
            origin-bottom-left
            ${showTooltip 
              ? 'opacity-100 scale-100 rotate-[6deg]' 
              : 'opacity-0 scale-75 rotate-0'}
          `}
        >
          {/* Glass bubble with glow */}
          <div 
            className={`
              relative px-4 py-2.5 rounded-2xl
              min-w-[150px]
              font-display font-bold text-sm text-center
              whitespace-nowrap
                
              /* Light & Dark: neubrutalism */
              bg-peach text-black
              border-[3px] border-black dark:border-white
              shadow-[4px_4px_0_#000] dark:shadow-[4px_4px_0_#fff]
            `}
          >
            {CONVERSATION_MESSAGES[messageIndex]}
            {/* Arrow pointer */}
            <div 
              className="absolute -bottom-2 left-0 w-3 h-3 
                bg-peach
                border-r-[3px] border-b-[3px]
                border-black dark:border-white
                rotate-45 translate-x-3
              "
            />
          </div>
        </div>

          {/* Circular Badge - Neubrutalism style */}
        <a
          href={KOFI_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={`
            relative w-14 h-14 rounded-full
            flex items-center justify-center
            transition-all duration-150 ease-out
            group
          `}
          aria-label="Support on Ko-fi"
        >
          {/* Neubrutalism button */}
          <span
            className={`
              relative w-full h-full rounded-full
              flex items-center justify-center
              
              /* Light & Dark: pure neubrutalism */
              bg-peach
              border-[3px] border-black dark:border-white
              shadow-[4px_4px_0_#000] dark:shadow-[4px_4px_0_#fff]
              
              hover:translate-x-[-2px] hover:translate-y-[-2px]
              hover:shadow-[6px_6px_0_#000] dark:hover:shadow-[6px_6px_0_#fff]
              active:translate-x-[2px] active:translate-y-[2px]
              active:shadow-[2px_2px_0_#000] dark:active:shadow-[2px_2px_0_#fff]
              ${isHovered ? 'scale-110' : 'scale-100'}
            `}
          >
            <Coffee 
              size={22} 
              className={`
                text-black dark:text-white
                transition-transform duration-200 ease-out
                ${isHovered ? 'rotate-12 scale-110' : 'rotate-0'}
              `}
            />
          </span>
        </a>
      </div>
    );
  }

  // Inline variant
  return (
    <a
      href={KOFI_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`
        relative inline-flex items-center gap-2
        font-display font-bold text-sm
        group
        ${className}
      `}
      aria-label="Support on Ko-fi"
    >
      {/* Neubrutalism button */}
      <span
        className={`
          inline-flex items-center gap-2 px-5 py-2.5 rounded-xl
          
          /* Light & Dark: neubrutalism */
          bg-peach text-black
          border-[3px] border-black dark:border-white
          shadow-[4px_4px_0_#000] dark:shadow-[4px_4px_0_#fff]
          
          hover:translate-x-[-2px] hover:translate-y-[-2px]
          hover:shadow-[6px_6px_0_#000] dark:hover:shadow-[6px_6px_0_#fff]
          active:translate-x-[2px] active:translate-y-[2px]
          active:shadow-[2px_2px_0_#000] dark:active:shadow-[2px_2px_0_#fff]
          transition-all duration-150
        `}
      >
        <Coffee size={18} className="group-hover:rotate-12 transition-transform duration-150" />
        <span>Support</span>
      </span>
    </a>
  );
}
