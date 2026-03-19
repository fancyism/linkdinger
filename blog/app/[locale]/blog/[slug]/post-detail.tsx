"use client";

import { Link } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import ReadingProgress from "@/components/reading-progress";
import TableOfContents from "@/components/table-of-contents";
import ShareButtons from "@/components/share-buttons";
import PostCard from "@/components/post-card";
import BrutalTag from "@/components/ui/brutal-tag";
import type { Post, TocItem } from "@/lib/posts";
import ViewCounter from "@/components/view-counter";
import GiscusComments from "@/components/giscus-comments";
import SeriesNav from "@/components/series-nav";

interface PostDetailProps {
  post: Post;
  html: string;
  headings: TocItem[];
  related: Post[];
  adjacent: { prev: Post | null; next: Post | null };
}

function formatPostDate(date: string, locale: string): string {
  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return date;
  }

  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(parsedDate);
}

function getReadTimeMinutes(readTime?: string): number | null {
  if (!readTime) {
    return null;
  }

  const match = readTime.match(/\d+/);
  return match ? Number.parseInt(match[0], 10) : null;
}

export default function PostDetail({
  post,
  html,
  headings,
  related,
  adjacent,
}: PostDetailProps) {
  const t = useTranslations("PostDetail");
  const locale = useLocale();
  const [isTagsExpanded, setIsTagsExpanded] = useState(false);
  const maxTags = 3;
  const formattedDate = formatPostDate(post.date, locale);
  const readTimeMinutes = getReadTimeMinutes(post.readTime);

  return (
    <>
      <ReadingProgress />

      <section className="relative overflow-hidden border-b border-white/10 px-4 pt-14 pb-10 sm:px-6 lg:pt-20 lg:pb-14 dark:border-white/10">
        {post.coverImage && (
          <>
            <div
              className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-50 dark:opacity-30"
              style={{ backgroundImage: `url(${post.coverImage})` }}
            />
            <div className="absolute inset-0 z-0 bg-gradient-to-t from-white via-white/90 to-transparent dark:from-[#0d0d0d] dark:via-[#0d0d0d]/70" />
            <div className="absolute inset-0 z-0 bg-gradient-to-b from-white/50 to-transparent dark:from-[#0d0d0d]/40" />
          </>
        )}

        <div className="absolute bottom-0 left-0 right-0 z-[5] h-40 bg-gradient-to-t from-[#f8f9fa] to-transparent dark:from-[#0d0d0d]" />

        <div className="relative z-10 mx-auto max-w-[72ch]">
          <Link
            href="/blog"
            className="mb-8 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400 transition-colors hover:text-peach"
          >
            <ArrowLeft size={14} />
            {t("backToIndex")}
          </Link>

          <h1 className="mb-6 text-4xl font-display font-black leading-[1.15] tracking-tight text-stroke-hero sm:text-5xl lg:text-[3.5rem]">
            {post.title}
          </h1>

          <div className="flex flex-wrap items-center gap-3 text-xs font-display font-medium uppercase tracking-widest text-gray-400">
            <time className="font-semibold text-peach">{formattedDate}</time>
            <span className="opacity-30">&middot;</span>
            <span>
              {readTimeMinutes
                ? t("readTime", { minutes: readTimeMinutes })
                : post.readTime}
            </span>
            <span className="opacity-30">&middot;</span>
            <ViewCounter slug={post.slug} trackView={true} />

            {post.tags && post.tags.length > 0 && (
              <>
                <span className="opacity-30">&middot;</span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {(isTagsExpanded
                    ? post.tags
                    : post.tags.slice(0, maxTags)
                  ).map((tag) => (
                    <Link
                      key={tag}
                      href={`/blog/tag/${encodeURIComponent(tag)}`}
                    >
                      <BrutalTag className="cursor-pointer px-2.5 py-0.5 text-[0.65rem] transition-colors hover:border-peach hover:bg-peach/10 hover:text-peach">
                        {tag}
                      </BrutalTag>
                    </Link>
                  ))}
                  {post.tags.length > maxTags && !isTagsExpanded && (
                    <button
                      onClick={() => setIsTagsExpanded(true)}
                      className="rounded-full border border-dashed border-white/20 px-2 py-0.5 text-[0.6rem] font-display text-gray-400 transition-colors hover:border-peach hover:text-peach"
                    >
                      {t("moreTags", { count: post.tags.length - maxTags })}
                    </button>
                  )}
                  {post.tags.length > maxTags && isTagsExpanded && (
                    <button
                      onClick={() => setIsTagsExpanded(false)}
                      className="text-[0.6rem] font-display text-gray-400 transition-colors hover:text-peach"
                    >
                      {t("less")}
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="px-4 pt-10 pb-6 sm:px-6">
        <div className="mx-auto flex max-w-5xl justify-center gap-14">
          <article
            className="prose min-w-0 w-full"
            dangerouslySetInnerHTML={{ __html: html }}
          />

          {headings.length > 0 && (
            <aside className="hidden w-52 shrink-0 self-start xl:block">
              <div className="sticky top-24">
                <TableOfContents headings={headings} />
              </div>
            </aside>
          )}
        </div>
      </section>

      <footer className="mx-auto max-w-[72ch] px-4 pb-16 sm:px-6">
        <div className="mb-2 border-t border-white/10 pt-8 dark:border-white/10">
          <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <span className="text-sm font-medium tracking-wide text-gray-500">
              {t("shareLabel")}
            </span>
            <ShareButtons title={post.title} excerpt={post.excerpt} />
          </div>
        </div>

        <SeriesNav adjacent={adjacent} />
        <GiscusComments />
      </footer>

      {related.length > 0 && (
        <section className="border-t border-white/5 px-4 pb-20 sm:px-6">
          <div className="mx-auto max-w-6xl pt-12">
            <h2 className="mb-8 text-2xl font-display font-bold text-white dark:text-white">
              {t("relatedPosts")}
            </h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {related.map((relatedPost) => (
                <PostCard
                  key={relatedPost.slug}
                  slug={relatedPost.slug}
                  title={relatedPost.title}
                  date={relatedPost.date}
                  excerpt={relatedPost.excerpt}
                  tags={relatedPost.tags}
                  readTime={relatedPost.readTime}
                  coverImage={relatedPost.coverImage}
                />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
