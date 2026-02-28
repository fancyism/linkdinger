import type { Metadata } from 'next'
import { Inter, Outfit, JetBrains_Mono } from 'next/font/google'
import { ThemeProvider } from 'next-themes'
import Navbar from '@/components/navbar'
import Footer from '@/components/footer'
import AmbientBackground from '@/components/ambient-background'
import './globals.css'
import 'highlight.js/styles/github-dark.min.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
  weight: ['600', '700', '800'],
})

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
  weight: ['400', '500'],
})

export const metadata: Metadata = {
  title: {
    default: 'Linkdinger — AI Tools & Thoughts',
    template: '%s | Linkdinger',
  },
  description: 'AI-powered tools and thoughts. Every commit lands on GitHub for you to fork & remix.',
  openGraph: {
    title: 'Linkdinger',
    description: 'AI-powered tools and thoughts.',
    type: 'website',
    locale: 'en_US',
    siteName: 'Linkdinger',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Linkdinger',
    description: 'AI-powered tools and thoughts.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

import { getAllPosts } from '@/lib/posts'

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const posts = getAllPosts()

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${outfit.variable} ${jetbrains.variable}`}
    >
      <body className="font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange={false}
        >
          <AmbientBackground />
          <div className="relative z-10 flex flex-col min-h-screen">
            <Navbar posts={posts} />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
