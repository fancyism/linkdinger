import createMiddleware from "next-intl/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { routing } from "./i18n/routing";
import {
  classifyUserAgent,
  getRobotsProtectionHeader,
  isProtectedContentPath,
  shouldSkipBotProtection,
} from "./lib/bot-policy";
import { applySlidingRateLimit } from "./lib/rate-limit";
import { logSecurityEvent } from "./lib/security-log";

const handleI18nRouting = createMiddleware(routing);

function getClientIdentifier(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  return request.headers.get("x-real-ip") || "unknown";
}

function buildBlockedResponse(message: string, status: number) {
  return new NextResponse(message, {
    status,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Robots-Tag": getRobotsProtectionHeader(),
      "Cache-Control": "no-store, max-age=0",
    },
  });
}

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (shouldSkipBotProtection(pathname)) {
    return handleI18nRouting(request);
  }

  const classification = classifyUserAgent(request.headers.get("user-agent"));
  const clientId = getClientIdentifier(request);

  if (classification === "ai-bot") {
    await logSecurityEvent("ai_bot_blocked", {
      path: pathname,
      ip: clientId,
      userAgent: request.headers.get("user-agent"),
      classification,
    });
    return buildBlockedResponse("AI crawler access is not permitted.", 403);
  }

  if (classification !== "browser" && classification !== "good-bot" && isProtectedContentPath(pathname)) {
    const key = `${classification}:${clientId}:${pathname.split("/")[1] || "root"}`;
    const limit = classification === "suspicious-automation" ? 25 : 40;
    const result = await applySlidingRateLimit({
      key,
      limit,
      windowMs: 60_000,
    });

    if (!result.allowed) {
      await logSecurityEvent("suspicious_throttled", {
        path: pathname,
        ip: clientId,
        userAgent: request.headers.get("user-agent"),
        classification,
        retryAfterSeconds: result.retryAfterSeconds,
        storage: result.storage,
      });
      return new NextResponse("Too many requests. Please slow down.", {
        status: 429,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Retry-After": String(result.retryAfterSeconds),
          "X-Robots-Tag": getRobotsProtectionHeader(),
          "Cache-Control": "no-store, max-age=0",
        },
      });
    }
  }

  const response = handleI18nRouting(request);
  response.headers.set("X-Linkdinger-Bot-Class", classification);
  if (classification !== "browser" && classification !== "good-bot") {
    response.headers.set("X-Linkdinger-Protection", "active");
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
