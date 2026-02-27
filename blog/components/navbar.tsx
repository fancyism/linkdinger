'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Menu, X, Search, Github, Twitter } from 'lucide-react'

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <nav className="glass sticky top-0 z-50 border-b border-glass-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-display font-bold text-peach">
              Linkdinger
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-gray-300 hover:text-white transition-colors">
              Home
            </Link>
            <Link href="/blog" className="text-gray-300 hover:text-white transition-colors">
              Blog
            </Link>
            <Link href="/about" className="text-gray-300 hover:text-white transition-colors">
              About
            </Link>
            <Link href="/search" className="text-gray-300 hover:text-white transition-colors">
              <Search size={20} />
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" 
               className="text-gray-400 hover:text-peach transition-colors">
              <Github size={20} />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer"
               className="text-gray-400 hover:text-peach transition-colors">
              <Twitter size={20} />
            </a>
          </div>

          <button 
            className="md:hidden text-gray-300"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {isOpen && (
          <div className="md:hidden py-4 border-t border-glass-border">
            <div className="flex flex-col gap-4">
              <Link href="/" className="text-gray-300 hover:text-white transition-colors">
                Home
              </Link>
              <Link href="/blog" className="text-gray-300 hover:text-white transition-colors">
                Blog
              </Link>
              <Link href="/about" className="text-gray-300 hover:text-white transition-colors">
                About
              </Link>
              <Link href="/search" className="text-gray-300 hover:text-white transition-colors">
                Search
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
