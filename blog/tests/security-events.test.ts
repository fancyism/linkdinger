import assert from "node:assert/strict";
import test from "node:test";

import { buildSecurityEventCommands } from "@/lib/security-events";

test("buildSecurityEventCommands creates aggregate security counters", () => {
  const commands = buildSecurityEventCommands("ai_bot_blocked", {
    path: "/en/prompts/gg/",
    ip: "127.0.0.1",
    userAgent: "GPTBot/1.0",
    classification: "ai-bot",
    storage: "upstash",
  });

  assert.deepEqual(commands, [
    ["INCRBY", "security:site:ai_bot_blocked", "1"],
    ["INCRBY", "security:classification:ai-bot:ai_bot_blocked", "1"],
    ["INCRBY", "security:path:%2Fen%2Fprompts%2Fgg%2F:ai_bot_blocked", "1"],
    ["INCRBY", "security:route-family:prompts:ai_bot_blocked", "1"],
    ["INCRBY", "security:storage:upstash:ai_bot_blocked", "1"],
  ]);
});

test("buildSecurityEventCommands omits storage bucket when unavailable", () => {
  const commands = buildSecurityEventCommands("suspicious_throttled", {
    path: "/en/blog/context-engineer/",
    ip: "127.0.0.1",
    userAgent: "curl/8.5.0",
    classification: "suspicious-automation",
  });

  assert.equal(commands.length, 4);
  assert.equal(commands[0][1], "security:site:suspicious_throttled");
});
