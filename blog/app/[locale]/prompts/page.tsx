import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import {
  getAllPrompts,
  getAllPromptPlatforms,
  getAllPromptCategories,
} from "@/lib/prompts";
import PromptGalleryClient from "@/components/prompt-gallery-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "PromptsPage" });

  return {
    title: t("title"),
    description: t("metaDescription"),
    alternates: {
      canonical: `/${locale}/prompts/`,
    },
  };
}

export default async function PromptsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const prompts = getAllPrompts(locale);
  const platforms = getAllPromptPlatforms(locale);
  const categories = getAllPromptCategories(locale);

  return (
    <PromptGalleryClient
      prompts={prompts}
      platforms={platforms}
      categories={categories}
    />
  );
}
