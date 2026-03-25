import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  basePath: string;
}

export default async function Pagination({
  currentPage,
  totalPages,
  basePath,
}: PaginationProps) {
  const t = await getTranslations("Pagination");

  if (totalPages <= 1) return null;

  const getPageUrl = (pageNumber: number) => {
    const normalizedBasePath =
      basePath === "/"
        ? ""
        : basePath.endsWith("/")
          ? basePath.slice(0, -1)
          : basePath;

    if (pageNumber === 1) return normalizedBasePath || "/";
    return `${normalizedBasePath}/page/${pageNumber}`;
  };

  return (
    <div className="flex justify-between items-center mt-8 px-4 w-full">
      {currentPage > 1 ? (
        <Link
          href={getPageUrl(currentPage - 1)}
          className="px-6 py-2 rounded-full border border-black/10 dark:border-white/10 text-gray-900 dark:text-white font-display font-medium hover:bg-black/5 dark:hover:bg-white/5 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B35]/50 transition-all inline-block"
        >
          {t("previous")}
        </Link>
      ) : (
        <span className="px-6 py-2 rounded-full border border-black/10 dark:border-white/10 text-gray-900/30 dark:text-white/30 font-display font-medium cursor-not-allowed">
          {t("previous")}
        </span>
      )}

      <span className="text-sm text-gray-500 font-display">
        {t("summary", { current: currentPage, total: totalPages })}
      </span>

      {currentPage < totalPages ? (
        <Link
          href={getPageUrl(currentPage + 1)}
          className="px-6 py-2 rounded-full border border-black/10 dark:border-white/10 text-gray-900 dark:text-white font-display font-medium hover:bg-black/5 dark:hover:bg-white/5 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B35]/50 transition-all inline-block"
        >
          {t("next")}
        </Link>
      ) : (
        <span className="px-6 py-2 rounded-full border border-black/10 dark:border-white/10 text-gray-900/30 dark:text-white/30 font-display font-medium cursor-not-allowed">
          {t("next")}
        </span>
      )}
    </div>
  );
}
