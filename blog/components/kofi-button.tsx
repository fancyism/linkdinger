"use client";

import { useState, useEffect } from "react";
import { Coffee } from "lucide-react";

interface KofiButtonProps {
  variant?: "inline" | "floating";
  className?: string;
}

const KOFI_URL = "https://ko-fi.com/linkdinger";

// Conversation messages
const CONVERSATION_MESSAGES = [
  "อยากให้ฉันพัฒนาต่อไหม? 🥺",
  "กดฉันสิ! ☕",
  "ช่วยเหลือนักพัฒนาหน่อยนะ 💪",
  "ซื้อกาแฟให้ฉันสักแก้วไหม? ☕✨",
  "support ให้กำลังใจ! ❤️",
  "ทำให้ฉันมีพลังต่อไป! ⚡",
  "ช่วย fuel ความฝันหน่อย 🚀",
  "อยากเห็นโปรเจคใหม่ๆ ไหม? 🌟",
  "กดสิ! ไม่กัดหรอกนะ 😊",
  "เลี้ยงกาแฟนักพัฒนาสักแก้ว? 🤗",
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

  const handleMouseEnter = () => {
    setIsHovered(true);
    setTimeout(() => setShowTooltip(true), 100);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setShowTooltip(false);
  };

  // Floating variant
  if (variant === "floating") {
    return (
      <div 
        className={`fixed bottom-6 left-6 z-50 ${className}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Tooltip - อยู่ด้านบนขวาของปุ่ม */}
        <div 
          className={`
            absolute bottom-full mb-4 left-0
            pointer-events-none
            transition-all duration-300 ease-out
            ${showTooltip 
              ? 'opacity-100 translate-y-0' 
              : 'opacity-0 translate-y-2'}
          `}
        >
          {/* กล่องข้อความ */}
          <div 
            className={`
              relative px-4 py-3 rounded-xl
              min-w-[180px] max-w-[220px]
              font-display font-bold text-sm text-center
              border-2 border-peach
              shadow-[4px_4px_0_0_rgba(255,107,53,0.5)]
              
              /* Light: กล่องดำ */
              bg-black text-white
              
              /* Dark: กล่องขาว */
              dark:bg-white dark:text-black
            `}
          >
            {CONVERSATION_MESSAGES[messageIndex]}
            
            {/* ลูกศรชี้ลง */}
            <div 
              className={`
                absolute -bottom-2 left-6
                w-0 h-0
                border-l-[8px] border-r-[8px] border-t-[10px]
                border-l-transparent border-r-transparent
                border-t-black
                dark:border-t-white
              `}
            />
          </div>
        </div>

        {/* Circular Badge - พื้นหลังไม่หมุน */}
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
            hover:scale-110
          `}
          aria-label="Support on Ko-fi"
        >
          {/* แก้วกาแฟหมุน 45° เมื่อ hover */}
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
        shadow-[2px_2px_0_#000] dark:shadow-[2px_2px_0_#fff]
        hover:shadow-[3px_3px_0_#000] dark:hover:shadow-[3px_3px_0_#fff]
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
