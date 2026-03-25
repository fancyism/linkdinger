import assert from "node:assert/strict";
import test from "node:test";

import {
  attachViewCounts,
  buildViewCountKeysPath,
  encodeViewCountKey,
  getViewCountKey,
  parseViewCount,
} from "../lib/view-counts";

test("view count helpers build Redis keys safely for multilingual slugs", () => {
  assert.equal(getViewCountKey("context-engineer"), "page_views:context-engineer");
  assert.equal(
    encodeViewCountKey("Context Engineer"),
    "page_views%3AContext%20Engineer",
  );
  assert.equal(
    buildViewCountKeysPath(["context-engineer", "ลองเล่น Dark Glassmorphism ใน Next.js"]),
    "page_views%3Acontext-engineer/page_views%3A%E0%B8%A5%E0%B8%AD%E0%B8%87%E0%B9%80%E0%B8%A5%E0%B9%88%E0%B8%99%20Dark%20Glassmorphism%20%E0%B9%83%E0%B8%99%20Next.js",
  );
});

test("parseViewCount normalizes invalid values to zero", () => {
  assert.equal(parseViewCount("42"), 42);
  assert.equal(parseViewCount(7), 7);
  assert.equal(parseViewCount(null), 0);
  assert.equal(parseViewCount("not-a-number"), 0);
});

test("attachViewCounts preserves post data and adds defaults", () => {
  const posts = [
    { slug: "alpha", title: "Alpha" },
    { slug: "beta", title: "Beta" },
  ];

  assert.deepEqual(attachViewCounts(posts, { alpha: 12 }), [
    { slug: "alpha", title: "Alpha", _views: 12 },
    { slug: "beta", title: "Beta", _views: 0 },
  ]);
});
