"use client";

import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";

/**
 * Giscus Comments Component
 * 
 * SETUP INSTRUCTIONS:
 * 1. Enable Discussions on your GitHub repo
 *    - Go to repo Settings → Features → Check "Discussions"
 * 
 * 2. Go to https://giscus.app and configure:
 *    - Repository: your-username/linkdinger
 *    - Page ↔️ Discussions Mapping: pathname
 *    - Discussion Category: General (or create one)
 *    - Features: Enable reactions
 *    - Theme: preferred_color_scheme (auto sync with site)
 * 
 * 3. Copy the generated values:
 *    - data-repo-id
 *    - data-category-id
 * 
 * 4. Create .env.local in blog/ folder:
 *    NEXT_PUBLIC_GISCUS_REPO=your-username/linkdinger
 *    NEXT_PUBLIC_GISCUS_REPO_ID=R_xxxxx
 *    NEXT_PUBLIC_GISCUS_CATEGORY=General
 *    NEXT_PUBLIC_GISCUS_CATEGORY_ID=DIC_xxxxx
 */

// Fallback defaults (replace with your values or use env vars)
const GISCUS_CONFIG = {
  repo: process.env.NEXT_PUBLIC_GISCUS_REPO || "",
  repoId: process.env.NEXT_PUBLIC_GISCUS_REPO_ID || "",
  category: process.env.NEXT_PUBLIC_GISCUS_CATEGORY || "General",
  categoryId: process.env.NEXT_PUBLIC_GISCUS_CATEGORY_ID || "",
};

// Check if Giscus is configured
const isConfigured = GISCUS_CONFIG.repoId && GISCUS_CONFIG.categoryId;

export default function GiscusComments() {
  const { resolvedTheme } = useTheme();
  const ref = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !ref.current) return;
    
    // Clear previous iframe on theme change
    const existingIframe = ref.current.querySelector("iframe.giscus-frame");
    if (existingIframe) {
      existingIframe.remove();
    }
    
    // Remove existing script
    const existingScript = ref.current.querySelector("script");
    if (existingScript) {
      existingScript.remove();
    }
    
    if (!isConfigured) return;

    const scriptElem = document.createElement("script");
    scriptElem.src = "https://giscus.app/client.js";
    scriptElem.async = true;
    scriptElem.crossOrigin = "anonymous";

    scriptElem.setAttribute("data-repo", GISCUS_CONFIG.repo);
    scriptElem.setAttribute("data-repo-id", GISCUS_CONFIG.repoId);
    scriptElem.setAttribute("data-category", GISCUS_CONFIG.category);
    scriptElem.setAttribute("data-category-id", GISCUS_CONFIG.categoryId);
    scriptElem.setAttribute("data-mapping", "pathname");
    scriptElem.setAttribute("data-strict", "0");
    scriptElem.setAttribute("data-reactions-enabled", "1");
    scriptElem.setAttribute("data-emit-metadata", "0");
    scriptElem.setAttribute("data-input-position", "bottom");
    scriptElem.setAttribute("data-lang", "en");

    // Theme selection optimized for each mode:
    // Dark: transparent_dark - matches glass aesthetic perfectly
    // Light: light_high_contrast - better readability on light backgrounds
    const theme = resolvedTheme === "dark" 
      ? "transparent_dark" 
      : "light_high_contrast";
    scriptElem.setAttribute("data-theme", theme);

    ref.current.appendChild(scriptElem);
  }, [resolvedTheme, mounted]);

  // Loading skeleton
  if (!mounted) {
    return (
      <div className="mt-10">
        <div className="skeleton h-8 w-32 mb-6" />
        <div className="skeleton h-4 w-48 mb-4" />
        <div className="skeleton min-h-[200px] rounded-xl" />
      </div>
    );
  }

  // Show setup instructions if not configured
  if (!isConfigured) {
    return (
      <div className="mt-10 p-6 rounded-2xl bg-white/[0.03] dark:bg-white/[0.03] border border-black/[0.08] dark:border-white/[0.08] backdrop-blur-xl">
        <h2 className="text-2xl font-display font-bold mb-4 text-gray-900 dark:text-white">
          Comments
        </h2>
        <div className="text-gray-600 dark:text-gray-400 text-sm space-y-3">
          <p className="flex items-center gap-2">
            <span className="text-peach">💬</span>
            Comments powered by GitHub Discussions
          </p>
          <div className="bg-black/[0.02] dark:bg-white/[0.02] rounded-lg p-4 font-mono text-xs overflow-x-auto">
            <p className="text-peach mb-2"># Setup Giscus Comments:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Enable Discussions in your GitHub repo settings</li>
              <li>Go to <a href="https://giscus.app" target="_blank" rel="noopener" className="text-peach hover:underline">giscus.app</a></li>
              <li>Enter your repo and copy the IDs</li>
              <li>Add to blog/.env.local</li>
            </ol>
            <div className="mt-3 pt-3 border-t border-black/10 dark:border-white/10">
              <p className="text-green-500">NEXT_PUBLIC_GISCUS_REPO=your-username/linkdinger</p>
              <p className="text-green-500">NEXT_PUBLIC_GISCUS_REPO_ID=R_xxxxx</p>
              <p className="text-green-500">NEXT_PUBLIC_GISCUS_CATEGORY_ID=DIC_xxxxx</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-10">
      <h2 className="text-2xl font-display font-bold mb-6 text-gray-900 dark:text-white">
        Comments
      </h2>
      <div className="text-sm text-gray-500 dark:text-gray-500 mb-4 flex items-center gap-2">
        <span>💬</span>
        <span>Powered by GitHub Discussions</span>
      </div>
      <div 
        ref={ref} 
        className="min-h-[200px] rounded-xl overflow-hidden"
      />
    </div>
  );
}
