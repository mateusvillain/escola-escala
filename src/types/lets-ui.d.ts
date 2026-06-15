type LuiBase = { className?: string }

declare namespace React {
  namespace JSX {
    interface IntrinsicElements {
      'lui-button': React.HTMLAttributes<HTMLElement> & LuiBase & {
        variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
        size?: 'lg' | 'md'
        type?: 'button' | 'submit' | 'reset'
        disabled?: boolean
        loading?: boolean
        block?: boolean
        label?: string
        'loading-text'?: string
        'aria-label'?: string
      }
      'lui-input': React.HTMLAttributes<HTMLElement> & {
        label?: string
        placeholder?: string
        size?: 'lg' | 'md'
        type?: string
        name?: string
        value?: string
        disabled?: boolean
        required?: boolean
        optional?: boolean
        'optional-text'?: string
        hint?: string
        error?: boolean
        'error-text'?: string
        maxlength?: string
        prefix?: string
        suffix?: string
        'aria-label'?: string
      }
      'lui-card': React.HTMLAttributes<HTMLElement> & {
        'aria-label'?: string
      }
      'lui-tag': React.HTMLAttributes<HTMLElement> & {
        label?: string
        'tag-style'?: 'surface' | 'subtle' | 'outline'
        variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'caution' | 'info'
        size?: 'xl' | 'lg' | 'md' | 'sm'
        circle?: boolean
      }
      'lui-alert': React.HTMLAttributes<HTMLElement> & {
        variant?: 'success' | 'caution' | 'danger' | 'info'
        title?: string
        content?: string
      }
      'lui-heading': React.HTMLAttributes<HTMLElement> & {
        level?: '1' | '2' | '3' | '4' | '5' | '6'
        size?: string
        weight?: string
      }
      'lui-body': React.HTMLAttributes<HTMLElement> & {
        size?: string
        weight?: string
      }
      'lui-divider': React.HTMLAttributes<HTMLElement>
      'lui-stack': React.HTMLAttributes<HTMLElement> & { space?: string }
      'lui-box': React.HTMLAttributes<HTMLElement>
      'lui-flex': React.HTMLAttributes<HTMLElement> & {
        gap?: string
        align?: string
        justify?: string
        direction?: string
        wrap?: string
      }
      'lui-grid': React.HTMLAttributes<HTMLElement> & { columns?: string; gap?: string }
      'lui-grid-item': React.HTMLAttributes<HTMLElement>
    }
  }
}
