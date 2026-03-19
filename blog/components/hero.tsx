import { Link } from "@/i18n/navigation";
import BrutalTag from "./ui/brutal-tag";

interface HeroProps {
  title: string;
  excerpt: string;
  slug: string;
  date: string;
  readTime: string;
  tags?: string[];
  coverImage?: string;
  badgeText?: string;
}

export default function Hero({
  title,
  excerpt,
  slug,
  date,
  readTime,
  tags = [],
  coverImage,
  badgeText,
}: HeroProps) {
  // Try to parse date heavily or simply display it raw, but make it striking
  const dateStr = date || "";

  return (
    <Link href={`/blog/${slug}`} className="block group mb-12">
      <section className="relative overflow-hidden rounded-3xl glass-card border border-white/10 dark:border-white/20 transition-all duration-500 hover:border-peach/50 dark:hover:border-peach/70">
        {coverImage ? (
          <div className="flex flex-col md:flex-row min-h-[500px] xl:min-h-[600px]">
            {/* Left Content Area (Typography Focus) */}
            <div className="flex-1 p-8 sm:p-12 lg:p-16 flex flex-col justify-between relative z-10 w-full md:w-3/5">
              <div className="max-w-xl">
                {badgeText && (
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-peach/10 text-peach border border-peach/20 text-xs font-bold tracking-widest uppercase mb-6 shadow-sm backdrop-blur-md">
                    <span className="w-1.5 h-1.5 bg-peach rounded-full animate-pulse shadow-[0_0_8px_rgba(255,107,53,0.8)]" />
                    {badgeText}
                  </div>
                )}
                <h1 className="text-5xl sm:text-6xl lg:text-[5rem] font-display font-black text-gray-900 dark:text-white leading-[1.05] tracking-tighter mb-6 group-hover:text-peach dark:group-hover:text-peach transition-colors drop-shadow-sm dark:drop-shadow-md">
                  {title}
                </h1>

                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-3 mt-8">
                    {tags.slice(0, 3).map((tag) => (
                      <BrutalTag key={tag}>{tag}</BrutalTag>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-end justify-between mt-12 sm:mt-24">
                <span className="text-4xl sm:text-5xl font-display font-extrabold text-gray-900 dark:text-white tracking-tighter">
                  {dateStr}
                </span>

                <p className="text-gray-600 dark:text-gray-300 text-sm xl:text-base max-w-[250px] text-right hidden sm:block border-r-2 border-peach pr-4">
                  {excerpt}
                </p>
              </div>
            </div>

            {/* Right Image Area */}
            <div className="w-full md:w-2/5 relative min-h-[300px] md:min-h-full overflow-hidden bg-black/50">
              <img
                src={coverImage}
                alt={title}
                className="absolute inset-0 w-full h-full object-cover md:object-center object-top filter brightness-90 group-hover:brightness-110 group-hover:scale-105 transition-all duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent md:bg-gradient-to-l md:from-transparent md:via-transparent md:to-[#0d0d0d]/80" />

              {/* Vertical Artistic Text overlay */}
              <div className="hidden lg:flex absolute right-4 top-0 bottom-0 items-center pointer-events-none">
                <span className="text-black/30 dark:text-white/80 font-display font-black tracking-[0.3em] uppercase text-sm rotate-90 origin-right translate-x-1/2 whitespace-nowrap drop-shadow-sm dark:drop-shadow-lg mix-blend-overlay">
                  VIBE CODING
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="liquid-glass p-12 lg:p-20 text-center">
            <h1 className="text-5xl sm:text-7xl font-display font-black mb-6 tracking-tighter group-hover:text-peach transition-colors">
              {title}
            </h1>
            <p className="text-gray-400 text-xl max-w-2xl mx-auto mb-8 font-medium">
              {excerpt}
            </p>
            <div className="flex justify-center gap-4 text-sm text-gray-500 font-bold uppercase tracking-widest">
              <time>{date}</time>
              <span>·</span>
              <span>{readTime} read</span>
            </div>
          </div>
        )}
      </section>
    </Link>
  );
}
