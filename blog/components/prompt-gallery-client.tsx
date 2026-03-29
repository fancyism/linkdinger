"use client";

import { useDeferredValue, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { X, Search, LayoutGrid, List, SlidersHorizontal } from "lucide-react";
import PromptCard from "@/components/prompt-card";
import PromptModal from "@/components/prompt-modal";
import PromptHero from "@/components/prompt-hero";
import type { Prompt } from "@/lib/prompt-types";

interface PromptGalleryClientProps {
  prompts: Prompt[];
  platforms: string[];
  categories: string[];
}

type SortMode = "latest" | "az";
type ViewMode = "grid" | "list";

export default function PromptGalleryClient({
  prompts,
  platforms,
  categories,
}: PromptGalleryClientProps) {
  const t = useTranslations("PromptGalleryClient");

  // State
  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearch = useDeferredValue(searchQuery);
  const normalizedSearch = deferredSearch.trim().toLowerCase();

  const [activePlatform, setActivePlatform] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortMode>("latest");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [activePrompt, setActivePrompt] = useState<Prompt | null>(null);

  // Filter pipeline
  let filtered = prompts;

  // Platform filter
  if (activePlatform) {
    filtered = filtered.filter((p) => p.platform === activePlatform);
  }

  // Category filter
  if (activeCategory) {
    filtered = filtered.filter((p) => p.category === activeCategory);
  }

  // Search filter
  if (normalizedSearch) {
    filtered = filtered.filter(
      (p) =>
        p.title.toLowerCase().includes(normalizedSearch) ||
        p.excerpt.toLowerCase().includes(normalizedSearch) ||
        p.promptText.toLowerCase().includes(normalizedSearch) ||
        p.tags.some((tag) => tag.toLowerCase().includes(normalizedSearch)) ||
        p.platform.toLowerCase().includes(normalizedSearch) ||
        p.category.toLowerCase().includes(normalizedSearch),
    );
  }

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "az") {
      return a.title.localeCompare(b.title);
    }
    // latest
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  const handleOpenModal = useCallback((prompt: Prompt) => {
    setActivePrompt(prompt);
  }, []);

  const handleCloseModal = useCallback(() => {
    setActivePrompt(null);
  }, []);

  return (
    <>
      {/* Hero Section */}
      <PromptHero
        totalPrompts={prompts.length}
        platforms={platforms}
        onPlatformFilter={setActivePlatform}
        activePlatform={activePlatform}
      />

      {/* Controls Bar */}
      <section className="px-4 sm:px-6 mb-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-black/5 dark:border-white/5 pb-4">
            {/* Category chips */}
            {categories.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
                <SlidersHorizontal
                  size={14}
                  className="text-gray-400 shrink-0"
                />
                <button
                  onClick={() => setActiveCategory(null)}
                  className={`text-xs font-display uppercase tracking-wider px-3 py-1 rounded-full border transition-colors whitespace-nowrap ${
                    !activeCategory
                      ? "bg-peach/10 text-peach border-peach/30"
                      : "text-gray-400 border-white/10 hover:border-white/20"
                  }`}
                >
                  {t("all")}
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() =>
                      setActiveCategory(activeCategory === cat ? null : cat)
                    }
                    className={`text-xs font-display uppercase tracking-wider px-3 py-1 rounded-full border transition-colors whitespace-nowrap ${
                      activeCategory === cat
                        ? "bg-peach/10 text-peach border-peach/30"
                        : "text-gray-400 border-white/10 hover:border-white/20"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}

            {/* Right side: search + sort + view toggle */}
            <div className="flex items-center gap-3 shrink-0">
              {/* Search */}
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  placeholder={t("searchPlaceholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent border border-black/10 dark:border-white/10 rounded-full pl-9 pr-8 py-1.5 text-sm focus:outline-none focus:border-peach w-44 sm:w-52 transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs"
                    aria-label={t("clearSearch")}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Sort */}
              <div className="flex items-center gap-2 text-xs font-display tracking-widest uppercase">
                <button
                  onClick={() => setSortBy("latest")}
                  className={`transition-colors ${
                    sortBy === "latest"
                      ? "text-peach font-bold"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  {t("latest")}
                </button>
                <span className="text-gray-600">|</span>
                <button
                  onClick={() => setSortBy("az")}
                  className={`transition-colors ${
                    sortBy === "az"
                      ? "text-peach font-bold"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  A-Z
                </button>
              </div>

              {/* View mode toggle */}
              <div className="hidden sm:flex items-center gap-1 border border-white/10 rounded-lg p-0.5">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 rounded transition-colors ${
                    viewMode === "grid"
                      ? "bg-white/10 text-peach"
                      : "text-gray-400 hover:text-white"
                  }`}
                  aria-label={t("gridView")}
                >
                  <LayoutGrid size={14} />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-1.5 rounded transition-colors ${
                    viewMode === "list"
                      ? "bg-white/10 text-peach"
                      : "text-gray-400 hover:text-white"
                  }`}
                  aria-label={t("listView")}
                >
                  <List size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Gallery Grid */}
      <section className="px-4 sm:px-6 pb-20">
        <div className="max-w-6xl mx-auto">
          {sorted.length > 0 ? (
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-14"
                  : "grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-14"
              }
            >
              {sorted.map((prompt, index) => (
                <PromptCard
                  key={prompt.slug}
                  prompt={prompt}
                  index={index}
                  onOpenModal={handleOpenModal}
                />
              ))}
            </div>
          ) : (
            <div className="glass-card p-12 text-center rounded-2xl">
              <p className="text-gray-400 mb-2">{t("noPrompts")}</p>
              <p className="text-gray-500 text-sm">{t("noPromptsHint")}</p>
            </div>
          )}
        </div>
      </section>

      {/* Modal */}
      <PromptModal prompt={activePrompt} onClose={handleCloseModal} />
    </>
  );
}
