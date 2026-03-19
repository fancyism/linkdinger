import type { Metadata } from "next";
import { Package, Download, ExternalLink } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  return {
    title: "Digital Products",
    description:
      "Premium AI tools, prompt templates, and resources for vibe-coders.",
    alternates: {
      canonical: `/${locale}/products/`,
    },
  };
}

const PRODUCTS = [
  {
    id: "1",
    title: "Mastering AI Coding Prompts",
    description:
      "A 50-page guide + 20 Copy-Paste templates for Claude 3.5 Sonnet and GPT-4o. Learn to vibe-code like a senior engineer.",
    price: "$19",
    imageUrl:
      "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&q=80",
    url: "#",
    badge: "Bestseller",
  },
  {
    id: "2",
    title: "Next.js Glassmorphism UI Kit",
    description:
      "The exact React/Tailwind components used to build this exact blog. 10+ premium, animated components ready for your project.",
    price: "$29",
    imageUrl:
      "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&q=80",
    url: "#",
    badge: "New",
  },
  {
    id: "3",
    title: "Cursor + Windsurf Setup Guide",
    description:
      "My complete configuration files, custom rules, and workflow hacks for dual-wielding the best AI IDEs.",
    price: "Free",
    imageUrl:
      "https://images.unsplash.com/photo-1614729939124-032f0b56c9ce?w=800&q=80",
    url: "#",
  },
];

export default function ProductsPage() {
  return (
    <section className="py-16 px-4 sm:px-6 relative overflow-hidden min-h-screen">
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-peach/10 blur-[120px] rounded-full mix-blend-screen pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="mb-16 text-center max-w-2xl mx-auto">
          <div className="w-16 h-16 rounded-full bg-peach/10 flex items-center justify-center mx-auto mb-6 text-peach">
            <Package size={32} />
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-black mb-6">
            Digital <span className="text-peach">Products</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 font-light leading-relaxed">
            Level up your workflow with premium templates, guides, and tools
            built specifically for AI-native developers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {PRODUCTS.map((product) => (
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
                  className="bg-white text-black dark:bg-white/10 dark:text-white dark:hover:bg-peach dark:hover:text-white hover:bg-black hover:text-white px-6 py-4 rounded-xl font-display font-bold uppercase tracking-wider text-sm flex items-center justify-center gap-2 transition-all group/btn"
                >
                  {product.price === "Free" ? (
                    <>
                      Download Now <Download size={16} />
                    </>
                  ) : (
                    <>
                      Get Access{" "}
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
