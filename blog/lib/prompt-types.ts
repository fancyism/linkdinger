/* ── Shared Types & Constants for Prompt system ── */
/* This file is safe for both client and server components */

export type PromptPreviewLayout = "showcase" | "spotlight" | "editorial";

export interface Prompt {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  content: string;
  platform: string;
  category: string;
  tags: string[];
  coverImage?: string;
  promptId: string;
  promptText: string;
  usageTips?: string;
  sref?: string;
  difficulty?: string;
  model?: string;
  demoUrl?: string;
  previewLayout?: PromptPreviewLayout;
  locale: string;
  translationKey?: string;
  publish: boolean;
}

export function getLocalizedPromptPath(prompt: Pick<Prompt, "locale" | "slug">): string {
  return `/${prompt.locale || "en"}/prompts/${encodeURIComponent(prompt.slug)}/`;
}

export function inferPromptPreviewLayout(prompt: Pick<Prompt, "title" | "category" | "tags" | "platform" | "promptText" | "previewLayout">): PromptPreviewLayout {
  if (prompt.previewLayout) {
    return prompt.previewLayout;
  }

  const searchable = [prompt.title, prompt.category, prompt.platform, ...(prompt.tags || []), prompt.promptText]
    .join(" ")
    .toLowerCase();

  if (/(dictionary|infographic|chart|schema|template|menu|board|map|reference|catalog|diagram|engine)/.test(searchable)) {
    return "editorial";
  }

  if (/(portrait|character|avatar|headshot|mascot|miniature|figurine|doll|single subject|needle-felted|wool)/.test(searchable)) {
    return "spotlight";
  }

  return "showcase";
}

export type PromptPlatform =
  | "ChatGPT"
  | "Midjourney"
  | "Claude"
  | "Gemini"
  | "DALL-E"
  | "Stable Diffusion"
  | "Nanobanana"
  | "Custom";

/* ── Platform Color Map ── */
export const PLATFORM_COLORS: Record<string, string> = {
  ChatGPT: "#10A37F",
  Midjourney: "#7B68EE",
  Claude: "#D4A574",
  Gemini: "#4285F4",
  "DALL-E": "#FF6B35",
  "Stable Diffusion": "#E91E63",
  Nanobanana: "#F5D136",
  Custom: "#888888",
};

export function getPlatformColor(platform: string): string {
  return PLATFORM_COLORS[platform] || PLATFORM_COLORS.Custom;
}
