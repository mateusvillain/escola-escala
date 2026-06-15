type BadgeVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'caution' | 'info'
type BadgeStyle = 'surface' | 'subtle' | 'outline'
type BadgeSize = 'xl' | 'lg' | 'md' | 'sm'

interface BadgeProps {
  label: string
  variant?: BadgeVariant
  tagStyle?: BadgeStyle
  size?: BadgeSize
  circle?: boolean
  className?: string
}

export function Badge({
  label,
  variant = 'primary',
  tagStyle = 'surface',
  size = 'md',
  circle,
  className,
}: BadgeProps) {
  return (
    <lui-tag
      label={label}
      variant={variant}
      tag-style={tagStyle}
      size={size}
      circle={circle}
      className={className}
    />
  )
}
