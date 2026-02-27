'use client'

export default function AmbientBackground() {
    return (
        <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none" aria-hidden="true">
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
      `}</style>
        </div>
    )
}
