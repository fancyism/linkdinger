import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getAllTags, getPostsByTag } from "@/lib/posts";
import PostCard from "@/components/post-card";

export function generateStaticParams({
  params,
}: {
  params: { locale: string };
}) {
  return getAllTags(params.locale).map((tag) => ({
    tag,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; tag: string }>;
}) {
  const { locale, tag: tagParam } = await params;
  const tag = decodeURIComponent(tagParam);
  const t = await getTranslations({ locale, namespace: "TagPage" });

  return {
    title: t("title", { tag }),
    description: t("description", { tag }),
    alternates: {
      canonical: `/${locale}/blog/tag/${encodeURIComponent(tag)}/`,
    },
  };
}

export default async function TagPage({
  params,
}: {
  params: Promise<{ locale: string; tag: string }>;
}) {
  const { locale, tag: tagParam } = await params;
  const tag = decodeURIComponent(tagParam);
  const posts = getPostsByTag(tag, locale);

  if (posts.length === 0) {
    notFound();
  }

  const t = await getTranslations({ locale, namespace: "TagPage" });

  return (
    <section className="px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10">
          <Link
            href="/blog"
            className="mb-4 inline-flex items-center gap-2 text-sm text-gray-400 transition-colors hover:text-peach"
          >
            <ArrowLeft size={14} />
            {t("backToBlog")}
          </Link>
          <div className="flex items-center gap-4">
            <span className="inline-block rounded-full border border-peach/30 bg-peach/10 px-4 py-1.5 text-lg font-display font-bold text-peach">
              #{tag}
            </span>
            <span className="font-display text-gray-400">
              {t("count", { count: posts.length })}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-x-10 gap-y-20 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post, index) => (
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
            />
          ))}
        </div>
      </div>
    </section>
  );
}
