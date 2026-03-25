export const ANALYTICS_STORAGE_PREFIX = "analytics";

export const analyticsEventNames = [
  "cta_click",
  "affiliate_click",
  "email_opt_in",
  "consultation_click",
  "consultation_submit",
  "consultation_booked",
  "revenue_realized",
] as const;

export type AnalyticsEventName = (typeof analyticsEventNames)[number];

export const publicAnalyticsEventNames = [
  "cta_click",
  "affiliate_click",
  "email_opt_in",
  "consultation_click",
  "consultation_submit",
] as const;

export type PublicAnalyticsEventName =
  (typeof publicAnalyticsEventNames)[number];

export const secureAnalyticsEventNames = [
  "consultation_booked",
  "revenue_realized",
] as const;

export type SecureAnalyticsEventName =
  (typeof secureAnalyticsEventNames)[number];

export const analyticsMetricNames = [
  "cta_clicks",
  "affiliate_clicks",
  "email_opt_ins",
  "consultation_clicks",
  "consultation_submits",
  "consultation_bookings",
  "estimated_revenue_cents",
  "realized_revenue_cents",
] as const;

export type AnalyticsMetricName = (typeof analyticsMetricNames)[number];

export interface AnalyticsEventPayload {
  event: AnalyticsEventName;
  slug?: string;
  locale?: string;
  category?: string;
  pathname?: string;
  ctaId?: string;
  placement?: string;
  outboundUrl?: string;
  revenueCents?: number;
}

export interface PublicAnalyticsEventPayload extends Omit<
  AnalyticsEventPayload,
  "event"
> {
  event: PublicAnalyticsEventName;
}

export interface ArticleAttribution {
  slug: string;
  locale?: string;
  category?: string;
  title?: string;
  capturedAt: number;
}

export const ARTICLE_ATTRIBUTION_STORAGE_KEY =
  "linkdinger:last-article-attribution";
export const ARTICLE_ATTRIBUTION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

const eventToMetrics: Record<AnalyticsEventName, AnalyticsMetricName[]> = {
  cta_click: ["cta_clicks"],
  affiliate_click: ["cta_clicks", "affiliate_clicks"],
  email_opt_in: ["cta_clicks", "email_opt_ins"],
  consultation_click: ["cta_clicks", "consultation_clicks"],
  consultation_submit: ["consultation_submits"],
  consultation_booked: ["consultation_bookings"],
  revenue_realized: ["realized_revenue_cents"],
};

function encodeAnalyticsKeySegment(value: string): string {
  return encodeURIComponent(value.trim());
}

export function isAnalyticsEventName(
  value: unknown,
): value is AnalyticsEventName {
  return (
    typeof value === "string" &&
    analyticsEventNames.includes(value as AnalyticsEventName)
  );
}

export function isPublicAnalyticsEventName(
  value: unknown,
): value is PublicAnalyticsEventName {
  return (
    typeof value === "string" &&
    publicAnalyticsEventNames.includes(value as PublicAnalyticsEventName)
  );
}

export function isSecureAnalyticsEventName(
  value: unknown,
): value is SecureAnalyticsEventName {
  return (
    typeof value === "string" &&
    secureAnalyticsEventNames.includes(value as SecureAnalyticsEventName)
  );
}

export function getMetricsForAnalyticsEvent(
  event: AnalyticsEventName,
): AnalyticsMetricName[] {
  return eventToMetrics[event];
}

export function getAnalyticsKey(
  scope: "site" | "article" | "category" | "cta",
  metric: AnalyticsMetricName,
  segment?: string,
): string {
  if (scope === "site") {
    return `${ANALYTICS_STORAGE_PREFIX}:site:${metric}`;
  }

  if (!segment) {
    throw new Error(`Segment is required for analytics scope "${scope}"`);
  }

  return `${ANALYTICS_STORAGE_PREFIX}:${scope}:${encodeAnalyticsKeySegment(segment)}:${metric}`;
}

export function parseAnalyticsCount(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsedValue = Number.parseInt(value, 10);
    return Number.isFinite(parsedValue) ? parsedValue : 0;
  }

  return 0;
}

export function calculateRate(numerator: number, denominator: number): number {
  if (!denominator) {
    return 0;
  }

  return Number(((numerator / denominator) * 100).toFixed(2));
}

export function buildAnalyticsIncrementCommands(
  payload: AnalyticsEventPayload,
): string[][] {
  const commands: string[][] = [];
  const metrics = getMetricsForAnalyticsEvent(payload.event);

  metrics.forEach((metric) => {
    commands.push(["INCRBY", getAnalyticsKey("site", metric), "1"]);

    if (payload.slug) {
      commands.push([
        "INCRBY",
        getAnalyticsKey("article", metric, payload.slug),
        "1",
      ]);
    }

    if (payload.category) {
      commands.push([
        "INCRBY",
        getAnalyticsKey("category", metric, payload.category),
        "1",
      ]);
    }

    if (payload.ctaId) {
      commands.push([
        "INCRBY",
        getAnalyticsKey("cta", metric, payload.ctaId),
        "1",
      ]);
    }
  });

  if (
    payload.event === "affiliate_click" &&
    typeof payload.revenueCents === "number" &&
    payload.revenueCents > 0
  ) {
    const revenue = String(Math.round(payload.revenueCents));
    commands.push([
      "INCRBY",
      getAnalyticsKey("site", "estimated_revenue_cents"),
      revenue,
    ]);

    if (payload.slug) {
      commands.push([
        "INCRBY",
        getAnalyticsKey("article", "estimated_revenue_cents", payload.slug),
        revenue,
      ]);
    }

    if (payload.category) {
      commands.push([
        "INCRBY",
        getAnalyticsKey(
          "category",
          "estimated_revenue_cents",
          payload.category,
        ),
        revenue,
      ]);
    }
  }

  if (
    (payload.event === "consultation_booked" ||
      payload.event === "revenue_realized") &&
    typeof payload.revenueCents === "number" &&
    payload.revenueCents > 0
  ) {
    const revenue = String(Math.round(payload.revenueCents));
    commands.push([
      "INCRBY",
      getAnalyticsKey("site", "realized_revenue_cents"),
      revenue,
    ]);

    if (payload.slug) {
      commands.push([
        "INCRBY",
        getAnalyticsKey("article", "realized_revenue_cents", payload.slug),
        revenue,
      ]);
    }

    if (payload.category) {
      commands.push([
        "INCRBY",
        getAnalyticsKey("category", "realized_revenue_cents", payload.category),
        revenue,
      ]);
    }
  }

  return commands;
}
