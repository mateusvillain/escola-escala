type AlertVariant = 'success' | 'caution' | 'danger' | 'info'

interface AlertProps {
  title: string
  content?: string
  variant?: AlertVariant
  className?: string
}

export function Alert({ title, content, variant = 'info', className }: AlertProps) {
  return (
    <lui-alert
      title={title}
      content={content}
      variant={variant}
      className={className}
    />
  )
}
