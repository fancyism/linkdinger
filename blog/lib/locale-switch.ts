export interface ResolveLocaleSwitchOptions {
  locale: string;
  pathname?: string | null;
  search?: string;
  slugParam?: string | string[];
  postLocaleAlternates?: Record<string, string>;
}

export interface LocaleSwitchTarget {
  alternateLocale: string;
  href: string;
  linkLocale?: string;
  useRawHref: boolean;
}

export function normalizePathname(pathname?: string | null): string {
  return (pathname || "/").replace(/\/$/, "") || "/";
}

export function isBlogPostPath(pathname?: string | null): boolean {
  const normalizedPathname = normalizePathname(pathname);
  return (
    normalizedPathname.includes("/blog/") &&
    !normalizedPathname.includes("/blog/tag/")
  );
}

export function normalizeSlugParam(
  slugParam?: string | string[] | null,
): string | null {
  if (!slugParam) {
    return null;
  }

  const rawSlug = Array.isArray(slugParam) ? slugParam.join("/") : slugParam;
  return rawSlug ? decodeURIComponent(rawSlug) : null;
}

export function resolveLocaleSwitchTarget({
  locale,
  pathname,
  search = "",
  slugParam,
  postLocaleAlternates = {},
}: ResolveLocaleSwitchOptions): LocaleSwitchTarget {
  const alternateLocale = locale === "en" ? "th" : "en";
  const basePathname = pathname || "/";
  const querySuffix = search ? `?${search}` : "";
  const onPostPage = isBlogPostPath(pathname);
  const currentPostSlug = onPostPage ? normalizeSlugParam(slugParam) : null;
  const alternatePostHref = currentPostSlug
    ? postLocaleAlternates[`${locale}:${currentPostSlug}`]
    : undefined;

  if (alternatePostHref) {
    return {
      alternateLocale,
      href: `${alternatePostHref}${querySuffix}`,
      useRawHref: true,
    };
  }

  if (onPostPage) {
    return {
      alternateLocale,
      href: `/${alternateLocale}/blog/${querySuffix}`,
      useRawHref: true,
    };
  }

  return {
    alternateLocale,
    href: `${basePathname}${querySuffix}`,
    linkLocale: alternateLocale,
    useRawHref: false,
  };
}
