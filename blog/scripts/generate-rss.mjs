import fs from "fs";
import path from "path";
import matter from "gray-matter";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const postsRootDir = path.join(process.cwd(), "content/posts");
const publicDir = path.join(process.cwd(), "public");
const locales = ["en", "th"];
const defaultLocale = "en";

const feedMeta = {
  en: {
    title: "Linkdinger - AI Tools & Thoughts",
    description:
      "AI-powered tools and thoughts. Every commit lands on GitHub for you to fork and remix.",
    language: "en",
  },
  th: {
    title: "Linkdinger - เครื่องมือ AI และบทความ",
    description:
      "เครื่องมือและบทความที่ขับเคลื่อนด้วย AI ทุกคอมมิตขึ้น GitHub ให้คุณ fork และ remix ต่อได้",
    language: "th",
  },
};

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

function escapeXml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function toRFC822Date(dateStr) {
  return new Date(dateStr).toUTCString();
}

function normalizeDate(value) {
  if (value instanceof Date) {
    return value.toISOString().split("T")[0];
  }

  return value || new Date().toISOString().split("T")[0];
}

function getPostsForLocale(locale) {
  const localeDir = path.join(postsRootDir, locale);
  if (!directoryHasMarkdownPosts(localeDir)) {
    return [];
  }

  return fs
    .readdirSync(localeDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && isMarkdownPostFile(entry.name))
    .map((entry) => {
      const filePath = path.join(localeDir, entry.name);
      const content = fs.readFileSync(filePath, "utf8");
      const { data } = matter(content);
      const slug = decodeURIComponent(
        String(data.slug || path.basename(filePath, ".md")),
      ).replace(/\.md$/, "");

      return {
        locale,
        title: data.title || "Untitled",
        slug,
        date: normalizeDate(data.date),
        excerpt: data.excerpt || "",
        category: data.category || "",
        publish: data.publish !== false,
      };
    })
    .filter((post) => post.publish)
    .sort((a, b) => (a.date > b.date ? -1 : 1));
}

function writeFeed(filepath, locale, posts) {
  const meta = feedMeta[locale] || feedMeta[defaultLocale];
  const buildDate = new Date().toUTCString();
  const feedUrl =
    locale === defaultLocale && filepath === path.join(publicDir, "rss.xml")
      ? `${SITE_URL}/rss.xml`
      : `${SITE_URL}/${locale}/rss.xml`;

  const items = posts
    .map(
      (post) => `    <item>
      <title>${escapeXml(String(post.title))}</title>
      <link>${SITE_URL}/${locale}/blog/${encodeURIComponent(post.slug)}/</link>
      <guid isPermaLink="true">${SITE_URL}/${locale}/blog/${encodeURIComponent(post.slug)}/</guid>
      <description>${escapeXml(String(post.excerpt))}</description>
      <pubDate>${toRFC822Date(post.date)}</pubDate>${post.category ? `\n      <category>${escapeXml(String(post.category))}</category>` : ""}
    </item>`,
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(meta.title)}</title>
    <link>${SITE_URL}/${locale}/</link>
    <description>${escapeXml(meta.description)}</description>
    <language>${meta.language}</language>
    <lastBuildDate>${buildDate}</lastBuildDate>
    <atom:link href="${feedUrl}" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;

  fs.mkdirSync(path.dirname(filepath), { recursive: true });
  fs.writeFileSync(filepath, xml, "utf8");
}

function generateRss() {
  const feedCounts = [];

  locales.forEach((locale) => {
    const posts = getPostsForLocale(locale);
    const localeFeedPath = path.join(publicDir, locale, "rss.xml");
    writeFeed(localeFeedPath, locale, posts);
    feedCounts.push(`${locale}: ${posts.length}`);

    if (locale === defaultLocale) {
      writeFeed(path.join(publicDir, "rss.xml"), locale, posts);
    }
  });

  console.log(`RSS feeds generated -> ${feedCounts.join(", ")}`);
}

generateRss();
