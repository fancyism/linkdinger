import { timingSafeEqual } from "node:crypto";
import {
  isSecureAnalyticsEventName,
  type AnalyticsEventPayload,
  type SecureAnalyticsEventName,
} from "./analytics";

const BEARER_PREFIX = "Bearer ";
const ANALYTICS_INGEST_DEDUPE_PREFIX = "analytics:dedupe";
export const ANALYTICS_INGEST_HEADER = "x-analytics-key";
export const ANALYTICS_INGEST_TTL_SECONDS = 60 * 60 * 24 * 7;

interface HeaderBag {
  get(name: string): string | null;
}

export interface AnalyticsConversionPayload extends Omit<
  AnalyticsEventPayload,
  "event"
> {
  event: SecureAnalyticsEventName;
  externalId: string;
  source?: string;
  currency?: string;
}

function parseRevenueCents(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.round(value);
  }

  if (typeof value === "string" && value.trim()) {
    const parsedValue = Number.parseInt(value, 10);
    return Number.isFinite(parsedValue) ? parsedValue : undefined;
  }

  return undefined;
}

export function getAnalyticsIngestToken(): string | undefined {
  return process.env.ANALYTICS_INGEST_TOKEN;
}

export function getAnalyticsIngestRequestToken(
  headers: HeaderBag,
): string | null {
  const authorizationHeader = headers.get("authorization");
  if (authorizationHeader?.startsWith(BEARER_PREFIX)) {
    return authorizationHeader.slice(BEARER_PREFIX.length).trim() || null;
  }

  return headers.get(ANALYTICS_INGEST_HEADER);
}

export function isAuthorizedAnalyticsIngestToken(
  providedToken: string | null | undefined,
  expectedToken: string | undefined = getAnalyticsIngestToken(),
): boolean {
  if (!providedToken || !expectedToken) {
    return false;
  }

  const providedBuffer = Buffer.from(providedToken);
  const expectedBuffer = Buffer.from(expectedToken);
  if (providedBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(providedBuffer, expectedBuffer);
}

export function getAnalyticsIngestDedupeKey(
  event: SecureAnalyticsEventName,
  externalId: string,
): string {
  return `${ANALYTICS_INGEST_DEDUPE_PREFIX}:${event}:${encodeURIComponent(
    externalId.trim(),
  )}`;
}

export function normalizeConversionPayload(
  payload: unknown,
): AnalyticsConversionPayload | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const candidate = payload as Record<string, unknown>;
  if (!isSecureAnalyticsEventName(candidate.event)) {
    return null;
  }

  if (
    typeof candidate.externalId !== "string" ||
    !candidate.externalId.trim()
  ) {
    return null;
  }

  const normalizedPayload: AnalyticsConversionPayload = {
    event: candidate.event,
    externalId: candidate.externalId.trim(),
    slug: typeof candidate.slug === "string" ? candidate.slug : undefined,
    locale: typeof candidate.locale === "string" ? candidate.locale : undefined,
    category:
      typeof candidate.category === "string" ? candidate.category : undefined,
    pathname:
      typeof candidate.pathname === "string" ? candidate.pathname : undefined,
    ctaId: typeof candidate.ctaId === "string" ? candidate.ctaId : undefined,
    placement:
      typeof candidate.placement === "string" ? candidate.placement : undefined,
    outboundUrl:
      typeof candidate.outboundUrl === "string"
        ? candidate.outboundUrl
        : undefined,
    revenueCents: parseRevenueCents(candidate.revenueCents),
    source: typeof candidate.source === "string" ? candidate.source : undefined,
    currency:
      typeof candidate.currency === "string"
        ? candidate.currency.toUpperCase()
        : undefined,
  };

  if (
    normalizedPayload.event === "revenue_realized" &&
    (!normalizedPayload.revenueCents || normalizedPayload.revenueCents <= 0)
  ) {
    return null;
  }

  return normalizedPayload;
}
