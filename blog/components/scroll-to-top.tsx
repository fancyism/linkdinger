"use client";

import { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);
  const [scrollPercent, setScrollPercent] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const percent =
        docHeight > 0
          ? Math.min(100, Math.round((scrollY / docHeight) * 100))
          : 0;

      setScrollPercent(percent);
      setVisible(scrollY > 400);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // init on mount
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // SVG ring math
  const size = 48;
  const center = size / 2;
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - scrollPercent / 100);

  return (
    <button
      onClick={scrollToTop}
      aria-label="Scroll to top"
      className={[
        // position
        "fixed bottom-6 right-6 z-50",
        // size + shape
        "w-12 h-12 rounded-full",
        // flex center for icon
        "flex items-center justify-center",
        // glassmorphism base layer
        "bg-[rgba(13,13,13,0.7)] backdrop-blur-md",
        // hover glow
        "hover:shadow-[0_0_24px_rgba(255,107,53,0.35)]",
        // click feedback
        "active:scale-90",
        // show / hide animation
        "transition-all duration-500 ease-out",
        visible
          ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
          : "opacity-0 translate-y-8 scale-75 pointer-events-none",
      ].join(" ")}
    >
      {/* ── Circular progress ring ── */}
      <svg
        className="absolute inset-0 w-full h-full -rotate-90"
        viewBox={`0 0 ${size} ${size}`}
        aria-hidden="true"
      >
        {/* track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth="1.5"
        />
        {/* progress */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#FF6B35"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{ transition: "stroke-dashoffset 0.25s ease" }}
        />
      </svg>

      {/* ── Arrow icon ── */}
      <ArrowUp
        size={16}
        className={[
          "relative z-10 text-[#FF6B35]",
          "transition-transform duration-200",
          "group-hover:-translate-y-0.5",
        ].join(" ")}
        aria-hidden="true"
      />
    </button>
  );
}
