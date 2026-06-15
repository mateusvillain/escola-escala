interface CardProps {
  children: React.ReactNode
  ariaLabel?: string
  className?: string
}

export function Card({ children, ariaLabel = 'Card', className }: CardProps) {
  return (
    <lui-card aria-label={ariaLabel} className={className}>
      {children}
    </lui-card>
  )
}
