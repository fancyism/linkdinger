export const metadata = {
  title: 'About | Linkdinger',
  description: 'About me',
}

export default function AboutPage() {
  return (
    <section className="py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        <div className="liquid-glass rounded-3xl p-8 sm:p-12 mb-12">
          <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-peach to-peach-dark flex items-center justify-center text-6xl mb-6">
            👋
          </div>
          
          <h1 className="text-4xl font-display font-bold text-center mb-6">
            About Me
          </h1>
          
          <p className="text-gray-300 text-center text-lg mb-8">
            AI-powered tools from Swift roots to web frontiers.
          </p>
        </div>

        <div className="glass-card p-8 mb-8">
          <h2 className="text-2xl font-display font-bold mb-4">Who am I?</h2>
          <p className="text-gray-300 mb-4">
            I'm a developer passionate about building tools that make life easier. 
            This blog is where I share my thoughts, tutorials, and explorations in tech.
          </p>
          <p className="text-gray-300">
            Every commit lands on GitHub for you to fork & remix.
          </p>
        </div>

        <div className="glass-card p-8 mb-8">
          <h2 className="text-2xl font-display font-bold mb-4">Tech Stack</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {['TypeScript', 'Python', 'Next.js', 'Tailwind', 'Rust', 'AI/ML'].map((tech) => (
              <div key={tech} className="brutal-tag text-center">
                {tech}
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card p-8">
          <h2 className="text-2xl font-display font-bold mb-4">Connect</h2>
          <div className="flex flex-wrap gap-4">
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="glass-button">
              GitHub
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="glass-button">
              Twitter
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="glass-button">
              LinkedIn
            </a>
            <a href="mailto:hello@example.com" className="glass-button">
              Email
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
