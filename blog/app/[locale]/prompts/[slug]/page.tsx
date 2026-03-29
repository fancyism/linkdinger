import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { markdownToHtml } from "@/lib/markdown";
import {
  getLocalizedPromptPath,
  getPromptBySlug,
  getPromptSlugs,
} from "@/lib/prompts";
import PromptDetail from "./prompt-detail";

export function generateStaticParams({
  params,
}: {
  params: { locale: string };
}) {
  return getPromptSlugs(params.locale).map((slug) => ({
    slug: slug.replace(/\.md$/, ""),
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: "PromptDetail" });
  const prompt = getPromptBySlug(slug, locale);

  if (!prompt) {
    return { title: t("notFound") };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const canonicalPath = getLocalizedPromptPath(prompt);
  const canonicalUrl = `${siteUrl}${canonicalPath}`;
  const promptSummary = prompt.excerpt || prompt.content.slice(0, 180);

  return {
    title: prompt.title,
    description: promptSummary,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title: prompt.title,
      description: promptSummary,
      type: "article",
      publishedTime: prompt.date,
      authors: ["Affan"],
      siteName: "Linkdinger",
      tags: [prompt.platform, prompt.category, ...prompt.tags].filter(Boolean),
      images: prompt.coverImage ? [{ url: prompt.coverImage }] : [],
      url: canonicalUrl,
      locale: locale === "th" ? "th_TH" : "en_US",
    },
    twitter: {
      card: prompt.coverImage ? "summary_large_image" : "summary",
      title: prompt.title,
      description: promptSummary,
      images: prompt.coverImage ? [prompt.coverImage] : [],
      creator: "@linkdinger",
    },
  };
}

export default async function PromptDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: "PromptDetail" });
  const prompt = getPromptBySlug(slug, locale);

  if (!prompt) {
    notFound();
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const shareUrl = `${siteUrl}${getLocalizedPromptPath(prompt)}`;
  const html = await markdownToHtml(prompt.content);

  const creativeWorkSchema = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: prompt.title,
    description: prompt.excerpt,
    datePublished: prompt.date,
    inLanguage: locale,
    keywords: prompt.tags?.join(", "),
    image: prompt.coverImage,
    url: shareUrl,
    author: {
      "@type": "Person",
      name: "Affan",
    },
    about: [prompt.platform, prompt.category].filter(Boolean),
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: t("breadcrumbHome"),
        item: `${siteUrl}/${locale}/`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: t("breadcrumbPrompts"),
        item: `${siteUrl}/${locale}/prompts/`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: prompt.title,
        item: shareUrl,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([creativeWorkSchema, breadcrumbSchema]),
        }}
      />
      <PromptDetail prompt={prompt} html={html} shareUrl={shareUrl} />
    </>
  );
}
