import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import Footer from "@/components/footer";
import Navbar from "@/components/navbar";
import { routing } from "@/i18n/routing";
import { getAllPosts, getPostLocaleSwitchMap } from "@/lib/posts";
import { getAllPrompts } from "@/lib/prompts";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const dynamicParams = false;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();
  const posts = getAllPosts(locale).map(({ slug, title }) => ({ slug, title }));
  const prompts = getAllPrompts(locale).map(({ slug, title, platform, category }) => ({
    slug,
    title,
    platform,
    category,
  }));
  const postLocaleAlternates = getPostLocaleSwitchMap();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            {
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "Linkdinger",
              url: siteUrl,
              description:
                "AI-powered tools and thoughts. Every commit lands on GitHub for you to fork & remix.",
              inLanguage: locale,
              potentialAction: {
                "@type": "SearchAction",
                target: {
                  "@type": "EntryPoint",
                  urlTemplate: `${siteUrl}/${locale}/search?q={search_term_string}`,
                },
                "query-input": "required name=search_term_string",
              },
            },
            {
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Linkdinger",
              url: siteUrl,
              logo: `${siteUrl}/icon.png`,
              sameAs: [
                "https://github.com/fancyism",
                "https://www.linkedin.com/in/fan-affan",
              ],
            },
          ]),
        }}
      />
      <div className="relative z-10 flex min-h-screen flex-col">
        <Navbar posts={posts} prompts={prompts} postLocaleAlternates={postLocaleAlternates} />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </NextIntlClientProvider>
  );
}
