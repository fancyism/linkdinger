"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Search, Sparkles } from "lucide-react";
import PostCard from "@/components/post-card";

interface SearchClientProps {
  posts: Array<{
    slug: string;
    title: string;
    date: string;
    excerpt: string;
    content: string;
    tags?: string[];
    readTime?: string;
    coverImage?: string;
  }>;
}

export default function SearchClient({ posts }: SearchClientProps) {
  const t = useTranslations("SearchClient");
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const normalizedQuery = query.toLowerCase();

    return posts.filter(
      (post) =>
        post.title.toLowerCase().includes(normalizedQuery) ||
        post.excerpt.toLowerCase().includes(normalizedQuery) ||
        post.content.toLowerCase().includes(normalizedQuery) ||
        post.tags?.some((tag) => tag.toLowerCase().includes(normalizedQuery)),
    );
  }, [query, posts]);

  return (
    <>
      <div className="relative mb-10">
        <Search
          size={20}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
        />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("placeholder")}
          className="glass-input pl-12 text-lg"
          autoFocus
          aria-label={t("ariaLabel")}
        />
      </div>

      {query.trim() ? (
        results.length > 0 ? (
          <>
            <p className="text-sm text-gray-500 mb-6">
              {t("results", { count: results.length, query })}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.map((post) => (
                <PostCard
                  key={post.slug}
                  slug={post.slug}
                  title={post.title}
                  date={post.date}
                  excerpt={post.excerpt}
                  tags={post.tags}
                  readTime={post.readTime}
                  coverImage={post.coverImage}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="glass-card p-12 text-center">
            <Search size={28} className="mx-auto mb-2 text-peach" />
            <p className="text-gray-400">{t("noResultsTitle", { query })}</p>
            <p className="text-sm text-gray-500 mt-1">{t("noResultsHint")}</p>
          </div>
        )
      ) : (
        <div className="glass-card p-12 text-center">
          <Sparkles size={28} className="mx-auto mb-2 text-peach" />
          <p className="text-gray-400">{t("idleTitle")}</p>
        </div>
      )}
    </>
  );
}
