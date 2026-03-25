import fs from "fs";
import path from "path";
import matter from "gray-matter";
import GithubSlugger from "github-slugger";

const postsRootDirectory = path.join(process.cwd(), "content/posts");
export const defaultContentLocale = "en";

export interface FaqItem {
  question: string;
  answer: string;
}

export interface Post {
  slug: string;
  title: string;
  date: string;
  dateModified?: string;
  excerpt: string;
  content: string;
  category?: string;
  tags?: string[];
  readTime?: string;
  coverImage?: string;
  publish?: boolean;
  faq?: FaqItem[];
  howTo?: { name: string; text: string }[];
  locale?: string;
  translationKey?: string;
  canonicalLocale?: string;
  sourcePath?: string;
}

export interface TocItem {
  id: string;
  text: string;
  level: number;
}

export function isMarkdownPostFile(filename: string): boolean {
  return !filename.startsWith(".") && /\.md$/i.test(filename);
}

function directoryHasMarkdownPosts(directory: string): boolean {
  return (
    fs.existsSync(directory) &&
    fs
      .readdirSync(directory, { withFileTypes: true })
      .some((entry) => entry.isFile() && isMarkdownPostFile(entry.name))
  );
}

function getLocaleDirectory(locale: string): string {
  return path.join(postsRootDirectory, locale);
}

function getAvailableLocaleDirectories(): string[] {
  if (!fs.existsSync(postsRootDirectory)) {
    return [];
  }

  return fs
    .readdirSync(postsRootDirectory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .filter((entry) => !entry.name.startsWith("."))
    .filter((entry) =>
      directoryHasMarkdownPosts(path.join(postsRootDirectory, entry.name)),
    )
    .map((entry) => entry.name)
    .sort();
}

function resolvePostsDirectory(locale?: string): string {
  if (locale) {
    const localizedDirectory = getLocaleDirectory(locale);
    if (directoryHasMarkdownPosts(localizedDirectory)) {
      return localizedDirectory;
    }
  }

  if (directoryHasMarkdownPosts(postsRootDirectory)) {
    return postsRootDirectory;
  }

  const defaultDirectory = getLocaleDirectory(defaultContentLocale);
  if (directoryHasMarkdownPosts(defaultDirectory)) {
    return defaultDirectory;
  }

  const availableLocale = getAvailableLocaleDirectories()[0];
  if (availableLocale) {
    return getLocaleDirectory(availableLocale);
  }

  return postsRootDirectory;
}

function inferLocaleFromPath(
  filePath: string,
  fallbackLocale?: string,
): string | undefined {
  const relativePath = path.relative(postsRootDirectory, filePath);
  if (!relativePath || relativePath.startsWith("..")) {
    return fallbackLocale;
  }

  const [localeSegment] = relativePath.split(path.sep);
  if (localeSegment && localeSegment !== path.basename(filePath)) {
    return localeSegment;
  }

  return fallbackLocale;
}

function normalizeDate(value: string | Date | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  if (value instanceof Date) {
    return value.toISOString().split("T")[0];
  }

  return value;
}

function calculateReadTime(content: string): string {
  const wordsPerMinute = 200;
  const words = content.split(/\s+/).length;
  const minutes = Math.ceil(words / wordsPerMinute);
  return `${minutes} min`;
}

function getDirectoryPostPaths(directory: string): string[] {
  if (!fs.existsSync(directory)) {
    return [];
  }

  return fs
    .readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && isMarkdownPostFile(entry.name))
    .map((entry) => path.join(directory, entry.name));
}

function safeDecodeURIComponent(str: string): string {
  try {
    return decodeURIComponent(str);
  } catch {
    return str;
  }
}

