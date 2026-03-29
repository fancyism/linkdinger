import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Shield, Bot, Activity, Database } from "lucide-react";
import { getSecurityStats } from "@/lib/security-stats";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "SecurityPage" });

  return {
    title: t("title"),
    description: t("description"),
    robots: { index: false, follow: false },
  };
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="mb-3 flex items-center gap-3">
        <div className="rounded-xl border border-peach/20 bg-peach/[0.08] p-2 text-peach">
          {icon}
        </div>
        <p className="text-xs font-display uppercase tracking-[0.16em] text-slate-500 dark:text-gray-400">
          {label}
        </p>
      </div>
      <p className="text-4xl font-display font-black text-slate-900 dark:text-white">
        {value}
      </p>
    </div>
  );
}

function StatsTable({
  title,
  rows,
}: {
  title: string;
  rows: Array<{ label: string; blocked: number; throttled: number }>;
}) {
  return (
    <div className="glass-card rounded-2xl p-5">
      <h2 className="mb-4 text-sm font-display font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-gray-400">
        {title}
      </h2>
      <div className="space-y-3">
        {rows.map((row) => (
          <div
            key={row.label}
            className="grid grid-cols-[minmax(0,1fr)_90px_90px] items-center gap-3 rounded-xl border border-black/8 bg-black/[0.02] px-4 py-3 text-sm dark:border-white/8 dark:bg-white/[0.03]"
          >
            <span className="font-medium text-slate-700 dark:text-gray-200">{row.label}</span>
            <span className="text-right text-slate-500 dark:text-gray-400">{row.blocked}</span>
            <span className="text-right text-slate-500 dark:text-gray-400">{row.throttled}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function SecurityPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "SecurityPage" });
  const stats = await getSecurityStats();

  return (
    <section className="px-4 pb-20 pt-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 max-w-3xl">
          <p className="mb-3 text-xs font-display uppercase tracking-[0.18em] text-peach">
            {t("eyebrow")}
          </p>
          <h1 className="mb-4 text-4xl font-display font-black leading-tight text-slate-900 dark:text-white sm:text-5xl">
            {t("headline")}
          </h1>
          <p className="text-base leading-relaxed text-slate-600 dark:text-gray-300">
            {t("body")}
          </p>
        </div>

        {!stats.configured ? (
          <div className="glass-card rounded-2xl p-6 text-slate-600 dark:text-gray-300">
            {t("unconfigured")}
          </div>
        ) : (
          <>
            <div className="mb-8 grid gap-5 md:grid-cols-2">
              <StatCard
                icon={<Bot size={18} />}
                label={t("blockedAiBots")}
                value={stats.totals.aiBotBlocked}
              />
              <StatCard
                icon={<Activity size={18} />}
                label={t("throttledTraffic")}
                value={stats.totals.suspiciousThrottled}
              />
            </div>

            <div className="grid gap-6 xl:grid-cols-3">
              <StatsTable title={t("byClassification")} rows={stats.byClassification} />
              <StatsTable title={t("byRouteFamily")} rows={stats.byRouteFamily} />
              <StatsTable title={t("byStorage")} rows={stats.byStorage} />
            </div>

            <div className="mt-8 glass-card rounded-2xl p-5 text-sm text-slate-600 dark:text-gray-300">
              <div className="mb-3 flex items-center gap-3 text-slate-900 dark:text-white">
                <Shield size={18} className="text-peach" />
                <span className="font-display font-bold uppercase tracking-[0.16em]">
                  {t("notesTitle")}
                </span>
              </div>
              <div className="space-y-2">
                <p>{t("notesLine1")}</p>
                <p>{t("notesLine2")}</p>
                <p className="flex items-center gap-2">
                  <Database size={15} className="text-peach" />
                  {t("notesLine3")}
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
