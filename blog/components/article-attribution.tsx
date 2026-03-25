"use client";

import { useEffect } from "react";
import { rememberArticleAttribution } from "@/lib/analytics-client";

interface ArticleAttributionProps {
  slug: string;
  locale: string;
  category?: string;
  title: string;
}

export default function ArticleAttribution({
  slug,
  locale,
  category,
  title,
}: ArticleAttributionProps) {
  useEffect(() => {
    rememberArticleAttribution({
      slug,
      locale,
      category,
      title,
    });
  }, [category, locale, slug, title]);

  return null;
}
