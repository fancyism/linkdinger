import { Github, Twitter, Mail, ExternalLink } from 'lucide-react'

export const metadata = {
  title: 'About',
  description: 'Learn more about the creator behind Linkdinger',
}

const techStack = [
  { name: 'Python', emoji: '🐍' },
  { name: 'Next.js', emoji: '⚡' },
  { name: 'TypeScript', emoji: '📘' },
  { name: 'Tailwind CSS', emoji: '🎨' },
  { name: 'Cloudflare R2', emoji: '☁️' },
  { name: 'Git', emoji: '📦' },
  { name: 'Obsidian', emoji: '💎' },
  { name: 'Node.js', emoji: '🟢' },
]

export default function AboutPage() {
  return (
    <section className="py-12 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        {/* Hero */}
        <div className="liquid-glass rounded-3xl p-8 sm:p-12 text-center mb-12">
          <div className="w-28 h-28 mx-auto rounded-full bg-gradient-to-br from-peach to-peach-dark flex items-center justify-center text-5xl mb-6 shadow-lg shadow-peach/20">
            👋
          </div>
          <h1 className="text-4xl sm:text-5xl font-display font-bold mb-4">
            Hi, I&apos;m <span className="text-peach">Affan</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Builder of AI-powered tools. I write about technology, design, and
            the craft of building software. Every commit lands on GitHub for you
            to fork &amp; remix.
          </p>

          {/* Social Links */}
          <div className="flex justify-center gap-3 mt-6">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="glass-button !p-3 !rounded-xl"
              aria-label="GitHub"
            >
              <Github size={20} />
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="glass-button !p-3 !rounded-xl"
              aria-label="Twitter"
            >
              <Twitter size={20} />
            </a>
            <a
              href="mailto:hello@example.com"
              className="glass-button !p-3 !rounded-xl"
              aria-label="Email"
            >
              <Mail size={20} />
            </a>
          </div>
        </div>

        {/* Tech Stack */}
        <div className="mb-12">
          <h2 className="text-2xl font-display font-bold mb-6">Tech Stack</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {techStack.map(({ name, emoji }) => (
              <div
                key={name}
                className="glass-card p-4 text-center hover:border-peach/30"
              >
                <span className="text-2xl block mb-2">{emoji}</span>
                <span className="text-sm font-medium text-gray-300">{name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* About This Blog */}
        <div className="mb-12">
          <h2 className="text-2xl font-display font-bold mb-6">
            About This Blog
          </h2>
          <div className="glass-card p-6 sm:p-8">
            <div className="prose">
              <p>
                <strong>Linkdinger</strong> is more than a blog — it&apos;s a complete
                content pipeline. I write in Obsidian, and a Python daemon
                automatically:
              </p>
              <ul>
                <li>Converts pasted images to optimized WebP</li>
                <li>Uploads them to Cloudflare R2 with UUID filenames</li>
                <li>Updates markdown links in real-time</li>
                <li>Commits and pushes changes to GitHub</li>
                <li>Syncs published notes to this blog</li>
              </ul>
              <p>
                The blog itself is built with Next.js 14, using Server Components
                for speed and Static Generation for SEO. The aesthetic is{' '}
                <strong>Dark Glassmorphism</strong> — frosted glass surfaces over
                vibrant gradient orbs, with Peach Fuzz #FF6B35 accents.
              </p>
            </div>
          </div>
        </div>

        {/* Colophon */}
        <div className="glass-card p-6 sm:p-8">
          <h2 className="text-xl font-display font-bold mb-4">Colophon</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Design</span>
              <p className="text-gray-300">Dark Glassmorphism + Neubrutalism</p>
            </div>
            <div>
              <span className="text-gray-500">Fonts</span>
              <p className="text-gray-300">Outfit · Inter · JetBrains Mono</p>
            </div>
            <div>
              <span className="text-gray-500">Framework</span>
              <p className="text-gray-300">Next.js 14 (App Router)</p>
            </div>
            <div>
              <span className="text-gray-500">Inspiration</span>
              <p className="text-gray-300">
                <a href="https://www.awwwards.com/blog/" target="_blank" rel="noopener noreferrer" className="text-peach hover:underline inline-flex items-center gap-1">
                  Awwwards <ExternalLink size={12} />
                </a>
                {' · '}
                <a href="https://abduzeedo.com/" target="_blank" rel="noopener noreferrer" className="text-peach hover:underline inline-flex items-center gap-1">
                  Abduzeedo <ExternalLink size={12} />
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
