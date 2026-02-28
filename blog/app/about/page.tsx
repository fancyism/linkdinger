import { Github, Twitter, Mail, ExternalLink, MapPin, Linkedin, Facebook, Globe } from 'lucide-react'
import { GitHubCalendar } from 'react-github-calendar'
import Image from 'next/image'
import NewsletterForm from '@/components/newsletter-form'

export const metadata = {
  title: 'About | Affan',
  description: 'Deep in vibe-coding mode – tinkering with shiny web tech, chasing fresh ideas.',
}

export default function AboutPage() {
  return (
    <section className="py-16 px-4 sm:px-6 relative overflow-hidden min-h-screen">

      {/* Subtle Ambient Background */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-peach/5 blur-[120px] rounded-full mix-blend-screen pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-blue-500/5 blur-[150px] rounded-full mix-blend-screen pointer-events-none" />

      <div className="max-w-2xl mx-auto relative z-10">

        {/* Intro Section - Clean and text-focused */}
        <div className="mb-16">
          <div className="flex flex-col sm:flex-row gap-6 items-start mb-8">
            <Image
              src="/images/about/profile-photo.png"
              alt="Affan"
              width={100}
              height={100}
              className="rounded-full object-cover ring-1 ring-black/10 dark:ring-white/10 shrink-0 aspect-square"
            />
            <div className="pt-2">
              <h1 className="text-3xl sm:text-4xl font-display font-bold mb-3 text-gray-900 dark:text-white">
                Hi, I&apos;m Affan
              </h1>
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm mb-4">
                <MapPin size={14} className="text-peach" />
                <span>Bangkok ↔ The Internet</span>
              </div>
            </div>
          </div>

          <div className="prose dark:prose-invert prose-lg text-gray-600 dark:text-gray-300 font-light leading-relaxed">
            <p className="mb-4">
              Deep in <strong>vibe-coding</strong> mode – tinkering with shiny web tech, chasing fresh ideas.
            </p>
            <p>
              After years of building standard software, the modern web feels like a canvas for magical experiences. I build what excites me and release it all as open source. Learning in public and documenting the journey.
            </p>
          </div>
        </div>

        <hr className="border-black/10 dark:border-white/10 my-12" />

        {/* GitHub Activity Section */}
        <div className="mb-16">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <h2 className="text-2xl font-display font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Github size={24} className="text-gray-600 dark:text-gray-400" />
              GitHub Activity
            </h2>
            <a
              href="https://github.com/fancyism"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors flex items-center gap-1"
            >
              Follow @fancyism <ExternalLink size={14} />
            </a>
          </div>

          <div className="overflow-x-auto pb-4">
            <div className="min-w-[750px] opacity-90 hover:opacity-100 transition-opacity">
              <GitHubCalendar
                username="fancyism"
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

        <hr className="border-black/10 dark:border-white/10 my-12" />

        {/* Stay In the loop Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-display font-bold mb-4 text-gray-900 dark:text-white">Stay in the loop</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-8 font-light leading-relaxed">
            New posts, shipping stories, and nerdy links straight to your inbox.<br />
            <span className="text-gray-400 dark:text-gray-500 text-sm mt-1 block">2× per month, pure signal, zero fluff.</span>
          </p>

          <div className="max-w-md">
            <NewsletterForm />
          </div>

          <div className="flex gap-4 mt-10">
            <a href="https://github.com/fancyism" target="_blank" rel="noopener noreferrer" className="text-gray-600 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors" aria-label='GitHub'>
              <Github size={20} />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-gray-600 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors" aria-label='Twitter'>
              <Twitter size={20} />
            </a>
            <a href="mailto:hello@example.com" className="text-gray-600 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors" aria-label='Email'>
              <Mail size={20} />
            </a>
            <a href="www.linkedin.com/in/fan-affan" target="_blank" rel="noopener noreferrer" className="text-gray-600 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors" aria-label='LinkedIn'>
              <Linkedin size={20} />
            </a>
            <a href="https://facebook.com/yourprofile" target="_blank" rel="noopener noreferrer" className="text-gray-600 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors" aria-label='Facebook'>
              <Facebook size={20} />
            </a>
            <a href="https://fan-portfolio-zeta.vercel.app/" target="_blank" rel="noopener noreferrer" className="text-gray-600 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors" aria-label='Website'>
              <Globe size={20} />
            </a>
          </div>
        </div>

      </div>
    </section>
  )
}
