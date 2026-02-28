'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { Menu, X, Search, Github, Twitter, Sun, Moon } from 'lucide-react'
import { CommandPalette } from './command-palette'

export default function Navbar({ posts = [] }: { posts?: any[] }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isCommandOpen, setIsCommandOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [visible, setVisible] = useState(true)
  const [lastScroll, setLastScroll] = useState(0)
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()

  const [isMac, setIsMac] = useState(true)

  useEffect(() => {
    setMounted(true)
    if (typeof window !== 'undefined') {
      setIsMac(navigator.platform.toUpperCase().indexOf('MAC') >= 0)
    }
  }, [])

  useEffect(() => {
    const onScroll = () => {
      const current = window.scrollY
      setScrolled(current > 20)
      setVisible(current < lastScroll || current < 100)
      setLastScroll(current)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [lastScroll])

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/blog', label: 'Blog' },
    { href: '/about', label: 'About' },
  ]

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  return (
    <nav
      className={`glass sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'border-b border-glass-border' : 'border-b border-transparent'
        } ${visible ? 'translate-y-0' : '-translate-y-full'}`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-2xl font-display font-bold text-peach group-hover:text-peach-light transition-colors">
              Linkdinger
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`relative py-1 text-sm font-medium transition-colors ${isActive(link.href)
                  ? 'text-peach'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
              >
                {link.label}
                {isActive(link.href) && (
                  <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-peach rounded-full" />
                )}
              </Link>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => setIsCommandOpen(true)}
              className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:text-peach hover:bg-black/5 dark:hover:bg-white/5 transition-all text-sm flex items-center gap-2 group"
              aria-label="Search"
            >
              <span className="opacity-0 group-hover:opacity-100 transition-opacity hidden lg:inline-block">
                {mounted ? (isMac ? 'Cmd K' : 'Ctrl K') : 'Cmd K'}
              </span>
              <Search size={18} />
            </button>
            <a
              href="https://github.com/fancyism"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:text-peach hover:bg-black/5 dark:hover:bg-white/5 transition-all"
              aria-label="GitHub"
            >
              <Github size={18} />
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:text-peach hover:bg-black/5 dark:hover:bg-white/5 transition-all"
              aria-label="Twitter"
            >
              <Twitter size={18} />
            </a>

            {/* Theme Toggle */}
            {mounted && (
              <button
                onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
                className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:text-peach hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                aria-label={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} theme`}
              >
                {resolvedTheme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            )}
          </div>

          {/* Mobile: Theme Toggle + Hamburger */}
          <div className="md:hidden flex items-center gap-2">
            {mounted && (
              <button
                onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
                className="p-2 rounded-lg text-gray-600 dark:text-gray-400"
                aria-label="Toggle theme"
              >
                {resolvedTheme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
              </button>
            )}
            <button
              className="p-2 rounded-lg text-gray-600 dark:text-gray-300"
              onClick={() => setIsOpen(!isOpen)}
              aria-label={isOpen ? 'Close menu' : 'Open menu'}
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0'
            }`}
        >
          <div className="py-4 border-t border-glass-border space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive(link.href)
                  ? 'text-peach bg-peach/5'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
              >
                {link.label}
              </Link>
            ))}
            <button
              onClick={() => {
                setIsOpen(false);
                setIsCommandOpen(true);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-left"
            >
              <Search size={16} />
              Search
            </button>
          </div>
        </div>
      </div>

      <CommandPalette open={isCommandOpen} setOpen={setIsCommandOpen} posts={posts} />
    </nav>
  )
}
