"use client";

import Link from "next/link";
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
import Reactions from "@/components/reactions";
import SeriesNav from "@/components/series-nav";

interface PostDetailProps {
  post: Post;
  html: string;
  headings: TocItem[];
  related: Post[];
  adjacent: { prev: Post | null; next: Post | null };
}

export default function PostDetail({
  post,
  html,
  headings,
  related,
  adjacent,
}: PostDetailProps) {
  const [isTagsExpanded, setIsTagsExpanded] = useState(false);
  const MAX_TAGS = 3;

  return (
    <>
      <ReadingProgress />

      {/* ── Hero ── */}
      <section className="relative pt-14 lg:pt-20 pb-10 lg:pb-14 px-4 sm:px-6 border-b border-white/10 dark:border-white/10 overflow-hidden">
        {/* Background image layers */}
        {post.coverImage && (
          <>
            <div
              className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-50 dark:opacity-30"
              style={{ backgroundImage: `url(${post.coverImage})` }}
            />
            <div className="absolute inset-0 z-0 bg-gradient-to-t from-white via-white/90 dark:from-[#0d0d0d] dark:via-[#0d0d0d]/70 to-transparent" />
            <div className="absolute inset-0 z-0 bg-gradient-to-b from-white/50 dark:from-[#0d0d0d]/40 to-transparent" />
          </>
        )}

        {/* Hero content — same max-width as article body for visual alignment */}
        <div className="max-w-[72ch] mx-auto relative z-10">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-xs text-gray-400 hover:text-peach transition-colors mb-8 font-bold tracking-widest uppercase"
          >
            <ArrowLeft size={14} />
            Back to Index
          </Link>

          <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-display font-black text-stroke-hero leading-[1.15] tracking-tight mb-6">
            {post.title}
          </h1>

          {/* Metadata row */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 font-medium font-display tracking-widest uppercase">
            <time className="text-peach font-semibold">{post.date}</time>
            <span className="opacity-30">·</span>
            <span>{post.readTime} read</span>
            <span className="opacity-30">·</span>
            <ViewCounter slug={post.slug} trackView={true} />

            {post.tags && post.tags.length > 0 && (
              <>
                <span className="opacity-30">·</span>
                <div className="flex flex-wrap gap-1.5 items-center">
                  {(isTagsExpanded
                    ? post.tags
                    : post.tags.slice(0, MAX_TAGS)
                  ).map((tag) => (
                    <Link
                      key={tag}
                      href={`/blog/tag/${encodeURIComponent(tag)}`}
                    >
                      <BrutalTag className="hover:border-peach hover:text-peach hover:bg-peach/10 transition-colors cursor-pointer text-[0.65rem] py-0.5 px-2.5">
                        {tag}
                      </BrutalTag>
                    </Link>
                  ))}
                  {post.tags.length > MAX_TAGS && !isTagsExpanded && (
                    <button
                      onClick={() => setIsTagsExpanded(true)}
                      className="text-[0.6rem] font-display px-2 py-0.5 rounded-full border border-dashed border-white/20 text-gray-400 hover:text-peach hover:border-peach transition-colors"
                    >
                      +{post.tags.length - MAX_TAGS}
                    </button>
                  )}
                  {post.tags.length > MAX_TAGS && isTagsExpanded && (
                    <button
                      onClick={() => setIsTagsExpanded(false)}
                      className="text-[0.6rem] font-display text-gray-400 hover:text-peach transition-colors"
                    >
                      less
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── Article Body + Sticky TOC ── */}
      {/*
                Layout logic:
                - On < xl: article is centered at max 72ch via prose CSS
                - On xl+: article (72ch) + gap + TOC (w-52) are flex-centered as a group
                  Total ≈ 720 + 56 + 208 = 984px inside max-w-5xl (1024px) — near-perfect balance
            */}
      <section className="pt-10 pb-6 px-4 sm:px-6">
        <div className="flex justify-center gap-14 max-w-5xl mx-auto">
          {/* Article */}
          <article
            className="prose w-full min-w-0"
            dangerouslySetInnerHTML={{ __html: html }}
          />

          {/* TOC — sticky sidebar, only on xl+ */}
          {headings.length > 0 && (
            <aside className="hidden xl:block w-52 shrink-0 self-start">
              <div className="sticky top-24">
                <TableOfContents headings={headings} />
              </div>
            </aside>
          )}
        </div>
      </section>

      {/* ── Post Footer (Share → Reactions → Series Nav → Comments) ── */}
      {/* All sections share the same max-width as the article for perfect alignment */}
      <footer className="max-w-[72ch] mx-auto px-4 sm:px-6 pb-16">
        {/* Divider + Share row */}
        <div className="border-t border-white/10 dark:border-white/10 pt-8 mb-2">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <span className="text-sm font-medium text-gray-500 tracking-wide">
              Share this post
            </span>
            <ShareButtons title={post.title} />
          </div>

          {/* Reactions */}
          <Reactions slug={post.slug} />
        </div>

        {/* Series / Adjacent post navigation */}
        <SeriesNav adjacent={adjacent} />

        {/* Giscus comments */}
        <GiscusComments />
      </footer>

      {/* ── Related Posts ── */}
      {related.length > 0 && (
        <section className="pb-20 px-4 sm:px-6 border-t border-white/5">
          <div className="max-w-6xl mx-auto pt-12">
            <h2 className="text-2xl font-display font-bold mb-8 text-white dark:text-white">
              Related Posts
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {related.map((p) => (
                <PostCard
                  key={p.slug}
                  slug={p.slug}
                  title={p.title}
                  date={p.date}
                  excerpt={p.excerpt}
                  tags={p.tags}
                  readTime={p.readTime}
                  coverImage={p.coverImage}
                />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
