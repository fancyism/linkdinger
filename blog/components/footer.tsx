import Link from 'next/link'
import { Github, Twitter, Mail, Rss } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="glass border-t border-glass-border mt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl font-display font-bold text-peach">
              Linkdinger
            </span>
            <span className="text-gray-500 text-sm">
              · Zero-Footprint Docs
            </span>
          </div>

          <div className="flex items-center gap-6">
            <a href="https://github.com" target="_blank" rel="noopener noreferrer"
               className="text-gray-400 hover:text-peach transition-colors">
              <Github size={20} />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer"
               className="text-gray-400 hover:text-peach transition-colors">
              <Twitter size={20} />
            </a>
            <a href="mailto:hello@example.com"
               className="text-gray-400 hover:text-peach transition-colors">
              <Mail size={20} />
            </a>
            <Link href="/rss.xml" 
               className="text-gray-400 hover:text-peach transition-colors">
              <Rss size={20} />
            </Link>
          </div>

          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} All rights reserved
          </p>
        </div>
      </div>
    </footer>
  )
}
