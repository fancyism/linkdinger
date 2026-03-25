export const VIEW_COUNT_KEY_PREFIX = "page_views:";

export function getViewCountKey(slug: string): string {
  return `${VIEW_COUNT_KEY_PREFIX}${slug}`;
}

export function encodeViewCountKey(slug: string): string {
  return encodeURIComponent(getViewCountKey(slug));
}

export function buildViewCountKeysPath(slugs: string[]): string {
  return slugs.map((slug) => encodeViewCountKey(slug)).join("/");
}

export function parseViewCount(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsedValue = Number.parseInt(value, 10);
    return Number.isFinite(parsedValue) ? parsedValue : 0;
  }

  return 0;
}

export function attachViewCounts<T extends { slug: string }>(
  posts: T[],
  countsBySlug: Record<string, number>,
): Array<T & { _views: number }> {
  return posts.map((post) => ({
    ...post,
    _views: countsBySlug[post.slug] ?? 0,
  }));
}
