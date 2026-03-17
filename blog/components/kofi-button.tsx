"use client";

import { useState, useEffect } from "react";
import { Coffee } from "lucide-react";

interface KofiButtonProps {
  variant?: "inline" | "floating";
  className?: string;
}

const KOFI_URL = "https://ko-fi.com/linkdinger";

// Conversation messages - short & sweet
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

  // Shuffle messages
  useEffect(() => {
    if (!isHovered) return;

    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % CONVERSATION_MESSAGES.length);
    }, 800);

    return () => clearInterval(interval);
  }, [isHovered]);

  // Floating variant
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
        {/* Thought Bubble - เอียงขวา ทำมุมเล็กน้อย */}
        <div 
          className={`
            absolute bottom-full mb-2 left-full ml-2
            pointer-events-none
            transition-all duration-300 ease-out
            origin-bottom-left
            ${showTooltip 
              ? 'opacity-100 scale-100 rotate-[8deg]' 
              : 'opacity-0 scale-75 rotate-0'}
          `}
        >
          {/* กล่องข้อความ - compact */}
          <div 
            className={`
              relative px-3 py-2 rounded-xl
              min-w-[140px]
              font-display font-bold text-xs text-center
              whitespace-nowrap
                
              /* Light: กล่องดำ ขอบส้ม */
              bg-black text-white
              border-2 border-peach
                
              /* Dark: กล่องขาว ขอบส้ม */
              dark:bg-white dark:text-black
              dark:border-peach
                
              /* Shadow */
              shadow-[2px_2px_0_0_rgba(0,0,0,0.3)
            `}
          >
            {CONVERSATION_MESSAGES[messageIndex]}
          </div>
        </div>

        {/* Circular Badge */}
        <a
          href={KOFI_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={`
            relative w-14 h-14 rounded-full
            bg-[#FF6B35]
            border-[3px] border-black dark:border-white
            shadow-[3px_3px_0_#000] dark:shadow-[3px_3px_0_#fff]
            flex items-center justify-center
            transition-all duration-200 ease-out
            hover:shadow-[5px_5px_0_#000] dark:hover:shadow-[5px_5px_0_#fff]
            ${isHovered ? 'scale-110' : 'scale-100'}
          `}
          aria-label="Support on Ko-fi"
        >
          {/* แก้วกาแฟหมุน 45° */}
          <Coffee 
            size={22} 
            className={`
              text-black
              transition-transform duration-300 ease-out
              ${isHovered ? 'rotate-45' : 'rotate-0'}
            `}
          />
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
        inline-flex items-center gap-2 px-4 py-2 rounded-xl
        bg-[#FF6B35] text-black font-display font-bold text-sm
        border-2 border-black dark:border-white
        shadow-[2px_2px 0_#000] dark:shadow-[2px_2px 0_#fff]
        hover:shadow-[3px_3px 0_#000] dark:hover:shadow-[3px_3px 0_#fff]
        hover:scale-105 transition-all duration-150
        ${className}
      `}
      aria-label="Support on Ko-fi"
    >
      <Coffee size={18} />
      <span>Support</span>
    </a>
  );
}
