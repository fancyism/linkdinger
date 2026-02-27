interface BrutalTagProps {
  children: React.ReactNode
  className?: string
}

export default function BrutalTag({ children, className = '' }: BrutalTagProps) {
  return (
    <span className={`brutal-tag ${className}`}>
      {children}
    </span>
  )
}
