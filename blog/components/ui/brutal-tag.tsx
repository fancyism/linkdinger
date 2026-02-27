import { ReactNode } from 'react'
import Link from 'next/link'

interface BrutalTagProps {
  children: ReactNode
  href?: string
  className?: string
}

export default function BrutalTag({ children, href, className = '' }: BrutalTagProps) {
  const baseClass = `brutal-tag text-xs inline-block ${className}`

  if (href) {
    return (
      <Link href={href} className={baseClass}>
        {children}
      </Link>
    )
  }

  return <span className={baseClass}>{children}</span>
}
