export default function Loading() {
    return (
        <section className="py-16 px-4 sm:px-6 animate-fade-in">
            <div className="max-w-6xl mx-auto">

                {/* ── Hero Skeleton ── */}
                <div className="glass-card p-6 sm:p-10 mb-12">
                    <div className="flex flex-col gap-6">
                        {/* Category + date */}
                        <div className="flex items-center gap-3">
                            <div className="skeleton h-7 w-24 rounded-lg" />
                            <div className="skeleton h-4 w-32 rounded-md" />
                        </div>
                        {/* Title lines */}
                        <div className="space-y-3 max-w-2xl">
                            <div className="skeleton h-8 sm:h-10 w-full rounded-lg" />
                            <div className="skeleton h-8 sm:h-10 w-3/4 rounded-lg" />
                        </div>
                        {/* Excerpt */}
                        <div className="space-y-2 max-w-xl">
                            <div className="skeleton h-4 w-full rounded-md" />
                            <div className="skeleton h-4 w-5/6 rounded-md" />
                        </div>
                        {/* Author */}
                        <div className="flex items-center gap-3 pt-2">
                            <div className="skeleton h-10 w-10 rounded-full" />
                            <div className="space-y-1.5">
                                <div className="skeleton h-4 w-28 rounded-md" />
                                <div className="skeleton h-3 w-20 rounded-md" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Section Title Skeleton ── */}
                <div className="flex items-center gap-4 mb-8">
                    <div className="skeleton h-6 w-40 rounded-lg" />
                    <div className="flex-1 h-px bg-glass-border dark:bg-glass-border" />
                </div>

                {/* ── Card Grid Skeleton ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => (
                        <div
                            key={i}
                            className="glass-card p-5 flex flex-col gap-4"
                            style={{ animationDelay: `${i * 80}ms` }}
                        >
                            {/* Image placeholder */}
                            <div className="skeleton h-40 sm:h-44 w-full rounded-xl" />
                            {/* Tag */}
                            <div className="skeleton h-6 w-20 rounded-lg" />
                            {/* Title */}
                            <div className="space-y-2">
                                <div className="skeleton h-5 w-full rounded-md" />
                                <div className="skeleton h-5 w-2/3 rounded-md" />
                            </div>
                            {/* Excerpt */}
                            <div className="space-y-1.5">
                                <div className="skeleton h-3.5 w-full rounded-md" />
                                <div className="skeleton h-3.5 w-4/5 rounded-md" />
                            </div>
                            {/* Footer */}
                            <div className="flex items-center justify-between pt-2 mt-auto">
                                <div className="skeleton h-3.5 w-24 rounded-md" />
                                <div className="skeleton h-3.5 w-16 rounded-md" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
