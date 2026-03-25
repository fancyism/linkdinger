import { NextRequest, NextResponse } from "next/server";
import { buildAnalyticsIncrementCommands } from "@/lib/analytics";
import {
  ANALYTICS_INGEST_TTL_SECONDS,
  getAnalyticsIngestDedupeKey,
  getAnalyticsIngestRequestToken,
  getAnalyticsIngestToken,
  isAuthorizedAnalyticsIngestToken,
  normalizeConversionPayload,
} from "@/lib/analytics-ingest";
import { fetchUpstashJson, getUpstashRestConfig } from "@/lib/upstash";

export const dynamic = "force-dynamic";

async function reserveDedupeKey(dedupeKey: string): Promise<boolean> {
  const result = await fetchUpstashJson<Array<{ result?: string | null }>>(
    "/pipeline",
    {
      method: "POST",
      body: [["SET", dedupeKey, "1", "EX", `${ANALYTICS_INGEST_TTL_SECONDS}`, "NX"]],
    },
  );

  return result?.[0]?.result === "OK";
}

export async function POST(request: NextRequest) {
  const ingestToken = getAnalyticsIngestToken();
  if (!ingestToken) {
    return NextResponse.json(
      { error: "Analytics ingest token is not configured" },
      { status: 503 },
    );
  }

  const requestToken = getAnalyticsIngestRequestToken(request.headers);
  if (!isAuthorizedAnalyticsIngestToken(requestToken, ingestToken)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = normalizeConversionPayload(
    await request.json().catch(() => null),
  );
  if (!payload) {
    return NextResponse.json(
      { error: "Invalid conversion payload" },
      { status: 400 },
    );
  }

  const { url, token } = getUpstashRestConfig();
  if (!url || !token) {
    return NextResponse.json({ ok: true, skipped: "upstash_unconfigured" });
  }

  const dedupeKey = getAnalyticsIngestDedupeKey(payload.event, payload.externalId);
  const isFreshEvent = await reserveDedupeKey(dedupeKey);
  if (!isFreshEvent) {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  const commands = buildAnalyticsIncrementCommands(payload);
  if (!commands.length) {
    return NextResponse.json({ ok: true, skipped: "no_commands" });
  }

  try {
    await fetchUpstashJson("/pipeline", {
      method: "POST",
      body: commands,
    });
  } catch (error) {
    console.error("Failed to record analytics conversion", error);
    return NextResponse.json(
      { error: "Failed to persist conversion event" },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true, event: payload.event }, { status: 202 });
}
