import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  buildAnalyticsIncrementCommands,
  isPublicAnalyticsEventName,
  type PublicAnalyticsEventPayload,
} from "@/lib/analytics";
import { fetchUpstashJson, getUpstashRestConfig } from "@/lib/upstash";

const VISITOR_COOKIE_NAME = "ld_visitor_id";
const SESSION_COOKIE_NAME = "ld_session_id";

export const dynamic = "force-dynamic";

function createAnalyticsCookies(
  response: NextResponse,
  request: NextRequest,
): void {
  if (!request.cookies.get(VISITOR_COOKIE_NAME)?.value) {
    response.cookies.set(VISITOR_COOKIE_NAME, randomUUID(), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
    });
  }

  if (!request.cookies.get(SESSION_COOKIE_NAME)?.value) {
    response.cookies.set(SESSION_COOKIE_NAME, randomUUID(), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24,
      path: "/",
    });
  }
}

function normalizePayload(
  payload: unknown,
): PublicAnalyticsEventPayload | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const candidate = payload as Record<string, unknown>;
  if (!isPublicAnalyticsEventName(candidate.event)) {
    return null;
  }

  return {
    event: candidate.event,
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
    revenueCents:
      typeof candidate.revenueCents === "number"
        ? candidate.revenueCents
        : undefined,
  };
}

export async function POST(request: NextRequest) {
  const payload = normalizePayload(await request.json().catch(() => null));
  const response = NextResponse.json({ ok: true }, { status: 202 });
  createAnalyticsCookies(response, request);

  if (!payload) {
    return NextResponse.json(
      { error: "Invalid analytics payload" },
      { status: 400 },
    );
  }

  const { url, token } = getUpstashRestConfig();
  if (!url || !token) {
    return response;
  }

  const commands = buildAnalyticsIncrementCommands(payload);
  if (!commands.length) {
    return response;
  }

  try {
    await fetchUpstashJson("/pipeline", {
      method: "POST",
      body: commands,
    });
  } catch (error) {
    console.error("Failed to record analytics event", error);
  }

  return response;
}
