import assert from "node:assert/strict";
import test from "node:test";

import {
  ANALYTICS_INGEST_HEADER,
  getAnalyticsIngestDedupeKey,
  getAnalyticsIngestRequestToken,
  isAuthorizedAnalyticsIngestToken,
  normalizeConversionPayload,
} from "../lib/analytics-ingest";

test("analytics ingest extracts bearer and fallback header tokens", () => {
  const bearerHeaders = {
    get(name: string) {
      return name === "authorization" ? "Bearer super-secret" : null;
    },
  };
  assert.equal(getAnalyticsIngestRequestToken(bearerHeaders), "super-secret");

  const fallbackHeaders = {
    get(name: string) {
      return name === ANALYTICS_INGEST_HEADER ? "header-token" : null;
    },
  };
  assert.equal(getAnalyticsIngestRequestToken(fallbackHeaders), "header-token");
});

test("analytics ingest auth requires exact token matches", () => {
  assert.equal(isAuthorizedAnalyticsIngestToken("abc123", "abc123"), true);
  assert.equal(isAuthorizedAnalyticsIngestToken("abc123", "abc124"), false);
  assert.equal(isAuthorizedAnalyticsIngestToken(null, "abc123"), false);
});

test("analytics ingest normalization accepts booked consultations and realized revenue", () => {
  assert.deepEqual(
    normalizeConversionPayload({
      event: "consultation_booked",
      externalId: "evt_123",
      slug: "context-engineer",
      category: "AI",
      revenueCents: "15000",
      source: "calendly",
      currency: "usd",
    }),
    {
      event: "consultation_booked",
      externalId: "evt_123",
      slug: "context-engineer",
      category: "AI",
      revenueCents: 15000,
      source: "calendly",
      currency: "USD",
      locale: undefined,
      pathname: undefined,
      ctaId: undefined,
      placement: undefined,
      outboundUrl: undefined,
    },
  );

  assert.deepEqual(
    normalizeConversionPayload({
      event: "revenue_realized",
      externalId: "stripe_pi_123",
      revenueCents: 15000,
    }),
    {
      event: "revenue_realized",
      externalId: "stripe_pi_123",
      revenueCents: 15000,
      slug: undefined,
      locale: undefined,
      category: undefined,
      pathname: undefined,
      ctaId: undefined,
      placement: undefined,
      outboundUrl: undefined,
      source: undefined,
      currency: undefined,
    },
  );
});

test("analytics ingest normalization rejects invalid secure payloads", () => {
  assert.equal(
    normalizeConversionPayload({
      event: "affiliate_click",
      externalId: "evt_123",
    }),
    null,
  );
  assert.equal(
    normalizeConversionPayload({
      event: "consultation_booked",
      externalId: "",
    }),
    null,
  );
  assert.equal(
    normalizeConversionPayload({
      event: "revenue_realized",
      externalId: "evt_123",
      revenueCents: 0,
    }),
    null,
  );
});

test("analytics ingest dedupe keys namespace secure events", () => {
  assert.equal(
    getAnalyticsIngestDedupeKey("consultation_booked", "evt_123"),
    "analytics:dedupe:consultation_booked:evt_123",
  );
});
