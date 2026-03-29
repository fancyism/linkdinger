"use client";

import { useDeferredValue, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Search, X } from "lucide-react";
import { Link } from "@/i18n/navigation";
import PostCard from "@/components/post-card";
import BrutalTag from "@/components/ui/brutal-tag";

interface BlogClientProps {
  posts: Array<{
    slug: string;
    title: string;
    date: string;
    excerpt: string;
    category?: string;
    tags?: string[];
    readTime?: string;
    coverImage?: string;
    _views?: number;
  }>;
  categories: string[];
}

export default function BlogClient({ posts, categories }: BlogClientProps) {
  const t = useTranslations("BlogClient");
  const searchParams = useSearchParams();
  const activeCategory = searchParams.get("category");
  const [sortBy, setSortBy] = useState<"date" | "views">("date");
  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const normalizedSearchQuery = deferredSearchQuery.trim().toLowerCase();

  const filteredByCategory = activeCategory
    ? posts.filter((post) => post.category === activeCategory)
    : posts;

  const filtered = normalizedSearchQuery
    ? filteredByCategory.filter(
        (post) =>
          post.title.toLowerCase().includes(normalizedSearchQuery) ||
          post.excerpt.toLowerCase().includes(normalizedSearchQuery) ||
          post.tags?.some((tag) =>
            tag.toLowerCase().includes(normalizedSearchQuery),
          ),
      )
    : filteredByCategory;

  const popularSlugs = [...posts]
    .sort((a, b) => (b._views || 0) - (a._views || 0))
    .slice(0, 3)
    .map((post) => post.slug);

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "views") {
      return (b._views || 0) - (a._views || 0);
    }

    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  const getAspectForBlog = (index: number) => {
    const pattern = [
      "portrait",
      "wide",
      "square",
      "landscape",
      "portrait",
      "square",
      "wide",
      "landscape",
      "square",
      "portrait",
      "landscape",
      "wide",
    ];

    return pattern[index % pattern.length] as
      | "portrait"
      | "square"
      | "wide"
      | "landscape";
  };

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 border-b border-black/5 dark:border-white/5 pb-4">
        {categories.length > 0 ? (
          <div className="flex items-center gap-3 overflow-x-auto pb-2 md:pb-0">
            <Link
              href="/blog"
              className={
                !activeCategory ? "opacity-100" : "opacity-80 hover:opacity-100"
              }
            >
              <BrutalTag
                className={
                  !activeCategory ? "bg-peach text-black border-peach" : ""
                }
              >
                {t("all")} ({posts.length})
              </BrutalTag>
            </Link>
            {categories.map((category) => {
              const count = posts.filter(
                (post) => post.category === category,
              ).length;
              return (
                <Link
                  key={category}
                  href={`/blog?category=${encodeURIComponent(category)}`}
                  className={
                    activeCategory === category
                      ? "opacity-100"
                      : "opacity-80 hover:opacity-100"
                  }
                >
                  <BrutalTag>
                    {category} ({count})
                  </BrutalTag>
                </Link>
              );
            })}
          </div>
        ) : (
          <div />
        )}

        <div className="flex flex-col sm:flex-row sm:items-center gap-4 shrink-0 mt-4 md:mt-0">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder={t("searchPlaceholder")}
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="w-full rounded-full border border-black/10 bg-transparent py-1.5 pl-11 pr-9 text-sm transition-all focus:border-peach focus:outline-none dark:border-white/10 sm:w-48"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black dark:hover:text-white text-xs"
                aria-label={t("clearSearch")}
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-4 text-xs font-display tracking-widest uppercase justify-end">
            <span className="text-gray-500 hidden lg:inline">
              {t("sortBy")}
            </span>
            <button
              onClick={() => setSortBy("date")}
              className={`transition-colors ${sortBy === "date" ? "text-peach font-bold" : "text-gray-400 hover:text-gray-900 dark:hover:text-white"}`}
            >
              {t("latest")}
            </button>
            <button
              onClick={() => setSortBy("views")}
              className={`transition-colors flex items-center gap-1 ${sortBy === "views" ? "text-peach font-bold" : "text-gray-400 hover:text-gray-900 dark:hover:text-white"}`}
            >
              {t("popular")}
            </button>
          </div>
        </div>
      </div>

      {sorted.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-20">
          {sorted.map((post, index) => (
            <PostCard
              key={post.slug}
              index={index}
              slug={post.slug}
              title={post.title}
              date={post.date}
              excerpt={post.excerpt}
              tags={post.tags}
              readTime={post.readTime}
              coverImage={post.coverImage}
              imageAspect={getAspectForBlog(index)}
              staticViews={post._views}
              isPopular={popularSlugs.includes(post.slug)}
            />
          ))}
        </div>
      ) : (
        <div className="glass-card p-12 text-center">
          <p className="text-gray-400 mb-2">
            {activeCategory
              ? t("noPostsInCategory", { category: activeCategory })
              : t("noPosts")}
          </p>
          <p className="text-gray-500 text-sm">
            {activeCategory ? (
              <Link href="/blog" className="text-peach hover:underline">
                {t("viewAllPosts")}
              </Link>
            ) : (
              t("noPostsHint")
            )}
          </p>
        </div>
      )}
    </>
  );
}