function readPostFile(filePath: string, localeHint?: string): Post | null {
  let fileContents: string;
  try {
    fileContents = fs.readFileSync(filePath, "utf8");
  } catch (e) {
    console.error(`Failed to read post file ${filePath}:`, e);
    return null;
  }
  const { data, content } = matter(fileContents);
  const slug = safeDecodeURIComponent(
    String(data.slug || path.basename(filePath, path.extname(filePath))),
  ).replace(/\.md$/, "");
  const locale = String(
    data.locale ||
      inferLocaleFromPath(filePath, localeHint) ||
      localeHint ||
      defaultContentLocale,
  );
  const translationKey = String(data.translationKey || slug);

  return {
    slug,
    title: data.title || "Untitled",
    date: normalizeDate(data.date) || "",
    dateModified: normalizeDate(data.dateModified),
    excerpt: data.excerpt || `${content.slice(0, 150)}...`,
    content,
    category: data.category || "General",
    tags: data.tags || [],
    readTime: calculateReadTime(content),
    coverImage: data.coverImage,
    publish: data.publish ?? true,
    faq: Array.isArray(data.faq) ? data.faq : undefined,
    howTo: Array.isArray(data.howTo) ? data.howTo : undefined,
    locale,
    translationKey,
    canonicalLocale: data.canonicalLocale || locale,
    sourcePath: filePath,
  };
}

function getPostsFromDirectory(directory: string, localeHint?: string): Post[] {
  return getDirectoryPostPaths(directory)
    .map((filePath) => readPostFile(filePath, localeHint))
    .filter((post): post is Post => post !== null);
}

function sortPosts(posts: Post[]): Post[] {
  return posts.sort((a, b) => (a.date > b.date ? -1 : 1));
}

function getPostsInScope(locale?: string): Post[] {
  const directory = resolvePostsDirectory(locale);
  const localeHint =
    directory === postsRootDirectory
      ? locale || defaultContentLocale
      : path.basename(directory);

  return getPostsFromDirectory(directory, localeHint).filter(
    (post) => post.publish !== false,
  );
}

function dedupePosts(posts: Post[]): Post[] {
  const byKey = new Map<string, Post>();

  posts.forEach((post) => {
    byKey.set(`${post.locale || defaultContentLocale}:${post.slug}`, post);
  });

  return Array.from(byKey.values());
}

function getAllPostsAcrossLocales(): Post[] {
  const localeDirectories = getAvailableLocaleDirectories();
  const localizedPosts = localeDirectories.flatMap((locale) =>
    getAllPosts(locale),
  );
  const rootPosts = directoryHasMarkdownPosts(postsRootDirectory)
    ? getPostsFromDirectory(postsRootDirectory, defaultContentLocale).filter(
        (post) => post.publish !== false,
      )
    : [];

  return dedupePosts([...localizedPosts, ...rootPosts]);
}

function groupPostsByTranslationKey(posts: Post[]): Map<string, Post[]> {
  const postsByTranslationKey = new Map<string, Post[]>();

  posts.forEach((post) => {
    const translationKey = post.translationKey || post.slug;
    const existingPosts = postsByTranslationKey.get(translationKey) || [];
    existingPosts.push(post);
    postsByTranslationKey.set(translationKey, existingPosts);
  });

  return postsByTranslationKey;
}

export function getPostSlugs(locale?: string): string[] {
  return getAllPosts(locale).map((post) => post.slug);
}

export function getPostBySlug(slug: string, locale?: string): Post | null {
  const realSlug = safeDecodeURIComponent(slug).replace(/\.md$/, "");
  const scopedPosts = getPostsInScope(locale);

  return scopedPosts.find((post) => post.slug === realSlug) || null;
}

export function getAllPosts(locale?: string): Post[] {
  return sortPosts(getPostsInScope(locale));
}

export function getFeaturedPost(locale?: string): Post | null {
  const posts = getAllPosts(locale);
  return posts.find((post) => post.coverImage) || posts[0] || null;
}

export function getRelatedPosts(
  slug: string,
  limit = 3,
  locale?: string,
): Post[] {
  const current = getPostBySlug(slug, locale);
  if (!current) return [];

  const all = getAllPosts(locale).filter((post) => post.slug !== current.slug);
  const scored = all.map((post) => ({
    post,
    score: (post.tags || []).filter((tag) => (current.tags || []).includes(tag))
      .length,
  }));

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((entry) => entry.post);
}

export function getAllTags(locale?: string): string[] {
  const tagSet = new Set<string>();
  getAllPosts(locale).forEach((post) =>
    post.tags?.forEach((tag) => tagSet.add(tag)),
  );
  return Array.from(tagSet).sort();
}

