import assert from "node:assert/strict";
import test from "node:test";

import {
  isBlogPostPath,
  normalizeSlugParam,
  resolveLocaleSwitchTarget,
} from "../lib/locale-switch";

test("isBlogPostPath only matches concrete blog post routes", () => {
  assert.equal(isBlogPostPath("/blog/context-engineer"), true);
  assert.equal(isBlogPostPath("/blog/tag/AI"), false);
  assert.equal(isBlogPostPath("/blog"), false);
  assert.equal(isBlogPostPath("/products"), false);
});

test("normalizeSlugParam handles strings and arrays", () => {
  assert.equal(normalizeSlugParam("context-engineer"), "context-engineer");
  assert.equal(
    normalizeSlugParam(["Context%20Engineer"]),
    "Context Engineer",
  );
  assert.equal(normalizeSlugParam(undefined), null);
});

test("resolveLocaleSwitchTarget uses translated post hrefs when available", () => {
  const result = resolveLocaleSwitchTarget({
    locale: "en",
    pathname: "/blog/context-engineer",
    search: "ref=hero",
    slugParam: "context-engineer",
    postLocaleAlternates: {
      "en:context-engineer": "/th/blog/Context%20Engineer/",
    },
  });

  assert.deepEqual(result, {
    alternateLocale: "th",
    href: "/th/blog/Context%20Engineer/?ref=hero",
    useRawHref: true,
  });
});

test("resolveLocaleSwitchTarget falls back to locale blog index for untranslated posts", () => {
  const result = resolveLocaleSwitchTarget({
    locale: "th",
    pathname: "/blog/unique-post",
    slugParam: "unique-post",
  });

  assert.deepEqual(result, {
    alternateLocale: "en",
    href: "/en/blog/",
    useRawHref: true,
  });
});

test("resolveLocaleSwitchTarget keeps app routes locale-aware outside post pages", () => {
  const result = resolveLocaleSwitchTarget({
    locale: "en",
    pathname: "/blog",
    search: "category=AI",
  });

  assert.deepEqual(result, {
    alternateLocale: "th",
    href: "/blog?category=AI",
    linkLocale: "th",
    useRawHref: false,
  });
});
