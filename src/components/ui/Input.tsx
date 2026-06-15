'use client'

interface InputProps {
  label?: string
  placeholder?: string
  name?: string
  value?: string
  type?: string
  size?: 'lg' | 'md'
  disabled?: boolean
  required?: boolean
  optional?: boolean
  hint?: string
  error?: boolean
  errorText?: string
  maxLength?: number
  prefix?: string
  suffix?: string
  className?: string
}

export function Input({
  label,
  placeholder,
  name,
  value,
  type = 'text',
  size = 'lg',
  disabled,
  required,
  optional,
  hint,
  error,
  errorText,
  maxLength,
  prefix,
  suffix,
  className,
}: InputProps) {
  return (
    <lui-input
      label={label}
      placeholder={placeholder}
      name={name}
      value={value}
      type={type}
      size={size}
      disabled={disabled}
      required={required}
      optional={optional}
      hint={hint}
      error={error}
      error-text={errorText}
      maxlength={maxLength?.toString()}
      prefix={prefix}
      suffix={suffix}
      className={className}
    />
  )
}
