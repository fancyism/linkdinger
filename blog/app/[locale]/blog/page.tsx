import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getAllPosts, getAllCategories, getAllTags } from "@/lib/posts";
import BlogClient from "./blog-client";
import TagCloud from "@/components/tag-cloud";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "BlogPage" });

  return {
    title: t("title"),
    description: t("metaDescription"),
    alternates: {
      canonical: `/${locale}/blog/`,
    },
  };
}

export default async function BlogPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "BlogPage" });
  const posts = getAllPosts(locale);
  const categories = getAllCategories(locale);
  const allTags = getAllTags(locale);

  const tagCounts = allTags.map((tag) => ({
    name: tag,
    count: posts.filter((post) => post.tags?.includes(tag)).length,
  }));

  return (
    <section className="py-12 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-display font-bold mb-2">{t("title")}</h1>
          <p className="text-gray-400">
            {t("description", { count: posts.length })}
          </p>
        </div>

        <TagCloud tags={tagCounts} />

        <Suspense fallback={<div className="skeleton h-64 w-full" />}>
          <BlogClient posts={posts} categories={categories} />
        </Suspense>
      </div>
    </section>
  );
}
