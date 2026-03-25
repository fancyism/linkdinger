import assert from "node:assert/strict";
import test from "node:test";

import {
  buildAnalyticsIncrementCommands,
  calculateRate,
  getAnalyticsKey,
  getMetricsForAnalyticsEvent,
  isAnalyticsEventName,
  isPublicAnalyticsEventName,
  isSecureAnalyticsEventName,
  parseAnalyticsCount,
} from "../lib/analytics";

test("analytics event names are validated explicitly", () => {
  assert.equal(isAnalyticsEventName("affiliate_click"), true);
  assert.equal(isPublicAnalyticsEventName("affiliate_click"), true);
  assert.equal(isPublicAnalyticsEventName("revenue_realized"), false);
  assert.equal(isSecureAnalyticsEventName("consultation_booked"), true);
  assert.equal(isAnalyticsEventName("totally_unknown"), false);
});

test("analytics keys encode multilingual segments safely", () => {
  assert.equal(
    getAnalyticsKey("article", "cta_clicks", "Context Engineer"),
    "analytics:article:Context%20Engineer:cta_clicks",
  );
  assert.equal(
    getAnalyticsKey("category", "email_opt_ins", "AI & Design"),
    "analytics:category:AI%20%26%20Design:email_opt_ins",
  );
  assert.equal(
    getAnalyticsKey("site", "estimated_revenue_cents"),
    "analytics:site:estimated_revenue_cents",
  );
});

test("analytics event mappings include monetization counters", () => {
  assert.deepEqual(getMetricsForAnalyticsEvent("affiliate_click"), [
    "cta_clicks",
    "affiliate_clicks",
  ]);
  assert.deepEqual(getMetricsForAnalyticsEvent("email_opt_in"), [
    "cta_clicks",
    "email_opt_ins",
  ]);
  assert.deepEqual(getMetricsForAnalyticsEvent("consultation_booked"), [
    "consultation_bookings",
  ]);
  assert.deepEqual(getMetricsForAnalyticsEvent("revenue_realized"), [
    "realized_revenue_cents",
  ]);
});

test("analytics increment commands fan out across site, article, category, and CTA scopes", () => {
  const commands = buildAnalyticsIncrementCommands({
    event: "affiliate_click",
    slug: "context-engineer",
    category: "AI",
    ctaId: "affiliate_card",
    revenueCents: 1250,
  });

  assert.deepEqual(commands, [
    ["INCRBY", "analytics:site:cta_clicks", "1"],
    ["INCRBY", "analytics:article:context-engineer:cta_clicks", "1"],
    ["INCRBY", "analytics:category:AI:cta_clicks", "1"],
    ["INCRBY", "analytics:cta:affiliate_card:cta_clicks", "1"],
    ["INCRBY", "analytics:site:affiliate_clicks", "1"],
    ["INCRBY", "analytics:article:context-engineer:affiliate_clicks", "1"],
    ["INCRBY", "analytics:category:AI:affiliate_clicks", "1"],
    ["INCRBY", "analytics:cta:affiliate_card:affiliate_clicks", "1"],
    ["INCRBY", "analytics:site:estimated_revenue_cents", "1250"],
    [
      "INCRBY",
      "analytics:article:context-engineer:estimated_revenue_cents",
      "1250",
    ],
    ["INCRBY", "analytics:category:AI:estimated_revenue_cents", "1250"],
  ]);
});

test("analytics helpers normalize counts and rates safely", () => {
  assert.equal(parseAnalyticsCount("42"), 42);
  assert.equal(parseAnalyticsCount(null), 0);
  assert.equal(calculateRate(5, 20), 25);
  assert.equal(calculateRate(3, 0), 0);
});

test("consultation bookings can also record realized revenue", () => {
  const commands = buildAnalyticsIncrementCommands({
    event: "consultation_booked",
    slug: "context-engineer",
    category: "AI",
    ctaId: "consultation_book",
    revenueCents: 15000,
  });

  assert.deepEqual(commands, [
    ["INCRBY", "analytics:site:consultation_bookings", "1"],
    ["INCRBY", "analytics:article:context-engineer:consultation_bookings", "1"],
    ["INCRBY", "analytics:category:AI:consultation_bookings", "1"],
    ["INCRBY", "analytics:cta:consultation_book:consultation_bookings", "1"],
    ["INCRBY", "analytics:site:realized_revenue_cents", "15000"],
    [
      "INCRBY",
      "analytics:article:context-engineer:realized_revenue_cents",
      "15000",
    ],
    ["INCRBY", "analytics:category:AI:realized_revenue_cents", "15000"],
  ]);
});
