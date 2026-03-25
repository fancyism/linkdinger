import fs from "fs";
import path from "path";
import matter from "gray-matter";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const postsRootDir = path.join(process.cwd(), "content/posts");
const publicDir = path.join(process.cwd(), "public");
const locales = ["en", "th"];
const defaultLocale = "en";

function isMarkdownPostFile(filename) {
  return !filename.startsWith(".") && filename.endsWith(".md");
}

function directoryHasMarkdownPosts(directory) {
  return (
    fs.existsSync(directory) &&
    fs
      .readdirSync(directory, { withFileTypes: true })
      .some((entry) => entry.isFile() && isMarkdownPostFile(entry.name))
  );
}

function normalizeDate(value) {
  if (value instanceof Date) {
    return value.toISOString().split("T")[0];
  }

  return value || new Date().toISOString().split("T")[0];
}

function readPostFile(filePath, locale) {
  const content = fs.readFileSync(filePath, "utf8");
  const { data } = matter(content);
  const slug = decodeURIComponent(
    String(data.slug || path.basename(filePath, ".md")),
  ).replace(/\.md$/, "");

  return {
    locale,
    slug,
    date: normalizeDate(data.date),
    translationKey: String(data.translationKey || slug),
    canonicalLocale: String(data.canonicalLocale || locale),
    publish: data.publish !== false,
  };
}

function getPostsForLocale(locale) {
  const localeDir = path.join(postsRootDir, locale);
  if (!directoryHasMarkdownPosts(localeDir)) {
    return [];
  }

  return fs
    .readdirSync(localeDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && isMarkdownPostFile(entry.name))
    .map((entry) => readPostFile(path.join(localeDir, entry.name), locale))
    .filter((post) => post.publish);
}

function getRootPosts() {
  if (!directoryHasMarkdownPosts(postsRootDir)) {
    return [];
  }

  return fs
    .readdirSync(postsRootDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && isMarkdownPostFile(entry.name))
    .map((entry) => readPostFile(path.join(postsRootDir, entry.name), defaultLocale))
    .filter((post) => post.publish);
}

function getAllPosts() {
  return [...locales.flatMap(getPostsForLocale), ...getRootPosts()];
}

function escapeXml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function getPostAlternates(post, posts) {
  const matches = posts.filter(
    (candidate) => candidate.translationKey === post.translationKey,
  );

  return Object.fromEntries(
    matches.map((candidate) => [
      candidate.locale,
      `${SITE_URL}/${candidate.locale}/blog/${encodeURIComponent(candidate.slug)}/`,
    ]),
  );
}

function getXDefaultAlternate(post, posts) {
  const matches = posts.filter(
    (candidate) => candidate.translationKey === post.translationKey,
  );
  const canonicalMatch =
    matches.find((candidate) => candidate.locale === post.canonicalLocale) ||
    matches.find((candidate) => candidate.locale === defaultLocale) ||
    matches[0];

  return canonicalMatch
    ? `${SITE_URL}/${canonicalMatch.locale}/blog/${encodeURIComponent(canonicalMatch.slug)}/`
    : undefined;
}

function getStaticPages() {
  const today = new Date().toISOString().split("T")[0];
  const pageTemplates = [
    { path: "/", changefreq: "weekly", priority: "1.0" },
    { path: "/blog/", changefreq: "daily", priority: "0.9" },
    { path: "/about/", changefreq: "monthly", priority: "0.5" },
    { path: "/search/", changefreq: "weekly", priority: "0.4" },
    { path: "/products/", changefreq: "monthly", priority: "0.4" },
    { path: "/consultation/", changefreq: "monthly", priority: "0.4" },
  ];

  return locales.flatMap((locale) =>
    pageTemplates.map((page) => ({
      loc: `${SITE_URL}/${locale}${page.path}`,
      lastmod: today,
      changefreq: page.changefreq,
      priority: page.priority,
      alternates: {
        en: `${SITE_URL}/en${page.path}`,
        th: `${SITE_URL}/th${page.path}`,
        "x-default": `${SITE_URL}/${defaultLocale}${page.path}`,
      },
    })),
  );
}

function getPostPages(posts) {
  return posts.map((post) => {
    const alternates = getPostAlternates(post, posts);
    const xDefault = getXDefaultAlternate(post, posts);

    return {
      loc: `${SITE_URL}/${post.locale}/blog/${encodeURIComponent(post.slug)}/`,
      lastmod: post.date,
      changefreq: "monthly",
      priority: "0.7",
      alternates: xDefault
        ? { ...alternates, "x-default": xDefault }
        : alternates,
    };
  });
}

function renderAlternateLinks(alternates) {
  return Object.entries(alternates)
    .map(
      ([hreflang, href]) =>
        `    <xhtml:link rel="alternate" hreflang="${escapeXml(hreflang)}" href="${escapeXml(href)}" />`,
    )
    .join("\n");
}

function generateSitemap() {
  const posts = getAllPosts();
  const allPages = [...getStaticPages(), ...getPostPages(posts)];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${allPages
  .map(
    (page) => `  <url>
    <loc>${escapeXml(page.loc)}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
${renderAlternateLinks(page.alternates)}
  </url>`,
  )
  .join("\n")}
</urlset>`;

  fs.writeFileSync(path.join(publicDir, "sitemap.xml"), xml, "utf8");
  console.log(`Sitemap generated with ${allPages.length} URLs -> public/sitemap.xml`);
}

generateSitemap();
