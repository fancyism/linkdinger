"use client";

import { Link, usePathname } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useTheme } from "next-themes";
import { Menu, X, Search, Github, Sun, Moon } from "lucide-react";
import { resolveLocaleSwitchTarget } from "@/lib/locale-switch";
import { CommandPalette } from "./command-palette";

interface NavbarPost {
  slug: string;
  title: string;
}

interface NavbarProps {
  posts?: NavbarPost[];
  postLocaleAlternates?: Record<string, string>;
}

export default function Navbar({
  posts = [],
  postLocaleAlternates = {},
}: NavbarProps) {
  const t = useTranslations("Navbar");
  const locale = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [visible, setVisible] = useState(true);
  const lastScrollRef = useRef(0);
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const params = useParams<{ slug?: string | string[] }>();
  const searchParams = useSearchParams();
  const [isMac, setIsMac] = useState(true);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      setIsMac(navigator.platform.toUpperCase().indexOf("MAC") >= 0);
    }
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const current = window.scrollY;
      setScrolled(current > 20);
      setVisible(current < lastScrollRef.current || current < 100);
      lastScrollRef.current = current;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.key.toLowerCase() !== "k" ||
        (!event.metaKey && !event.ctrlKey)
      ) {
        return;
      }

      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
      ) {
        return;
      }

      event.preventDefault();
      setIsCommandOpen(true);
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const navLinks = [
    { href: "/", label: t("home") },
    { href: "/blog", label: t("blog") },
    { href: "/prompts", label: t("prompts") },
    { href: "/products", label: t("products") },
    { href: "/consultation", label: t("consultation") },
    { href: "/about", label: t("about") },
  ];
  const localeSwitchTarget = resolveLocaleSwitchTarget({
    locale,
    pathname,
    search: searchParams.toString(),
    slugParam: params.slug,
    postLocaleAlternates,
  });
  const { alternateLocale } = localeSwitchTarget;
  const localeLabel = alternateLocale === "en" ? t("english") : t("thai");

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <nav
      className={`glass sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b border-black/10 dark:border-white/10"
          : "border-b border-transparent"
      } ${visible ? "translate-y-0" : "-translate-y-full"}`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative flex-shrink-0">
              {/* Ambient glow */}
              <div className="absolute -inset-1 bg-gradient-to-br from-peach/30 via-peach-light/20 to-transparent rounded-full blur-md opacity-60 group-hover:opacity-100 transition-opacity duration-500" />
              {/* Ring border - circular */}
              <div className="relative p-[2px] rounded-full bg-gradient-to-br from-peach/50 via-peach-light/30 to-transparent">
                <div className="bg-white dark:bg-dark-surface rounded-full p-1">
                  <Image
                    src="/logo-lind.png"
                    alt="Linkdinger"
                    width={40}
                    height={40}
                    className="rounded-full transition-all duration-300 group-hover:scale-105"
                    priority
                  />
                </div>
              </div>
            </div>
            {/* Brand text */}
            <span className="text-2xl font-display font-bold text-peach group-hover:text-peach-light transition-colors duration-300">
              Linkdinger
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`relative py-1 text-sm font-medium transition-colors ${
                  isActive(link.href)
                    ? "text-peach"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                {link.label}
                {isActive(link.href) && (
                  <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-peach rounded-full" />
                )}
              </Link>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => setIsCommandOpen(true)}
              className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:text-peach hover:bg-black/5 dark:hover:bg-white/5 transition-all text-sm flex items-center gap-2 group"
              aria-label={t("search")}
            >
              <span className="opacity-0 group-hover:opacity-100 transition-opacity hidden lg:inline-block">
                {mounted ? (isMac ? "Cmd K" : "Ctrl K") : "Cmd K"}
              </span>
              <Search size={18} />
            </button>
            <a
              href="https://github.com/fancyism"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:text-peach hover:bg-black/5 dark:hover:bg-white/5 transition-all"
              aria-label="GitHub"
            >
              <Github size={18} />
            </a>

            {/* Theme Toggle */}
            {mounted && (
              <button
                onClick={() =>
                  setTheme(resolvedTheme === "dark" ? "light" : "dark")
                }
                className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:text-peach hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                aria-label={
                  resolvedTheme === "dark"
                    ? t("switchToLight")
                    : t("switchToDark")
                }
              >
                {resolvedTheme === "dark" ? (
                  <Sun size={18} />
                ) : (
                  <Moon size={18} />
                )}
              </button>
            )}
            {localeSwitchTarget.useRawHref ? (
              <a
                href={localeSwitchTarget.href}
                className="rounded-lg px-2.5 py-1.5 text-xs font-display font-bold uppercase tracking-widest text-gray-600 transition-all hover:bg-black/5 hover:text-peach dark:text-gray-400 dark:hover:bg-white/5"
                aria-label={t("language")}
              >
                {localeLabel}
              </a>
            ) : (
              <Link
                href={localeSwitchTarget.href}
                locale={localeSwitchTarget.linkLocale}
                className="rounded-lg px-2.5 py-1.5 text-xs font-display font-bold uppercase tracking-widest text-gray-600 transition-all hover:bg-black/5 hover:text-peach dark:text-gray-400 dark:hover:bg-white/5"
                aria-label={t("language")}
              >
                {localeLabel}
              </Link>
            )}
          </div>

          {/* Mobile: Theme Toggle + Language + Hamburger */}
          <div className="md:hidden flex items-center gap-2">
            {mounted && (
              <button
                onClick={() =>
                  setTheme(resolvedTheme === "dark" ? "light" : "dark")
                }
                className="p-2 rounded-lg text-gray-600 dark:text-gray-400"
                aria-label={t("toggleTheme")}
              >
                {resolvedTheme === "dark" ? (
                  <Sun size={20} />
                ) : (
                  <Moon size={20} />
                )}
              </button>
            )}
            {localeSwitchTarget.useRawHref ? (
              <a
                href={localeSwitchTarget.href}
                className="rounded-lg px-2.5 py-1.5 text-xs font-display font-bold uppercase tracking-widest text-gray-600 transition-all hover:bg-black/5 hover:text-peach dark:text-gray-400 dark:hover:bg-white/5"
                aria-label={t("language")}
              >
                {localeLabel}
              </a>
            ) : (
              <Link
                href={localeSwitchTarget.href}
                locale={localeSwitchTarget.linkLocale}
                className="rounded-lg px-2.5 py-1.5 text-xs font-display font-bold uppercase tracking-widest text-gray-600 transition-all hover:bg-black/5 hover:text-peach dark:text-gray-400 dark:hover:bg-white/5"
                aria-label={t("language")}
              >
                {localeLabel}
              </Link>
            )}
            <button
              className="p-2 rounded-lg text-gray-600 dark:text-gray-300"
              onClick={() => setIsOpen(!isOpen)}
              aria-label={isOpen ? t("closeMenu") : t("openMenu")}
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ${
            isOpen ? "max-h-80 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="py-4 border-t border-glass-border space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(link.href)
                    ? "text-peach bg-peach/5"
                    : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
                }`}
              >
                {link.label}
              </Link>
            ))}
            {localeSwitchTarget.useRawHref ? (
              <a
                href={localeSwitchTarget.href}
                onClick={() => setIsOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                {t("language")}: {localeLabel}
              </a>
            ) : (
              <Link
                href={localeSwitchTarget.href}
                locale={localeSwitchTarget.linkLocale}
                onClick={() => setIsOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                {t("language")}: {localeLabel}
              </Link>
            )}
            <button
              onClick={() => {
                setIsOpen(false);
                setIsCommandOpen(true);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-left"
            >
              <Search size={16} />
              {t("search")}
            </button>
          </div>
        </div>
      </div>

      {isCommandOpen ? (
        <CommandPalette
          open={isCommandOpen}
          setOpen={setIsCommandOpen}
          posts={posts}
        />
      ) : null}
    </nav>
  );
}
