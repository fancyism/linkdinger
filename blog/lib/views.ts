import { Post } from "./posts";
import {
  attachViewCounts,
  buildViewCountKeysPath,
  parseViewCount,
} from "./view-counts";

export interface PopularPost extends Post {
  _views: number;
}

function getUpstashViewConfig(): { url?: string; token?: string } {
  return {
    url:
      process.env.NEXT_PUBLIC_UPSTASH_REDIS_REST_URL ||
      process.env.UPSTASH_REDIS_REST_URL,
    token:
      process.env.NEXT_PUBLIC_UPSTASH_REDIS_REST_TOKEN ||
      process.env.UPSTASH_REDIS_REST_TOKEN,
  };
}

function sortPostsByViews<T extends { _views: number }>(posts: T[]): T[] {
  return [...posts].sort((a, b) => b._views - a._views);
}

export async function getViewCountsBySlug(
  slugs: string[],
): Promise<Record<string, number>> {
  const { url, token } = getUpstashViewConfig();

  if (!url || !token || slugs.length === 0) {
    return {};
  }

  try {
    const response = await fetch(
      `${url}/mget/${buildViewCountKeysPath(slugs)}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        next: { revalidate: 3600 },
      },
    );

    if (!response.ok) {
      return {};
    }

    const data = await response.json();
    const counts = Array.isArray(data.result) ? data.result : [];

    return Object.fromEntries(
      slugs.map((slug, index) => [slug, parseViewCount(counts[index])]),
    );
  } catch (error) {
    console.error("Failed to fetch view counts", error);
    return {};
  }
}

export async function getPostsWithViews(posts: Post[]): Promise<PopularPost[]> {
  const viewCountsBySlug = await getViewCountsBySlug(
    posts.map((post) => post.slug),
  );
  return attachViewCounts(posts, viewCountsBySlug);
}

export async function getPopularPosts(
  posts: Post[],
  limit: number = 4,
): Promise<PopularPost[]> {
  const postsWithViews = await getPostsWithViews(posts);
  return sortPostsByViews(postsWithViews).slice(0, limit);
}
