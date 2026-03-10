import Image from 'next/image'
import { ExternalLink, Star } from 'lucide-react'

interface AffiliateCardProps {
    title: string
    description: string
    imageUrl: string
    productUrl: string
    price?: string
    badgeText?: string
    rating?: number
}

export default function AffiliateCard({
    title,
    description,
    imageUrl,
    productUrl,
    price,
    badgeText = 'Recommended AI Tool',
    rating = 5,
}: AffiliateCardProps) {
    return (
        <a
            href={productUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group block my-8 no-underline"
        >
            <div className="flex flex-col sm:flex-row bg-[#0a0a0a]/40 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl overflow-hidden hover:border-[#FF6B35]/50 transition-all duration-300 relative">
                {/* Badge */}
                <div className="absolute top-3 left-3 z-10 bg-black/60 dark:bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] sm:text-xs font-display tracking-widest uppercase text-white font-medium border border-white/10">
                    {badgeText}
                </div>

                {/* Image */}
                <div className="relative w-full sm:w-1/3 aspect-[4/3] sm:aspect-auto overflow-hidden bg-white/5">
                    <Image
                        src={imageUrl}
                        alt={title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 640px) 100vw, 33vw"
                    />
                </div>

                {/* Content */}
                <div className="p-6 flex flex-col justify-between flex-1">
                    <div>
                        <div className="flex items-start justify-between gap-4 mb-2">
                            <h3 className="text-xl font-display font-bold text-gray-900 dark:text-white m-0 group-hover:text-[#FF6B35] transition-colors">
                                {title}
                            </h3>
                            {price && (
                                <span className="font-mono text-sm font-semibold bg-[#FF6B35]/10 text-[#FF6B35] px-2 py-1 rounded-lg shrink-0">
                                    {price}
                                </span>
                            )}
                        </div>

                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 md:line-clamp-3 m-0 mb-4 leading-relaxed">
                            {description}
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
                        <div className="flex items-center gap-1 text-[#FF6B35]">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                    key={i}
                                    size={14}
                                    fill={i < rating ? "currentColor" : "transparent"}
                                    className={i < rating ? "text-[#FF6B35]" : "text-gray-300 dark:text-gray-600"}
                                />
                            ))}
                        </div>

                        <div className="flex items-center gap-2 text-sm font-display font-bold uppercase tracking-wider text-gray-900 dark:text-white group-hover:text-[#FF6B35] transition-colors decoration-0">
                            View Deal <ExternalLink size={16} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                        </div>
                    </div>
                </div>
            </div>
            <p className="text-[10px] text-gray-400 text-center mt-2 font-mono uppercase tracking-widest opacity-60">
                Disclosure: We may earn a commission if you purchase through this link.
            </p>
        </a>
    )
}
