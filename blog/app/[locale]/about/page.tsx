import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  Github,
  Twitter,
  Mail,
  ExternalLink,
  MapPin,
  Linkedin,
  Facebook,
  Globe,
} from "lucide-react";
import { GitHubCalendar } from "react-github-calendar";
import Image from "next/image";
import NewsletterForm from "@/components/newsletter-form";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "AboutPage" });

  return {
    title: t("title"),
    description: t("metaDescription"),
    alternates: {
      canonical: `/${locale}/about/`,
    },
  };
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "AboutPage" });

  const profileSchema = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    inLanguage: locale,
    url: `${siteUrl}/${locale}/about/`,
    mainEntity: {
      "@type": "Person",
      name: "Affan",
      url: `${siteUrl}/${locale}/about/`,
      image: `${siteUrl}/images/about/profile-photo.png`,
      description: t("personDescription"),
      jobTitle: t("jobTitle"),
      knowsAbout: [
        "AI Tools",
        "Web Development",
        "Next.js",
        "Prompt Engineering",
        "Glassmorphism",
      ],
      sameAs: [
        "https://github.com/fancyism",
        "https://www.linkedin.com/in/fan-affan",
        "https://fan-portfolio-zeta.vercel.app/",
      ],
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(profileSchema) }}
      />
      <section className="py-16 px-4 sm:px-6 relative overflow-hidden min-h-screen">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-peach/5 blur-[120px] rounded-full mix-blend-screen pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-blue-500/5 blur-[150px] rounded-full mix-blend-screen pointer-events-none" />

        <div className="max-w-2xl mx-auto relative z-10">
          <div className="mb-16">
            <div className="flex flex-col sm:flex-row gap-6 items-start mb-8">
              <Image
                src="/images/about/profile-photo.png"
                alt="Affan"
                width={100}
                height={100}
                className="rounded-full object-cover ring-1 ring-black/10 dark:ring-white/10 shrink-0 aspect-square"
              />
              <div className="pt-2">
                <h1 className="text-3xl sm:text-4xl font-display font-bold mb-3 text-gray-900 dark:text-white">
                  {t("introTitle")}
                </h1>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm mb-4">
                  <MapPin size={14} className="text-peach" />
                  <span>{t("location")}</span>
                </div>
              </div>
            </div>

            <div className="prose dark:prose-invert prose-lg text-gray-600 dark:text-gray-300 font-light leading-relaxed">
              <p className="mb-4">
                {t("introLead")}
              </p>
              <p>{t("introBody")}</p>
            </div>
          </div>

          <hr className="border-black/10 dark:border-white/10 my-12" />

          <div className="mb-16">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <h2 className="text-2xl font-display font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Github
                  size={24}
                  className="text-gray-600 dark:text-gray-400"
                />
                {t("githubActivity")}
              </h2>
              <a
                href="https://github.com/fancyism"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors flex items-center gap-1"
              >
                {t("followGithub")} <ExternalLink size={14} />
              </a>
            </div>

            <div className="overflow-x-auto pb-4">
              <div className="min-w-[750px] opacity-90 hover:opacity-100 transition-opacity">
                <GitHubCalendar
                  username="fancyism"
                  colorScheme="dark"
                  theme={{
                    light: [
                      "#161b22",
                      "#0e4429",
                      "#006d32",
                      "#26a641",
                      "#39d353",
                    ],
                    dark: [
                      "rgba(255,255,255,0.05)",
                      "rgba(255,107,53,0.3)",
                      "rgba(255,107,53,0.5)",
                      "rgba(255,107,53,0.8)",
                      "#FF6B35",
                    ],
                  }}
                  blockSize={12}
                  blockMargin={4}
                  fontSize={12}
                />
              </div>
            </div>
          </div>

          <hr className="border-black/10 dark:border-white/10 my-12" />

          <div className="mb-8">
            <h2 className="text-2xl font-display font-bold mb-4 text-gray-900 dark:text-white">
              {t("newsletterTitle")}
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-8 font-light leading-relaxed">
              {t("newsletterBody")}
              <br />
              <span className="text-gray-400 dark:text-gray-500 text-sm mt-1 block">
                {t("newsletterMeta")}
              </span>
            </p>

            <div className="max-w-md">
              <NewsletterForm />
            </div>

            <div className="flex gap-4 mt-10">
              <a
                href="https://github.com/fancyism"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
                aria-label="GitHub"
              >
                <Github size={20} />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
                aria-label="Twitter"
              >
                <Twitter size={20} />
              </a>
              <a
                href="mailto:hello@example.com"
                className="text-gray-600 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
                aria-label="Email"
              >
                <Mail size={20} />
              </a>
              <a
                href="https://www.linkedin.com/in/fan-affan"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin size={20} />
              </a>
              <a
                href="https://facebook.com/yourprofile"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
                aria-label="Facebook"
              >
                <Facebook size={20} />
              </a>
              <a
                href="https://fan-portfolio-zeta.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
                aria-label="Website"
              >
                <Globe size={20} />
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
