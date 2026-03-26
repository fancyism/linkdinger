import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Package, Download, ExternalLink } from "lucide-react";

type PageProps = {
  params: Promise<{ locale: string }>;
};

type ProductTranslations = Awaited<ReturnType<typeof getTranslations>>;

function getProducts(t: ProductTranslations) {
  return [
    {
      id: "1",
      title: t("product1Title"),
      description: t("product1Description"),
      price: "$19",
      imageUrl:
        "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&q=80",
      url: "#",
      badge: t("badgeBestseller"),
      isFree: false,
    },
    {
      id: "2",
      title: t("product2Title"),
      description: t("product2Description"),
      price: "$29",
      imageUrl:
        "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&q=80",
      url: "#",
      badge: t("badgeNew"),
      isFree: false,
    },
    {
      id: "3",
      title: t("product3Title"),
      description: t("product3Description"),
      price: t("freePrice"),
      imageUrl:
        "https://images.unsplash.com/photo-1614729939124-032f0b56c9ce?w=800&q=80",
      url: "#",
      isFree: true,
    },
  ];
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "ProductsPage" });

  return {
    title: t("title"),
    description: t("metaDescription"),
    alternates: {
      canonical: `/${locale}/products/`,
    },
  };
}

export default async function ProductsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "ProductsPage" });
  const products = getProducts(t);

  return (
    <section className="py-16 px-4 sm:px-6 relative overflow-hidden min-h-screen">
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-peach/10 blur-[120px] rounded-full mix-blend-screen pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="mb-16 text-center max-w-2xl mx-auto">
          <div className="w-16 h-16 rounded-full bg-peach/10 flex items-center justify-center mx-auto mb-6 text-peach">
            <Package size={32} />
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-black mb-6">
            {t("heroTitlePrefix")}{" "}
            <span className="text-peach">{t("heroTitleHighlight")}</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 font-light leading-relaxed">
            {t("heroDescription")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product) => (
            <div
              key={product.id}
              className="glass-card rounded-3xl overflow-hidden flex flex-col group border border-white/5 hover:border-peach/30 transition-all duration-300"
            >
              <div className="relative aspect-video overflow-hidden">
                {product.badge && (
                  <div className="absolute top-4 left-4 z-10 bg-black/60 dark:bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-display tracking-widest uppercase text-white font-medium">
                    {product.badge}
                  </div>
                )}
                <img
                  src={product.imageUrl}
                  alt={product.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-8 flex flex-col flex-1">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <h3 className="text-xl font-display font-bold group-hover:text-peach transition-colors">
                    {product.title}
                  </h3>
                  <span className="font-mono text-lg font-bold text-peach bg-peach/10 px-3 py-1 rounded-xl">
                    {product.price}
                  </span>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-8 flex-1">
                  {product.description}
                </p>
                <a
                  href={product.url}
                  className="relative z-10 bg-white text-black hover:bg-black hover:text-white dark:bg-white/10 dark:text-white dark:hover:bg-peach dark:hover:text-white px-6 py-4 rounded-xl font-display font-bold uppercase tracking-wider text-sm flex items-center justify-center gap-2 transition-colors duration-300 will-change-[background-color] group/btn"
                >
                  {product.isFree ? (
                    <>
                      {t("downloadNow")} <Download size={16} />
                    </>
                  ) : (
                    <>
                      {t("getAccess")}{" "}
                      <ExternalLink
                        size={16}
                        className="group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform"
                      />
                    </>
                  )}
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