export function getAllCategories(locale?: string): string[] {
  const categorySet = new Set<string>();
  getAllPosts(locale).forEach((post) => {
    if (post.category) {
      categorySet.add(post.category);
    }
  });

  return Array.from(categorySet).sort();
}

export function getPostsByTag(tag: string, locale?: string): Post[] {
  return getAllPosts(locale).filter((post) => post.tags?.includes(tag));
}

export function searchPosts(query: string, locale?: string): Post[] {
  const lowerQuery = query.toLowerCase();

  return getAllPosts(locale).filter(
    (post) =>
      post.title.toLowerCase().includes(lowerQuery) ||
      post.excerpt.toLowerCase().includes(lowerQuery) ||
      post.content.toLowerCase().includes(lowerQuery) ||
      post.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery)),
  );
}

export function extractHeadings(content: string): TocItem[] {
  const headingRegex = /^(#{2,3})\s+(.+)$/gm;
  const headings: TocItem[] = [];
  let match;

  const slugger = new GithubSlugger();

  while ((match = headingRegex.exec(content)) !== null) {
    const text = match[2].trim();
    const id = slugger.slug(text);

    headings.push({
      id,
      text,
      level: match[1].length,
    });
  }

  return headings;
}

export function getAdjacentPosts(
  slug: string,
  locale?: string,
): {
  prev: Post | null;
  next: Post | null;
} {
  const current = getPostBySlug(slug, locale);
  if (!current) return { prev: null, next: null };

  const categoryPosts = getAllPosts(locale).filter(
    (post) => post.category === current.category,
  );
  const index = categoryPosts.findIndex((post) => post.slug === current.slug);

  return {
    prev: index < categoryPosts.length - 1 ? categoryPosts[index + 1] : null,
    next: index > 0 ? categoryPosts[index - 1] : null,
  };
}

export function getLocalizedPostPath(post: Post): string {
  const locale = post.locale || defaultContentLocale;
  return `/${locale}/blog/${encodeURIComponent(post.slug)}/`;
}

export function getPostTranslations(post: Post): Post[] {
  const translationKey = post.translationKey || post.slug;
  const postsByTranslationKey = groupPostsByTranslationKey(
    getAllPostsAcrossLocales(),
  );

  return sortPosts(postsByTranslationKey.get(translationKey) || []);
}

export function getPostLanguageAlternates(
  slug: string,
  locale?: string,
): Record<string, string> {
  const post = getPostBySlug(slug, locale);
  if (!post) {
    return {};
  }

  return Object.fromEntries(
    getPostTranslations(post).map((translation) => [
      translation.locale || defaultContentLocale,
      getLocalizedPostPath(translation),
    ]),
  );
}

export function buildPostLocaleSwitchMap(
  posts: Post[],
): Record<string, string> {
  const switchMap: Record<string, string> = {};
  const postsByTranslationKey = groupPostsByTranslationKey(posts);

  postsByTranslationKey.forEach((translations) => {
    translations.forEach((source) => {
      const sourceLocale = source.locale || defaultContentLocale;

      translations.forEach((target) => {
        const targetLocale = target.locale || defaultContentLocale;

        if (sourceLocale === targetLocale) {
          return;
        }

        switchMap[`${sourceLocale}:${source.slug}`] =
          getLocalizedPostPath(target);
      });
    });
  });

  return switchMap;
}

export function getPostLocaleSwitchMap(): Record<string, string> {
  return buildPostLocaleSwitchMap(getAllPostsAcrossLocales());
}

export function getPostXDefaultAlternate(
  slug: string,
  locale?: string,
): string | undefined {
  const post = getPostBySlug(slug, locale);
  if (!post) {
    return undefined;
  }

  const translations = getPostTranslations(post);
  const canonicalLocale =
    post.canonicalLocale ||
    translations.find((translation) => translation.canonicalLocale)
      ?.canonicalLocale ||
    defaultContentLocale;
  const canonicalTranslation =
    translations.find(
      (translation) =>
        (translation.locale || defaultContentLocale) === canonicalLocale,
    ) ||
    translations.find(
      (translation) =>
        (translation.locale || defaultContentLocale) === defaultContentLocale,
    ) ||
    translations[0];

  return canonicalTranslation
    ? getLocalizedPostPath(canonicalTranslation)
    : undefined;
}
