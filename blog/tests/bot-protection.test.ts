import assert from "node:assert/strict";
import test from "node:test";

import {
  classifyUserAgent,
  getRobotsProtectionHeader,
  isProtectedContentPath,
  shouldSkipBotProtection,
} from "@/lib/bot-policy";
import { applySlidingRateLimit } from "@/lib/rate-limit";

test("classifyUserAgent recognizes good bots", () => {
  assert.equal(classifyUserAgent("Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"), "good-bot");
  assert.equal(classifyUserAgent("Twitterbot/1.0"), "good-bot");
});

test("classifyUserAgent recognizes known AI bots", () => {
  assert.equal(classifyUserAgent("GPTBot/1.0"), "ai-bot");
  assert.equal(classifyUserAgent("ClaudeBot/1.0"), "ai-bot");
});

test("classifyUserAgent distinguishes browsers and suspicious automation", () => {
  assert.equal(classifyUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0 Safari/537.36"), "browser");
  assert.equal(classifyUserAgent("curl/8.5.0"), "suspicious-automation");
});

test("path helpers protect the intended routes", () => {
  assert.equal(isProtectedContentPath("/en/blog/test/"), true);
  assert.equal(isProtectedContentPath("/en/prompts/hello/"), true);
  assert.equal(isProtectedContentPath("/api/analytics"), true);
  assert.equal(isProtectedContentPath("/en/about/"), false);
  assert.equal(shouldSkipBotProtection("/_next/static/chunk.js"), true);
  assert.equal(shouldSkipBotProtection("/images/about/logo-lind.png"), true);
  assert.equal(shouldSkipBotProtection("/en/prompts/test/"), false);
});

test("robots protection header includes anti-ai directives", () => {
  assert.match(getRobotsProtectionHeader(), /noai/);
  assert.match(getRobotsProtectionHeader(), /noimageai/);
});

test("applySlidingRateLimit throttles once the window limit is exceeded", async () => {
  const key = `test-rate-limit-${Date.now()}`;
  const now = Date.now();

  const first = await applySlidingRateLimit({ key, limit: 2, windowMs: 60_000, now });
  const second = await applySlidingRateLimit({ key, limit: 2, windowMs: 60_000, now: now + 1 });
  const third = await applySlidingRateLimit({ key, limit: 2, windowMs: 60_000, now: now + 2 });

  assert.equal(first.allowed, true);
  assert.equal(second.allowed, true);
  assert.equal(third.allowed, false);
  assert.ok(third.retryAfterSeconds >= 1);
  assert.match(third.storage, /memory|upstash/);
});
