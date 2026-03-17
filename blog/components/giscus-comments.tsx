"use client";

import { useTheme } from "next-themes";
import { useEffect, useRef } from "react";

export default function GiscusComments() {
  const { resolvedTheme } = useTheme();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current || ref.current.hasChildNodes()) return;

    const scriptElem = document.createElement("script");
    scriptElem.src = "https://giscus.app/client.js";
    scriptElem.async = true;
    scriptElem.crossOrigin = "anonymous";

    // ⚠️ SETUP NEEDED: Get these values from https://giscus.app
    // 1. Go to https://giscus.app
    // 2. Enter your repo: fancyism/linkdinger
    // 3. Choose "Page ↔️ Discussions mapping"
    // 4. Copy the generated values below
    scriptElem.setAttribute("data-repo", "fancyism/linkdinger");
    scriptElem.setAttribute("data-repo-id", "R_kgDOH1M9vA"); // TODO: Replace with your repo ID
    scriptElem.setAttribute("data-category", "General");
    scriptElem.setAttribute("data-category-id", "DIC_kwDOH1M9vM4Ccu7r"); // TODO: Replace with your category ID
    scriptElem.setAttribute("data-mapping", "pathname");
    scriptElem.setAttribute("data-strict", "0");
    scriptElem.setAttribute("data-reactions-enabled", "1");
    scriptElem.setAttribute("data-emit-metadata", "0");
    scriptElem.setAttribute("data-input-position", "bottom");
    scriptElem.setAttribute("data-lang", "en");

    // Sync with site theme
    const theme = resolvedTheme === "dark" ? "transparent_dark" : "light";
    scriptElem.setAttribute("data-theme", theme);

    ref.current.appendChild(scriptElem);
  }, [resolvedTheme]);

  // Update theme dynamically when theme changes
  useEffect(() => {
    const iframe = document.querySelector<HTMLIFrameElement>(
      "iframe.giscus-frame",
    );
    if (!iframe) return;

    const theme = resolvedTheme === "dark" ? "transparent_dark" : "light";
    iframe.contentWindow?.postMessage(
      { giscus: { setConfig: { theme } } },
      "https://giscus.app",
    );
  }, [resolvedTheme]);

  return (
    <div className="mt-10">
      <h2 className="text-2xl font-display font-bold mb-6 text-white dark:text-white">
        Comments
      </h2>
      <div className="text-sm text-gray-500 mb-4">
        Powered by GitHub Discussions 🎯
      </div>
      <div ref={ref} className="min-h-[300px]" />
    </div>
  );
}
