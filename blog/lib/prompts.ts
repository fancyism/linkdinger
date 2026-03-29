import fs from "fs";
import path from "path";
import matter from "gray-matter";

/* Re-export types & constants from client-safe module */
export type { Prompt, PromptPlatform } from "./prompt-types";
export { PLATFORM_COLORS, getPlatformColor, getLocalizedPromptPath } from "./prompt-types";
import type { Prompt, PromptPreviewLayout } from "./prompt-types";

/* ── Constants ── */
const promptsRootDirectory = path.join(process.cwd(), "content/prompts");
const defaultContentLocale = "en";

/* ── File Utilities (DRY — mirrors posts.ts patterns) ── */

function isMarkdownFile(filename: string): boolean {
  return !filename.startsWith(".") && /\.md$/i.test(filename);
}

function directoryHasMarkdown(directory: string): boolean {
  return (
    fs.existsSync(directory) &&
    fs
      .readdirSync(directory, { withFileTypes: true })
      .some((entry) => entry.isFile() && isMarkdownFile(entry.name))
  );
}

function getLocaleDirectory(locale: string): string {
  return path.join(promptsRootDirectory, locale);
}

function getAvailableLocaleDirectories(): string[] {
  if (!fs.existsSync(promptsRootDirectory)) {
    return [];
  }

  return fs
    .readdirSync(promptsRootDirectory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .filter((entry) => !entry.name.startsWith("."))
    .filter((entry) =>
      directoryHasMarkdown(path.join(promptsRootDirectory, entry.name)),
    )
    .map((entry) => entry.name)
    .sort();
}

function resolvePromptsDirectory(locale?: string): string {
  if (locale) {
    const localizedDirectory = getLocaleDirectory(locale);
    if (directoryHasMarkdown(localizedDirectory)) {
      return localizedDirectory;
    }
  }

  if (directoryHasMarkdown(promptsRootDirectory)) {
    return promptsRootDirectory;
  }

  const defaultDirectory = getLocaleDirectory(defaultContentLocale);
  if (directoryHasMarkdown(defaultDirectory)) {
    return defaultDirectory;
  }

  const availableLocale = getAvailableLocaleDirectories()[0];
  if (availableLocale) {
    return getLocaleDirectory(availableLocale);
  }

  return promptsRootDirectory;
}

function inferLocaleFromPath(
  filePath: string,
  fallbackLocale?: string,
): string | undefined {
  const relativePath = path.relative(promptsRootDirectory, filePath);
  if (!relativePath || relativePath.startsWith("..")) {
    return fallbackLocale;
  }

  const [localeSegment] = relativePath.split(path.sep);
  if (localeSegment && localeSegment !== path.basename(filePath)) {
    return localeSegment;
  }

  return fallbackLocale;
}

function safeDecodeURIComponent(str: string): string {
  try {
    return decodeURIComponent(str);
  } catch {
    return str;
  }
}

function normalizeDate(value: string | Date | undefined): string | undefined {
  if (!value) return undefined;
  if (value instanceof Date) return value.toISOString().split("T")[0];
  return value;
}

function getDirectoryPromptPaths(directory: string): string[] {
  if (!fs.existsSync(directory)) {
    return [];
  }

  return fs
    .readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && isMarkdownFile(entry.name))
    .map((entry) => path.join(directory, entry.name));
}

/* ── Read Single Prompt ── */

function readPromptFile(filePath: string, localeHint?: string): Prompt | null {
  let fileContents: string;
  try {
    fileContents = fs.readFileSync(filePath, "utf8");
  } catch (e) {
    console.error(`Failed to read prompt file ${filePath}:`, e);
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

  return {
    slug,
    title: data.title || "Untitled Prompt",
    date: normalizeDate(data.date) || "",
    excerpt: data.excerpt || `${content.slice(0, 150)}...`,
    content,
    platform: data.platform || "Custom",
    category: data.category || "General",
    tags: data.tags || [],
    coverImage: data.coverImage,
    promptId: data.promptId || slug.toUpperCase(),
    promptText: data.promptText || "",
    usageTips: data.usageTips,
    sref: data.sref,
    difficulty: data.difficulty,
    model: data.model,
    demoUrl: data.demoUrl,
    previewLayout: data.previewLayout as PromptPreviewLayout | undefined,
    locale,
    translationKey: data.translationKey || slug,
    publish: data.publish ?? true,
  };
}

/* ── Collection Helpers ── */

function getPromptsFromDirectory(
  directory: string,
  localeHint?: string,
): Prompt[] {
  return getDirectoryPromptPaths(directory)
    .map((filePath) => readPromptFile(filePath, localeHint))
    .filter((prompt): prompt is Prompt => prompt !== null);
}

function getPromptsInScope(locale?: string): Prompt[] {
  const directory = resolvePromptsDirectory(locale);
  const localeHint =
    directory === promptsRootDirectory
      ? locale || defaultContentLocale
      : path.basename(directory);

  return getPromptsFromDirectory(directory, localeHint).filter(
    (prompt) => prompt.publish !== false,
  );
}

function sortPrompts(prompts: Prompt[]): Prompt[] {
  return prompts.sort((a, b) => (a.date > b.date ? -1 : 1));
}

/* ── Public API ── */

export function getAllPrompts(locale?: string): Prompt[] {
  return sortPrompts(getPromptsInScope(locale));
}

export function getPromptBySlug(
  slug: string,
  locale?: string,
): Prompt | null {
  const realSlug = safeDecodeURIComponent(slug).replace(/\.md$/, "");
  const scopedPrompts = getPromptsInScope(locale);
  return scopedPrompts.find((prompt) => prompt.slug === realSlug) || null;
}

export function getPromptSlugs(locale?: string): string[] {
  return getAllPrompts(locale).map((prompt) => prompt.slug);
}

export function getAllPromptPlatforms(locale?: string): string[] {
  const platformSet = new Set<string>();
  getAllPrompts(locale).forEach((prompt) => platformSet.add(prompt.platform));
  return Array.from(platformSet).sort();
}

export function getAllPromptCategories(locale?: string): string[] {
  const categorySet = new Set<string>();
  getAllPrompts(locale).forEach((prompt) =>
    categorySet.add(prompt.category),
  );
  return Array.from(categorySet).sort();
}

export function getAllPromptTags(locale?: string): string[] {
  const tagSet = new Set<string>();
  getAllPrompts(locale).forEach((prompt) =>
    prompt.tags.forEach((tag) => tagSet.add(tag)),
  );
  return Array.from(tagSet).sort();
}

export function searchPrompts(query: string, locale?: string): Prompt[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return getAllPrompts(locale);

  return getAllPrompts(locale).filter(
    (prompt) =>
      prompt.title.toLowerCase().includes(normalizedQuery) ||
      prompt.excerpt.toLowerCase().includes(normalizedQuery) ||
      prompt.promptText.toLowerCase().includes(normalizedQuery) ||
      prompt.tags.some((tag) =>
        tag.toLowerCase().includes(normalizedQuery),
      ) ||
      prompt.platform.toLowerCase().includes(normalizedQuery) ||
      prompt.category.toLowerCase().includes(normalizedQuery),
  );
}

export function getPromptsByPlatform(
  platform: string,
  locale?: string,
): Prompt[] {
  return getAllPrompts(locale).filter(
    (prompt) => prompt.platform === platform,
  );
}

export function getPromptsByCategory(
  category: string,
  locale?: string,
): Prompt[] {
  return getAllPrompts(locale).filter(
    (prompt) => prompt.category === category,
  );
}
