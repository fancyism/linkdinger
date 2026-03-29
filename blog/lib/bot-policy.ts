export type BotClassification =
  | "good-bot"
  | "ai-bot"
  | "browser"
  | "suspicious-automation"
  | "unknown";

const GOOD_BOT_PATTERNS = [
  /googlebot/i,
  /bingbot/i,
  /twitterbot/i,
  /facebookexternalhit/i,
  /facebot/i,
  /slackbot/i,
  /discordbot/i,
  /linkedinbot/i,
  /whatsapp/i,
  /telegrambot/i,
];

const AI_BOT_PATTERNS = [
  /gptbot/i,
  /claudebot/i,
  /anthropic-ai/i,
  /ccbot/i,
  /perplexitybot/i,
  /bytespider/i,
  /google-extended/i,
  /amazonbot/i,
  /omgili/i,
  /cohere-ai/i,
  /petalbot/i,
];

const BROWSER_PATTERNS = [
  /mozilla\//i,
  /chrome\//i,
  /safari\//i,
  /firefox\//i,
  /edg\//i,
  /mobile/i,
];

const SUSPICIOUS_AUTOMATION_PATTERNS = [
  /curl/i,
  /wget/i,
  /python/i,
  /requests/i,
  /httpclient/i,
  /axios/i,
  /node-fetch/i,
  /undici/i,
  /go-http-client/i,
  /java/i,
  /okhttp/i,
  /libwww-perl/i,
  /scrapy/i,
  /aiohttp/i,
  /headless/i,
  /phantom/i,
  /playwright/i,
  /puppeteer/i,
];

export function classifyUserAgent(userAgent: string | null): BotClassification {
  const ua = (userAgent || "").trim();

  if (!ua) {
    return "unknown";
  }

  if (GOOD_BOT_PATTERNS.some((pattern) => pattern.test(ua))) {
    return "good-bot";
  }

  if (AI_BOT_PATTERNS.some((pattern) => pattern.test(ua))) {
    return "ai-bot";
  }

  if (SUSPICIOUS_AUTOMATION_PATTERNS.some((pattern) => pattern.test(ua))) {
    return "suspicious-automation";
  }

  if (BROWSER_PATTERNS.some((pattern) => pattern.test(ua))) {
    return "browser";
  }

  return "unknown";
}

export function isProtectedContentPath(pathname: string): boolean {
  return (
    pathname.startsWith("/api/") ||
    pathname.includes("/blog/") ||
    pathname.includes("/prompts/")
  );
}

export function shouldSkipBotProtection(pathname: string): boolean {
  return (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/icon") ||
    pathname.startsWith("/images/") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/robots.txt") ||
    pathname.startsWith("/sitemap") ||
    pathname.endsWith(".xml") ||
    pathname.endsWith(".txt") ||
    pathname.endsWith(".png") ||
    pathname.endsWith(".jpg") ||
    pathname.endsWith(".jpeg") ||
    pathname.endsWith(".gif") ||
    pathname.endsWith(".webp") ||
    pathname.endsWith(".svg")
  );
}

export function getRobotsProtectionHeader() {
  return "noindex, nofollow, noarchive, nosnippet, noimageindex, noai, noimageai";
}
