import assert from "node:assert/strict";
import test from "node:test";

import {
  buildShareLinks,
  getInitialShareUrl,
  getShareText,
  toAbsoluteShareUrl,
} from "../lib/share";

test("getInitialShareUrl prefers explicit URLs and falls back to site URL", () => {
  assert.equal(getInitialShareUrl("/en/blog/post", "https://linkdinger.com"), "/en/blog/post");
  assert.equal(
    getInitialShareUrl(undefined, "https://linkdinger.com"),
    "https://linkdinger.com",
  );
});

test("toAbsoluteShareUrl resolves relative and absolute URLs safely", () => {
  assert.equal(
    toAbsoluteShareUrl("/en/blog/context-engineer/", "https://linkdinger.com"),
    "https://linkdinger.com/en/blog/context-engineer/",
  );
  assert.equal(
    toAbsoluteShareUrl("https://example.com/post", "https://linkdinger.com"),
    "https://example.com/post",
  );
});

test("getShareText includes excerpt when available", () => {
  assert.equal(
    getShareText("Context Engineer", "A short summary"),
    "Context Engineer\n\nA short summary",
  );
  assert.equal(getShareText("Context Engineer"), "Context Engineer");
});

test("buildShareLinks encodes the generated destination URLs", () => {
  const links = buildShareLinks({
    title: "Context Engineer",
    excerpt: "A short summary",
    url: "/th/blog/Context%20Engineer/",
    siteUrl: "https://linkdinger.com",
  });

  assert.equal(
    links.fullUrl,
    "https://linkdinger.com/th/blog/Context%20Engineer/",
  );
  assert.match(links.tweetUrl, /twitter\.com\/intent\/tweet/);
  assert.match(links.linkedinUrl, /linkedin\.com\/sharing\/share-offsite/);
  assert.match(links.facebookUrl, /facebook\.com\/sharer\/sharer\.php/);
  assert.match(links.lineUrl, /social-plugins\.line\.me\/lineit\/share/);
  assert.match(links.tweetUrl, /Context%20Engineer/);
});
