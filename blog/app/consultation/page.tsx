import { Calendar, Clock, Video, Zap, ExternalLink } from 'lucide-react'

export const metadata = {
    title: 'Consultation',
    description: 'Book a 1-on-1 session to level up your AI workflow or Next.js architecture.',
    alternates: {
        canonical: '/consultation/',
    },
}

export default function ConsultationPage() {
    return (
        <section className="py-16 px-4 sm:px-6 relative overflow-hidden min-h-screen">
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-peach/10 blur-[120px] rounded-full mix-blend-screen pointer-events-none" />

            <div className="max-w-4xl mx-auto relative z-10">
                <div className="mb-12 text-center max-w-2xl mx-auto">
                    <div className="w-16 h-16 rounded-full bg-peach/10 flex items-center justify-center mx-auto mb-6 text-peach">
                        <Calendar size={32} />
                    </div>
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-black mb-6">
                        1-on-1 <span className="text-peach">Consultation</span>
                    </h1>
                    <p className="text-xl text-gray-600 dark:text-gray-400 font-light leading-relaxed">
                        Stuck on an AI implementation? Need architectural advice for your Next.js app? Let's pair program and solve it together.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
                    {/* What to expect */}
                    <div className="glass-card rounded-3xl p-8 border border-white/5 relative overflow-hidden group hover:border-peach/30 transition-colors">
                        <div className="absolute top-0 right-0 p-8 text-peach/10 group-hover:text-peach/20 transition-colors">
                            <Zap size={120} />
                        </div>
                        <h3 className="text-2xl font-display font-bold mb-6 relative z-10">How it works</h3>
                        <ul className="space-y-6 relative z-10">
                            <li className="flex gap-4">
                                <div className="w-10 h-10 rounded-full bg-peach/10 flex items-center justify-center text-peach shrink-0 font-display font-bold">1</div>
                                <div>
                                    <h4 className="font-bold text-gray-900 dark:text-white mb-1">Book a slot</h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Choose a time that works for you via Calendly. Payments are securely handled via Stripe.</p>
                                </div>
                            </li>
                            <li className="flex gap-4">
                                <div className="w-10 h-10 rounded-full bg-peach/10 flex items-center justify-center text-peach shrink-0 font-display font-bold">2</div>
                                <div>
                                    <h4 className="font-bold text-gray-900 dark:text-white mb-1">Share your context</h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Answer a few quick questions about what you want to achieve so I can prepare.</p>
                                </div>
                            </li>
                            <li className="flex gap-4">
                                <div className="w-10 h-10 rounded-full bg-peach/10 flex items-center justify-center text-peach shrink-0 font-display font-bold">3</div>
                                <div>
                                    <h4 className="font-bold text-gray-900 dark:text-white mb-1">Vibe-coding time</h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">We jump on Google Meet, screen share, and crack the problem together.</p>
                                </div>
                            </li>
                        </ul>
                    </div>

                    {/* Pricing card */}
                    <div className="glass-card rounded-3xl p-8 border border-peach/30 relative flex flex-col justify-between overflow-hidden shadow-[0_0_50px_rgba(255,107,53,0.1)]">
                        <div>
                            <div className="inline-block bg-peach/20 text-peach px-3 py-1 rounded-full text-xs font-display font-bold uppercase tracking-widest mb-6">
                                Most Popular
                            </div>
                            <h3 className="text-3xl font-display font-bold mb-2">Strategy & Pairing</h3>
                            <div className="flex items-baseline gap-2 mb-6">
                                <span className="text-4xl sm:text-5xl font-mono font-bold">$150</span>
                                <span className="text-gray-500">/ hour</span>
                            </div>

                            <ul className="space-y-4 mb-8">
                                <li className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                                    <Clock size={18} className="text-peach" /> 60-minute focused session
                                </li>
                                <li className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                                    <Video size={18} className="text-peach" /> Recorded Google Meet
                                </li>
                                <li className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                                    <Zap size={18} className="text-peach" /> Actionable post-session notes
                                </li>
                            </ul>
                        </div>

                        {/* Calendly button placeholder */}
                        <a
                            href="#"
                            className="w-full block text-center bg-[#FF6B35] text-white hover:bg-[#FF8050] px-6 py-4 rounded-xl font-display font-bold uppercase tracking-wider text-sm transition-all group shadow-lg shadow-peach/20 hover:shadow-peach/40"
                            aria-label="Book via Calendly"
                        >
                            <span className="flex items-center justify-center gap-2">
                                Book Your Session <ExternalLink size={16} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                            </span>
                        </a>
                    </div>
                </div>

            </div>
        </section>
    )
}
