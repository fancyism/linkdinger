import { ReactNode } from 'react'

interface GlassButtonProps {
  children: ReactNode
  className?: string
  onClick?: () => void
  href?: string
}

export default function GlassButton({ children, className = '', onClick, href }: GlassButtonProps) {
  const baseClass = `glass-button px-4 py-2 font-medium cursor-pointer inline-block ${className}`

  if (href) {
    return (
      <a href={href} className={baseClass}>
        {children}
      </a>
    )
  }

  return (
    <button className={baseClass} onClick={onClick}>
      {children}
    </button>
  )
}
