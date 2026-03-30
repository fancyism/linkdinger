import { notFound } from "next/navigation";
import {
  getPostBySlug,
  getPostSlugs,
  getRelatedPosts,
  getAdjacentPosts,
  extractHeadings,
  getPostLanguageAlternates,
  getPostXDefaultAlternate,
} from "@/lib/posts";
import { markdownToHtml } from "@/lib/markdown";
import { getTranslations } from "next-intl/server";
import PostDetail from "./post-detail";
import type { Metadata } from "next";
import { SITE_AUTHOR } from "@/lib/site-author";

export function generateStaticParams({
  params,
}: {
  params: { locale: string };
}) {
  return getPostSlugs(params.locale).map((slug) => ({
    slug: slug.replace(/\.md$/, ""),
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: "PostPage" });
  const post = getPostBySlug(slug, locale);
  if (!post) return { title: t("notFound") };
  const languages = getPostLanguageAlternates(slug, locale);
  const xDefault = getPostXDefaultAlternate(slug, locale);

  return {
    title: post.title,
    description: post.excerpt,
    alternates: {
      canonical: `/${locale}/blog/${encodeURIComponent(post.slug)}/`,
      languages: xDefault ? { ...languages, "x-default": xDefault } : languages,
    },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      publishedTime: post.date,
      modifiedTime: post.dateModified || post.date,
      authors: [SITE_AUTHOR.fullName],
      tags: post.tags,
      images: post.coverImage ? [{ url: post.coverImage }] : [],
    },
  };
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: "PostPage" });
  const post = getPostBySlug(slug, locale);
  if (!post) notFound();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const related = getRelatedPosts(slug, 3, locale);
  const adjacent = getAdjacentPosts(slug, locale);
  const headings = extractHeadings(post.content);
  const html = await markdownToHtml(post.content);
  const canonicalPostUrl = `${siteUrl}/${locale}/blog/${encodeURIComponent(post.slug)}/`;
  const authorAboutUrl = `${siteUrl}/${locale}/about/`;
  const authorImageUrl = `${siteUrl}${SITE_AUTHOR.imagePath}`;

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    dateModified: post.dateModified || post.date,
    author: {
      "@type": "Person",
      name: SITE_AUTHOR.fullName,
      url: authorAboutUrl,
      image: authorImageUrl,
      sameAs: SITE_AUTHOR.sameAs,
    },
    publisher: {
      "@type": "Organization",
      name: "Linkdinger",
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}/icon.png`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${siteUrl}/${locale}/blog/${encodeURIComponent(post.slug)}/`,
    },
    url: `${siteUrl}/${locale}/blog/${encodeURIComponent(post.slug)}/`,
    inLanguage: locale,
    ...(post.coverImage && { image: post.coverImage }),
    ...(post.tags &&
      post.tags.length > 0 && { keywords: post.tags.join(", ") }),
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: ["article h1", "article > p:first-of-type"],
    },
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
        name: t("breadcrumbBlog"),
        item: `${siteUrl}/${locale}/blog/`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: post.title,
        item: `${siteUrl}/${locale}/blog/${encodeURIComponent(post.slug)}/`,
      },
    ],
  };

  const faqSchema =
    post.faq && post.faq.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: post.faq.map((item) => ({
            "@type": "Question",
            name: item.question,
            acceptedAnswer: {
              "@type": "Answer",
              text: item.answer,
            },
          })),
        }
      : null;

  const howToSchema =
    post.howTo && post.howTo.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "HowTo",
          name: post.title,
          description: post.excerpt,
          step: post.howTo.map((step, i) => ({
            "@type": "HowToStep",
            position: i + 1,
            name: step.name,
            text: step.text,
          })),
        }
      : null;

  const schemas = [
    articleSchema,
    breadcrumbSchema,
    faqSchema,
    howToSchema,
  ].filter(Boolean);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas) }}
      />
      <PostDetail
        post={post}
        html={html}
        headings={headings}
        related={related}
        adjacent={adjacent}
        shareUrl={canonicalPostUrl}
      />
    </>
  );
}
