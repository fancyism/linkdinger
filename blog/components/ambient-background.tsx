'use client'

export default function AmbientBackground() {
    return (
        <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none" aria-hidden="true">
            {/* ── Noise Texture Overlay ── */}
            <div className="absolute inset-0 noise-overlay opacity-[0.015] dark:opacity-[0.03]" />
            
            {/* ── Dark Theme Orbs ── */}
            <div className="dark-orbs">
                {/* Deep Purple */}
                <div
                    className="ambient-orb animate-float"
                    style={{
                        width: '600px',
                        height: '600px',
                        top: '-10%',
                        left: '-5%',
                        background: 'radial-gradient(circle, rgba(88, 28, 135, 0.4) 0%, transparent 70%)',
                    }}
                />
                {/* Electric Blue */}
                <div
                    className="ambient-orb animate-float-delayed"
                    style={{
                        width: '500px',
                        height: '500px',
                        top: '40%',
                        right: '-10%',
                        background: 'radial-gradient(circle, rgba(37, 99, 235, 0.3) 0%, transparent 70%)',
                    }}
                />
                {/* Hot Pink */}
                <div
                    className="ambient-orb animate-float-slow"
                    style={{
                        width: '450px',
                        height: '450px',
                        bottom: '-5%',
                        left: '30%',
                        background: 'radial-gradient(circle, rgba(236, 72, 153, 0.25) 0%, transparent 70%)',
                    }}
                />
            </div>

            {/* ── Light Theme Orbs ── */}
            <div className="light-orbs hidden">
                {/* Lavender */}
                <div
                    className="ambient-orb animate-float"
                    style={{
                        width: '600px',
                        height: '600px',
                        top: '-10%',
                        left: '-5%',
                        background: 'radial-gradient(circle, rgba(167, 139, 250, 0.2) 0%, transparent 70%)',
                    }}
                />
                {/* Mint */}
                <div
                    className="ambient-orb animate-float-delayed"
                    style={{
                        width: '500px',
                        height: '500px',
                        top: '40%',
                        right: '-10%',
                        background: 'radial-gradient(circle, rgba(52, 211, 153, 0.15) 0%, transparent 70%)',
                    }}
                />
                {/* Blush */}
                <div
                    className="ambient-orb animate-float-slow"
                    style={{
                        width: '450px',
                        height: '450px',
                        bottom: '-5%',
                        left: '30%',
                        background: 'radial-gradient(circle, rgba(251, 146, 60, 0.15) 0%, transparent 70%)',
                    }}
                />
            </div>

            <style jsx>{`
        :global(.dark) .dark-orbs { display: block; }
        :global(.dark) .light-orbs { display: none; }
        :global(.light) .dark-orbs { display: none; }
        :global(.light) .light-orbs { display: block; }

        /* Noise texture using SVG */
        .noise-overlay {
            background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
            background-repeat: repeat;
        }
      `}</style>
        </div>
    )
}
