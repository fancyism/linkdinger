import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { SITE_AUTHOR } from "@/lib/site-author";

export default function PostAuthorCard() {
  const t = useTranslations("PostDetail");
  const aboutT = useTranslations("AboutPage");

  return (
    <Link
      href="/about"
      aria-label={t("viewAuthorPageAria", { name: SITE_AUTHOR.fullName })}
      className="group mt-6 inline-flex items-center gap-3 rounded-full border border-black/8 bg-white/60 px-3 py-2 backdrop-blur-xl transition-all hover:border-peach/25 hover:bg-white/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-peach/50 active:scale-[0.98] dark:border-white/[0.06] dark:bg-white/[0.04] dark:hover:border-peach/25 dark:hover:bg-white/[0.07]"
    >
      <Image
        src={SITE_AUTHOR.imagePath}
        alt={SITE_AUTHOR.fullName}
        width={40}
        height={40}
        className="h-10 w-10 rounded-full object-cover ring-1 ring-black/5 dark:ring-white/10"
        priority
      />

      <div className="flex flex-col gap-0.5">
        <span className="text-[0.6rem] font-display font-semibold uppercase tracking-[0.18em] text-gray-400 dark:text-gray-500">
          {t("writtenBy")}
        </span>
        <span className="text-sm font-display font-bold leading-tight text-slate-800 transition-colors group-hover:text-peach dark:text-white dark:group-hover:text-peach">
          {SITE_AUTHOR.fullName}
          <span className="ml-1.5 hidden font-normal text-slate-400 sm:inline dark:text-gray-500">
            · {aboutT("jobTitle")}
          </span>
        </span>
      </div>

      <ArrowUpRight
        size={13}
        className="ml-1 shrink-0 text-gray-300 transition-all duration-200 group-hover:text-peach group-hover:-translate-y-px group-hover:translate-x-px dark:text-gray-600"
      />
    </Link>
  );
}
