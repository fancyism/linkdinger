interface GlassButtonProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
  disabled?: boolean
  type?: 'button' | 'submit'
  'aria-label'?: string
}

export default function GlassButton({
  children,
  className = '',
  onClick,
  disabled = false,
  type = 'button',
  ...props
}: GlassButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`glass-button ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
