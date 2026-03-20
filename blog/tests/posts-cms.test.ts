import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import matter from "gray-matter";

import {
  defaultContentLocale,
  getAllPosts,
  isMarkdownPostFile,
} from "../lib/posts";

test("isMarkdownPostFile accepts markdown regardless of extension case", () => {
  assert.equal(isMarkdownPostFile("hello.md"), true);
  assert.equal(isMarkdownPostFile("hello.MD"), true);
  assert.equal(isMarkdownPostFile(".md"), false);
  assert.equal(isMarkdownPostFile("hello.txt"), false);
});

test("getAllPosts returns every publishable CMS markdown file for the default locale", () => {
  const postsDir = path.join(
    process.cwd(),
    "content",
    "posts",
    defaultContentLocale,
  );
  const expectedCount = fs
    .readdirSync(postsDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && isMarkdownPostFile(entry.name))
    .map((entry) => {
      const fullPath = path.join(postsDir, entry.name);
      const { data } = matter(fs.readFileSync(fullPath, "utf8"));
      return data.publish !== false;
    })
    .filter(Boolean).length;

  const posts = getAllPosts();
  assert.equal(posts.length, expectedCount);
});
