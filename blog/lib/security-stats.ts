import { fetchUpstashJson, getUpstashRestConfig } from "./upstash";

function parseCount(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

export interface SecurityStatsSnapshot {
  configured: boolean;
  totals: {
    aiBotBlocked: number;
    suspiciousThrottled: number;
  };
  byClassification: Array<{ label: string; blocked: number; throttled: number }>;
  byRouteFamily: Array<{ label: string; blocked: number; throttled: number }>;
  byStorage: Array<{ label: string; blocked: number; throttled: number }>;
}

const classificationRows = [
  ["ai-bot", "AI bot"],
  ["suspicious-automation", "Suspicious automation"],
  ["unknown", "Unknown"],
] as const;

const routeFamilyRows = [
  ["prompts", "Prompts"],
  ["blog", "Blog"],
  ["api", "API"],
  ["search", "Search"],
  ["other", "Other"],
] as const;

const storageRows = [
  ["upstash", "Upstash"],
  ["memory", "Memory fallback"],
] as const;

export async function getSecurityStats(): Promise<SecurityStatsSnapshot> {
  const { url, token } = getUpstashRestConfig();
  if (!url || !token) {
    return {
      configured: false,
      totals: { aiBotBlocked: 0, suspiciousThrottled: 0 },
      byClassification: [],
      byRouteFamily: [],
      byStorage: [],
    };
  }

  const keys = [
    "security:site:ai_bot_blocked",
    "security:site:suspicious_throttled",
    ...classificationRows.flatMap(([key]) => [
      `security:classification:${encodeURIComponent(key)}:ai_bot_blocked`,
      `security:classification:${encodeURIComponent(key)}:suspicious_throttled`,
    ]),
    ...routeFamilyRows.flatMap(([key]) => [
      `security:route-family:${encodeURIComponent(key)}:ai_bot_blocked`,
      `security:route-family:${encodeURIComponent(key)}:suspicious_throttled`,
    ]),
    ...storageRows.flatMap(([key]) => [
      `security:storage:${encodeURIComponent(key)}:ai_bot_blocked`,
      `security:storage:${encodeURIComponent(key)}:suspicious_throttled`,
    ]),
  ];

  const pipeline = keys.map((key) => ["GET", key]);
  let response: Array<{ result?: unknown }> | null = null;

  try {
    response = await fetchUpstashJson<Array<{ result?: unknown }>>("/pipeline", {
      method: "POST",
      body: pipeline,
    });
  } catch {
    return {
      configured: false,
      totals: { aiBotBlocked: 0, suspiciousThrottled: 0 },
      byClassification: [],
      byRouteFamily: [],
      byStorage: [],
    };
  }

  if (!response) {
    return {
      configured: false,
      totals: { aiBotBlocked: 0, suspiciousThrottled: 0 },
      byClassification: [],
      byRouteFamily: [],
      byStorage: [],
    };
  }

  const values = new Map<string, number>();
  keys.forEach((key, index) => {
    values.set(key, parseCount(response?.[index]?.result));
  });

  return {
    configured: true,
    totals: {
      aiBotBlocked: values.get("security:site:ai_bot_blocked") || 0,
      suspiciousThrottled: values.get("security:site:suspicious_throttled") || 0,
    },
    byClassification: classificationRows.map(([key, label]) => ({
      label,
      blocked: values.get(`security:classification:${encodeURIComponent(key)}:ai_bot_blocked`) || 0,
      throttled: values.get(`security:classification:${encodeURIComponent(key)}:suspicious_throttled`) || 0,
    })),
    byRouteFamily: routeFamilyRows.map(([key, label]) => ({
      label,
      blocked: values.get(`security:route-family:${encodeURIComponent(key)}:ai_bot_blocked`) || 0,
      throttled: values.get(`security:route-family:${encodeURIComponent(key)}:suspicious_throttled`) || 0,
    })),
    byStorage: storageRows.map(([key, label]) => ({
      label,
      blocked: values.get(`security:storage:${encodeURIComponent(key)}:ai_bot_blocked`) || 0,
      throttled: values.get(`security:storage:${encodeURIComponent(key)}:suspicious_throttled`) || 0,
    })),
  };
}
