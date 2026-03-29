import { getTranslations } from "next-intl/server";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import {
  Github,
  Twitter,
  Mail,
  Linkedin,
  Facebook,
  Globe,
  Coffee,
} from "lucide-react";
import NewsletterForm from "./newsletter-form";
import KofiButton from "./kofi-button";
import ScrollToTop from "./scroll-to-top";

export default async function Footer() {
  const t = await getTranslations("Footer");
  const year = new Date().getFullYear();

  return (
    <>
      <footer className="glass border-t border-glass-border mt-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="relative flex-shrink-0">
                  {/* Ambient glow */}
                  <div className="absolute -inset-1 bg-gradient-to-br from-peach/30 via-peach-light/20 to-transparent rounded-full blur-md opacity-50" />
                  {/* Ring border - circular */}
                  <div className="relative p-[2px] rounded-full bg-gradient-to-br from-peach/50 via-peach-light/30 to-transparent">
                    <div className="bg-white dark:bg-dark-surface rounded-full p-1">
                      <Image
                        src="/logo-lind.png"
                        alt="Linkdinger"
                        width={36}
                        height={36}
                        className="rounded-full"
                      />
                    </div>
                  </div>
                </div>
                <h3 className="font-display font-bold text-xl text-peach">
                  Linkdinger
                </h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                {t("tagline")}
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-sm uppercase tracking-wider mb-3 text-gray-800 dark:text-gray-300">
                {t("navigate")}
              </h4>
              <ul className="space-y-2">
                {[
                  { href: "/", label: t("home") },
                  { href: "/blog", label: t("blog") },
                  { href: "/prompts", label: t("prompts") },
                  { href: "/products", label: t("products") },
                  { href: "/consultation", label: t("consultation") },
                  { href: "/about", label: t("about") },
                  { href: "/search", label: t("search") },
                ].map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-600 dark:text-gray-400 hover:text-peach transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-sm uppercase tracking-wider mb-3 text-gray-800 dark:text-gray-300">
                {t("connect")}
              </h4>
              <div className="flex flex-wrap gap-3 mb-5">
                <a
                  href="https://ko-fi.com/linkdinger"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg glass-card hover:border-peach/30 transition-all text-[#FF6B35]"
                  aria-label="Ko-fi"
                >
                  <Coffee size={18} />
                </a>
                <a
                  href="https://github.com/fancyism"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg glass-card hover:border-peach/30 transition-all"
                  aria-label="GitHub"
                >
                  <Github
                    size={18}
                    className="text-gray-600 dark:text-gray-400"
                  />
                </a>
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg glass-card hover:border-peach/30 transition-all"
                  aria-label="Twitter"
                >
                  <Twitter
                    size={18}
                    className="text-gray-600 dark:text-gray-400"
                  />
                </a>
                <a
                  href="mailto:hello@example.com"
                  className="p-2 rounded-lg glass-card hover:border-peach/30 transition-all"
                  aria-label="Email"
                >
                  <Mail
                    size={18}
                    className="text-gray-600 dark:text-gray-400"
                  />
                </a>
                <a
                  href="https://www.linkedin.com/in/fan-affan"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg glass-card hover:border-peach/30 transition-all"
                  aria-label="LinkedIn"
                >
                  <Linkedin
                    size={18}
                    className="text-gray-600 dark:text-gray-400"
                  />
                </a>
                <a
                  href="https://facebook.com/yourprofile"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg glass-card hover:border-peach/30 transition-all"
                  aria-label="Facebook"
                >
                  <Facebook
                    size={18}
                    className="text-gray-600 dark:text-gray-400"
                  />
                </a>
                <a
                  href="https://fan-portfolio-zeta.vercel.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg glass-card hover:border-peach/30 transition-all"
                  aria-label="Website"
                >
                  <Globe
                    size={18}
                    className="text-gray-600 dark:text-gray-400"
                  />
                </a>
              </div>

              <NewsletterForm />
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-glass-border flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-xs text-gray-600 dark:text-gray-500">
              {t("copyright", { year })}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-500">
              {t("aesthetic")}
            </p>
          </div>
        </div>
      </footer>
      <KofiButton variant="floating" />
      <ScrollToTop />
    </>
  );
}
