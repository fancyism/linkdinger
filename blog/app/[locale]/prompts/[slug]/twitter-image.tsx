import { generatePromptSocialImage, contentType, size } from "./social-image";

export { contentType, size };

export default async function Image({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  return generatePromptSocialImage(locale, slug);
}
