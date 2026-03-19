import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getAllPosts } from "@/lib/posts";
import SearchClient from "./client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "SearchPage" });

  return {
    title: t("title"),
    description: t("metaDescription"),
    robots: { index: false, follow: false },
    alternates: {
      canonical: `/${locale}/search/`,
    },
  };
}

export default async function SearchPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "SearchPage" });
  const posts = getAllPosts(locale);

  return (
    <section className="py-12 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-display font-bold mb-2">{t("title")}</h1>
        <p className="text-gray-400 mb-8">{t("description")}</p>
        <SearchClient posts={posts} />
      </div>
    </section>
  );
}
