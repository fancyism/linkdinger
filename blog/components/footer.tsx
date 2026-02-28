import Link from 'next/link'
import { Github, Twitter, Mail, Linkedin, Facebook, Globe } from 'lucide-react'
import NewsletterForm from './newsletter-form'

export default function Footer() {
  return (
    <footer className="glass border-t border-glass-border mt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* About */}
          <div>
            <h3 className="font-display font-bold text-lg mb-3 text-peach">
              Linkdinger
            </h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              AI-powered tools and thoughts. Every commit lands on GitHub
              for you to fork &amp; remix. Built with obsession.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider mb-3 text-gray-300">
              Navigate
            </h4>
            <ul className="space-y-2">
              {[
                { href: '/', label: 'Home' },
                { href: '/blog', label: 'Blog' },
                { href: '/about', label: 'About' },
                { href: '/search', label: 'Search' },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-400 hover:text-peach transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Social & Newsletter */}
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider mb-3 text-gray-300">
              Connect
            </h4>
            <div className="flex gap-3 mb-5">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg glass-card hover:border-peach/30 transition-all"
                aria-label="GitHub"
              >
                <Github size={18} className="text-gray-400" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg glass-card hover:border-peach/30 transition-all"
                aria-label="Twitter"
              >
                <Twitter size={18} className="text-gray-400" />
              </a>
              <a
                href="mailto:hello@example.com"
                className="p-2 rounded-lg glass-card hover:border-peach/30 transition-all"
                aria-label="Email"
              >
                <Mail size={18} className="text-gray-400" />
              </a>
              <a
                href="https://linkedin.com/in/yourprofile"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg glass-card hover:border-peach/30 transition-all"
                aria-label="LinkedIn"
              >
                <Linkedin size={18} className="text-gray-400" />
              </a>
              <a
                href="https://facebook.com/yourprofile"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg glass-card hover:border-peach/30 transition-all"
                aria-label="Facebook"
              >
                <Facebook size={18} className="text-gray-400" />
              </a>
              <a
                href="https://fan-portfolio-zeta.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg glass-card hover:border-peach/30 transition-all"
                aria-label="Website"
              >
                <Globe size={18} className="text-gray-400" />
              </a>
            </div>

            {/* Newsletter CTA */}
            <NewsletterForm />
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 pt-6 border-t border-glass-border flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} Linkdinger. Built with Next.js & ❤️
          </p>
          <p className="text-xs text-gray-500">
            Dark Glassmorphism · Peach Fuzz #FF6B35
          </p>
        </div>
      </div>
    </footer>
  )
}
