"use client";

import type {
  ArticleAttribution,
  PublicAnalyticsEventPayload,
} from "./analytics";
import {
  ARTICLE_ATTRIBUTION_STORAGE_KEY,
  ARTICLE_ATTRIBUTION_TTL_MS,
} from "./analytics";

function canUseBrowserStorage(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

export function rememberArticleAttribution(
  attribution: Omit<ArticleAttribution, "capturedAt">,
): void {
  if (!canUseBrowserStorage()) {
    return;
  }

  const storedAttribution: ArticleAttribution = {
    ...attribution,
    capturedAt: Date.now(),
  };

  localStorage.setItem(
    ARTICLE_ATTRIBUTION_STORAGE_KEY,
    JSON.stringify(storedAttribution),
  );
}

export function getStoredArticleAttribution(): ArticleAttribution | null {
  if (!canUseBrowserStorage()) {
    return null;
  }

  const rawValue = localStorage.getItem(ARTICLE_ATTRIBUTION_STORAGE_KEY);
  if (!rawValue) {
    return null;
  }

  try {
    const attribution = JSON.parse(rawValue) as ArticleAttribution;
    if (!attribution.slug || !attribution.capturedAt) {
      return null;
    }

    if (Date.now() - attribution.capturedAt > ARTICLE_ATTRIBUTION_TTL_MS) {
      localStorage.removeItem(ARTICLE_ATTRIBUTION_STORAGE_KEY);
      return null;
    }

    return attribution;
  } catch {
    localStorage.removeItem(ARTICLE_ATTRIBUTION_STORAGE_KEY);
    return null;
  }
}

export function trackAnalyticsEvent(
  payload: PublicAnalyticsEventPayload,
): void {
  if (typeof window === "undefined") {
    return;
  }

  const attribution = getStoredArticleAttribution();
  const mergedPayload: PublicAnalyticsEventPayload = {
    pathname: window.location.pathname,
    slug: payload.slug ?? attribution?.slug,
    locale: payload.locale ?? attribution?.locale,
    category: payload.category ?? attribution?.category,
    ...payload,
  };

  void fetch("/api/analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(mergedPayload),
    keepalive: true,
    credentials: "same-origin",
  }).catch(() => undefined);
}
