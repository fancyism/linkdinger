import Link from 'next/link'
import GlassButton from './ui/glass-button'

export default function Hero() {
  return (
    <section className="py-20 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <div className="liquid-glass rounded-3xl p-8 sm:p-12 text-center">
          <div className="mb-6">
            <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-peach to-peach-dark flex items-center justify-center text-4xl">
              👋
            </div>
          </div>
          
          <h1 className="text-4xl sm:text-5xl font-display font-bold mb-4">
            Hi, I'm <span className="text-peach">Your Name</span>
          </h1>
          
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            AI-powered tools and thoughts. Every commit lands on GitHub for you to fork & remix.
          </p>
          
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/blog">
              <GlassButton>Read Blog</GlassButton>
            </Link>
            <Link href="/about">
              <GlassButton>About Me</GlassButton>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
