import { getAllPosts } from "@/lib/posts";
import {
  getHomePostsPerPage,
  getTotalPages,
  paginatePosts,
  splitHomePosts,
} from "@/lib/home-layout";
import { getTranslations } from "next-intl/server";
import Hero from "@/components/hero";
import PostCard from "@/components/post-card";
import NewsletterForm from "@/components/newsletter-form";
import HomeGallery from "@/components/home-gallery";
import Pagination from "@/components/pagination";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export function generateStaticParams({
  params,
}: {
  params: { locale: string };
}) {
  const posts = getAllPosts(params.locale);
  const postsPerPage = getHomePostsPerPage();
  const totalPages = getTotalPages(posts.length, postsPerPage);

  const paths = [];
  for (let i = 2; i <= totalPages; i++) {
    paths.push({ page: i.toString() });
  }

  return paths;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; page: string }>;
}): Promise<Metadata> {
  const { locale, page } = await params;

  return {
    alternates: {
      canonical: `/${locale}/page/${page}/`,
    },
  };
}

export default async function PaginatedHomePage({
  params,
}: {
  params: Promise<{ locale: string; page: string }>;
}) {
  const { locale, page: pageParam } = await params;
  const page = parseInt(pageParam, 10);
  const allPosts = getAllPosts(locale);
  const postsPerPage = getHomePostsPerPage();
  const totalPages = getTotalPages(allPosts.length, postsPerPage);
  const t = await getTranslations({
    locale,
    namespace: "PaginatedHomePage",
  });

  if (isNaN(page) || page < 1 || page > totalPages) {
    notFound();
  }

  const currentPosts = paginatePosts(allPosts, page, postsPerPage);
  const { featured, gridPosts, listPosts } = splitHomePosts(currentPosts);

  const getAspectForHome = (index: number) => {
    const pattern = ["portrait", "square", "wide", "wide"];
    return pattern[index % pattern.length] as "portrait" | "square" | "wide";
  };

  return (
    <>
      <section className="pt-8 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          {featured && (
            <Hero
              title={featured.title}
              excerpt={featured.excerpt}
              slug={featured.slug}
              date={featured.date}
              readTime={featured.readTime || "5 min"}
              tags={featured.tags}
              coverImage={featured.coverImage}
            />
          )}
        </div>
      </section>

      {gridPosts.length > 0 && (
        <section className="py-16 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-20">
              {gridPosts.map((post, index) => (
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
                  variant="grid"
                  imageAspect={getAspectForHome(index)}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {listPosts.length > 0 && (
        <section className="py-12 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto">
            <HomeGallery posts={listPosts} />
          </div>
        </section>
      )}

      {totalPages > 1 && (
        <section className="pb-12 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto flex justify-center">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              basePath="/"
            />
          </div>
        </section>
      )}

      <section className="pb-20 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto">
          <div className="liquid-glass rounded-2xl p-8 text-center">
            <h3 className="text-xl font-display font-bold mb-2">
              {t("newsletterTitle")}
            </h3>
            <p className="text-gray-400 mb-5 text-sm">{t("newsletterBody")}</p>
            <NewsletterForm />
          </div>
        </div>
      </section>
    </>
  );
}
