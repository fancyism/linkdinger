import { fetchUpstashJson, getUpstashRestConfig } from "./upstash";

export type SecurityEventType = "ai_bot_blocked" | "suspicious_throttled";

export interface SecurityEventPayload {
  path: string;
  userAgent: string | null;
  ip: string;
  classification: string;
  retryAfterSeconds?: number;
  storage?: string;
}

export function getSecurityRouteFamily(path: string): string {
  if (path.startsWith("/api/")) return "api";
  if (path.includes("/prompts/")) return "prompts";
  if (path.includes("/blog/")) return "blog";
  if (path.includes("/search")) return "search";
  return "other";
}

function encodeSegment(value: string): string {
  return encodeURIComponent(value.trim());
}

export function buildSecurityEventCommands(
  type: SecurityEventType,
  payload: SecurityEventPayload,
): string[][] {
  const routeFamily = getSecurityRouteFamily(payload.path);
  const commands: string[][] = [
    ["INCRBY", `security:site:${type}`, "1"],
    ["INCRBY", `security:classification:${encodeSegment(payload.classification)}:${type}`, "1"],
    ["INCRBY", `security:path:${encodeSegment(payload.path)}:${type}`, "1"],
    ["INCRBY", `security:route-family:${encodeSegment(routeFamily)}:${type}`, "1"],
  ];

  if (payload.storage) {
    commands.push([
      "INCRBY",
      `security:storage:${encodeSegment(payload.storage)}:${type}`,
      "1",
    ]);
  }

  return commands;
}

export async function persistSecurityEvent(
  type: SecurityEventType,
  payload: SecurityEventPayload,
) {
  const { url, token } = getUpstashRestConfig();
  if (!url || !token) {
    return false;
  }

  const commands = buildSecurityEventCommands(type, payload);
  const result = await fetchUpstashJson<Array<{ result?: unknown }>>("/pipeline", {
    method: "POST",
    body: commands,
  });

  return Array.isArray(result);
}
