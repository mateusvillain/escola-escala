'use client'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'lg' | 'md'
type ButtonType = 'button' | 'submit' | 'reset'

interface ButtonProps {
  label: string
  variant?: ButtonVariant
  size?: ButtonSize
  type?: ButtonType
  disabled?: boolean
  loading?: boolean
  block?: boolean
  loadingText?: string
  onClick?: () => void
  className?: string
}

export function Button({
  label,
  variant = 'primary',
  size = 'lg',
  type = 'button',
  disabled,
  loading,
  block,
  loadingText,
  onClick,
  className,
}: ButtonProps) {
  return (
    <lui-button
      label={label}
      variant={variant}
      size={size}
      type={type}
      disabled={disabled}
      loading={loading}
      block={block}
      loading-text={loadingText}
      onClick={onClick}
      className={className}
    />
  )
}
