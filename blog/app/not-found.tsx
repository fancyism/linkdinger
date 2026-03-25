"use client";

import Link from "next/link";

export default function NotFound() {
  return (
    <section className="relative flex items-center justify-center min-h-[80vh] px-4 sm:px-6 overflow-hidden">
      {/* ── Page-specific ambient glow ── */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        {/* Peach core glow */}
        <div
          className="absolute animate-float"
          style={{
            width: "400px",
            height: "400px",
            top: "10%",
            left: "50%",
            transform: "translateX(-50%)",
            background:
              "radial-gradient(circle, rgba(255, 107, 53, 0.25) 0%, transparent 70%)",
            filter: "blur(80px)",
            borderRadius: "50%",
          }}
        />
        {/* Purple accent */}
        <div
          className="absolute animate-float-delayed"
          style={{
            width: "300px",
            height: "300px",
            bottom: "15%",
            left: "20%",
            background:
              "radial-gradient(circle, rgba(88, 28, 135, 0.3) 0%, transparent 70%)",
            filter: "blur(100px)",
            borderRadius: "50%",
          }}
        />
        {/* Blue accent */}
        <div
          className="absolute animate-float-slow"
          style={{
            width: "250px",
            height: "250px",
            top: "30%",
            right: "10%",
            background:
              "radial-gradient(circle, rgba(37, 99, 235, 0.2) 0%, transparent 70%)",
            filter: "blur(100px)",
            borderRadius: "50%",
          }}
        />
      </div>

      {/* ── Content ── */}
      <div className="relative z-10 text-center max-w-lg mx-auto animate-fade-in">
        {/* ── Glitch 404 Typography ── */}
        <div className="relative mb-8 select-none" aria-hidden="true">
          <h1 className="glitch-404 font-display font-black text-[6rem] sm:text-[8rem] md:text-[10rem] leading-none tracking-tighter">
            404
          </h1>

          {/* Glow layer */}
          <div
            className="absolute inset-0 font-display font-black text-[6rem] sm:text-[8rem] md:text-[10rem] leading-none tracking-tighter text-peach opacity-30 blur-lg pointer-events-none"
            aria-hidden="true"
          >
            404
          </div>
        </div>

        {/* ── Glass Message Card ── */}
        <div className="liquid-glass rounded-2xl p-6 sm:p-8 mb-8 gentle-float">
          <h2 className="text-xl sm:text-2xl font-display font-bold mb-3 text-white dark:text-white light-text-override">
            Page Not Found
          </h2>
          <p className="text-sm sm:text-base text-gray-400 dark:text-gray-400 font-light leading-relaxed mb-6 light-subtext-override">
            The page you&apos;re looking for doesn&apos;t exist, has been moved,
            or is hiding in another dimension.
          </p>

          <Link
            href="/"
            className="brutal-btn inline-flex items-center gap-2 text-sm sm:text-base"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
              />
            </svg>
            Back to Home
          </Link>
        </div>

        {/* ── Decorative scan line ── */}
        <div className="scan-line" aria-hidden="true" />
      </div>
    </section>
  );
}
