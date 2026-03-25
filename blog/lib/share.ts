export const DEFAULT_SHARE_SITE_URL = "https://linkdinger.com";

export interface ShareLinks {
  fullUrl: string;
  shareText: string;
  tweetUrl: string;
  linkedinUrl: string;
  facebookUrl: string;
  lineUrl: string;
}

export function getInitialShareUrl(
  url?: string,
  siteUrl: string = DEFAULT_SHARE_SITE_URL,
): string {
  return url || siteUrl;
}

export function toAbsoluteShareUrl(
  url: string,
  siteUrl: string = DEFAULT_SHARE_SITE_URL,
): string {
  try {
    return new URL(url, siteUrl).toString();
  } catch {
    return url.startsWith("http") ? url : `${siteUrl}${url}`;
  }
}

export function getShareText(title: string, excerpt?: string): string {
  return excerpt ? `${title}\n\n${excerpt}` : title;
}

export function buildShareLinks({
  title,
  excerpt,
  url,
  siteUrl = DEFAULT_SHARE_SITE_URL,
}: {
  title: string;
  excerpt?: string;
  url: string;
  siteUrl?: string;
}): ShareLinks {
  const fullUrl = toAbsoluteShareUrl(url, siteUrl);
  const shareText = getShareText(title, excerpt);

  return {
    fullUrl,
    shareText,
    tweetUrl: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(fullUrl)}`,
    linkedinUrl: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(fullUrl)}`,
    facebookUrl: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullUrl)}`,
    lineUrl: `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(fullUrl)}&text=${encodeURIComponent(shareText)}`,
  };
}
