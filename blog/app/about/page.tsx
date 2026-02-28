import { Github, Twitter, Mail, ExternalLink, Code2, MapPin } from 'lucide-react'
import { GitHubCalendar } from 'react-github-calendar'

export const metadata = {
  title: 'About | Affan',
  description: 'Deep in vibe-coding mode – tinkering with shiny web tech, chasing fresh ideas.',
}

export default function AboutPage() {
  return (
    <section className="py-12 px-4 sm:px-6 relative overflow-hidden min-h-screen">

      {/* Ambient Background Glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-peach/10 blur-[120px] rounded-full mix-blend-screen pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-blue-500/10 blur-[150px] rounded-full mix-blend-screen pointer-events-none" />

      <div className="max-w-3xl mx-auto relative z-10">

        {/* Intro Section - The Liquid Glass Vibe Hero */}
        <div className="liquid-glass rounded-3xl p-8 sm:p-12 mb-12 relative overflow-hidden group">
          {/* Subtle physics-like shine effect on hover */}
          <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 blur-xl pointer-events-none" />

          <div className="flex flex-col md:flex-row gap-8 items-center md:items-start mb-8">
            <div className="shrink-0 relative">
              <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-peach via-peach-dark to-purple-500 flex items-center justify-center text-5xl shadow-[0_0_40px_rgba(255,107,53,0.3)] animate-float">
                👨‍💻
              </div>
              {/* Decorative floating badge */}
              <div className="absolute -bottom-3 -right-3 glass-card !rounded-full p-2 animate-float-delayed">
                <Code2 size={20} className="text-peach" />
              </div>
            </div>

            <div>
              <h1 className="text-4xl sm:text-5xl font-display font-bold mb-4 tracking-tight drop-shadow-md text-white">
                Hi, I&apos;m <span className="text-transparent bg-clip-text bg-gradient-to-r from-peach to-purple-400">Affan</span>
              </h1>
              <p className="text-xl text-gray-300 leading-relaxed font-light">
                Deep in <strong className="text-peach font-semibold">vibe-coding</strong> mode – tinkering with shiny web tech, chasing fresh ideas.
                After years of building standard software, the modern web feels like a canvas for magical, physics-driven experiences.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-gray-400 text-sm">
            <div className="flex items-center gap-1.5 glass-button px-3 py-1.5 rounded-full cursor-default">
              <MapPin size={14} className="text-peach" />
              <span>Bangkok ↔ The Internet</span>
            </div>
            <div>
              Open source everything. Learning in public.
            </div>
          </div>
        </div>

        {/* GitHub Activity Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6 px-1">
            <h2 className="text-2xl font-display font-bold text-white flex items-center gap-2">
              <Github className="text-peach" />
              GitHub Activity
            </h2>
            <a
              href="https://github.com/Affanj"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-400 hover:text-peach transition-colors flex items-center gap-1"
            >
              Follow me <ExternalLink size={14} />
            </a>
          </div>

          <div className="liquid-glass rounded-3xl p-6 sm:p-8 overflow-x-auto">
            <p className="text-gray-300 mb-6 font-light">
              I build what excites me and release it all as open source. Every commit lands here for you to fork & remix.
            </p>
            <div className="min-w-[750px] flex justify-center opacity-90 hover:opacity-100 transition-opacity">
              {/* Hardcoding a mock username for demo, change to your real one */}
              <GitHubCalendar
                username="Affanj"
                colorScheme="dark"
                theme={{
                  light: ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353'],
                  dark: ['rgba(255,255,255,0.05)', 'rgba(255,107,53,0.3)', 'rgba(255,107,53,0.5)', 'rgba(255,107,53,0.8)', '#FF6B35'],
                }}
                blockSize={12}
                blockMargin={4}
                fontSize={12}
              />
            </div>
          </div>
        </div>

        {/* Stay Connected Section */}
        <div className="liquid-glass rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden group">
          <div className="relative z-10">
            <h2 className="text-2xl font-display font-bold mb-4 text-white">Stay Connected</h2>
            <p className="text-gray-300 mb-8 max-w-lg mx-auto font-light leading-relaxed">
              New posts, shipping stories, and nerdy links right to your vibe.
              If you&apos;d like to connect or have questions about my work, feel free to reach out.
            </p>

            <div className="flex justify-center gap-4">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="glass-button group/btn !p-4 !rounded-2xl transition-all duration-300 hover:scale-110 hover:-translate-y-1"
                aria-label="GitHub"
              >
                <Github size={24} className="group-hover/btn:text-peach transition-colors" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="glass-button group/btn !p-4 !rounded-2xl transition-all duration-300 hover:scale-110 hover:-translate-y-1"
                aria-label="Twitter"
              >
                <Twitter size={24} className="group-hover/btn:text-peach transition-colors" />
              </a>
              <a
                href="mailto:hello@example.com"
                className="glass-button group/btn !p-4 !rounded-2xl transition-all duration-300 hover:scale-110 hover:-translate-y-1"
                aria-label="Email"
              >
                <Mail size={24} className="group-hover/btn:text-peach transition-colors" />
              </a>
            </div>
          </div>
        </div>

      </div>
    </section>
  )
}
