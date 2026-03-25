import { Link } from "@/i18n/navigation";
import type { Post } from "@/lib/posts";

interface HomeGalleryProps {
  posts: Post[];
}

export default function HomeGallery({ posts }: HomeGalleryProps) {
  if (posts.length === 0) return null;

  return (
    <div className="flex flex-col w-full">
      <div className="flex flex-col border-t border-black/10 dark:border-white/10">
        {posts.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="group flex flex-row items-center justify-between py-6 border-b border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition-colors px-4 -mx-4 rounded-xl"
          >
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8 flex-1">
              <span className="text-gray-500 dark:text-gray-400 font-display font-medium text-sm sm:text-base shrink-0 sm:w-24">
                {post.date.split(",")[0]}
              </span>
              <h3 className="text-xl sm:text-2xl font-display font-bold text-gray-900 dark:text-white group-hover:text-peach transition-colors leading-tight">
                {post.title}
              </h3>
            </div>

            <div className="hidden sm:block shrink-0 ml-8">
              {post.coverImage ? (
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl overflow-hidden bg-black/10 dark:bg-black/50 relative">
                  <img
                    src={post.coverImage}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover filter dark:brightness-90 dark:group-hover:brightness-100 group-hover:scale-105 transition-all duration-700"
                    loading="lazy"
                  />
                </div>
              ) : (
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl bg-black/5 dark:bg-white/5 flex items-center justify-center">
                  <span className="text-4xl opacity-10 font-display font-bold">
                    {post.title.charAt(0)}
                  </span>
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
