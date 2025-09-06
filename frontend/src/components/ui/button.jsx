import React from 'react'
import clsx from 'clsx'

const Button = React.forwardRef(({ className, variant = 'primary', size = 'md', disabled, children, ...props }, ref) => {
  return (
    <button
      ref={ref}
      className={clsx(
        // Base styles
        'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-150',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
        
        // Size variants
        {
          'h-8 px-3 text-body-sm': size === 'sm',
          'h-10 px-4 text-body': size === 'md',
          'h-12 px-6 text-body-lg': size === 'lg',
        },
        
        // Color variants
        {
          // Primary
          'bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 focus:ring-primary-500': 
            variant === 'primary',
          
          // Secondary  
          'bg-neutral-100 text-neutral-700 border border-neutral-300 hover:bg-neutral-200 active:bg-neutral-300 focus:ring-primary-500':
            variant === 'secondary',
          
          // Outline
          'border border-primary-300 text-primary-700 hover:bg-primary-50 active:bg-primary-100 focus:ring-primary-500':
            variant === 'outline',
          
          // Ghost
          'text-neutral-700 hover:bg-neutral-100 active:bg-neutral-200 focus:ring-primary-500':
            variant === 'ghost',
          
          // Danger
          'bg-error-600 text-white hover:bg-error-700 active:bg-error-800 focus:ring-error-500':
            variant === 'danger',
          
          // Success
          'bg-success-600 text-white hover:bg-success-700 active:bg-success-800 focus:ring-success-500':
            variant === 'success',
        },
        
        // Dark mode variants
        {
          'dark:bg-primary-500 dark:hover:bg-primary-600 dark:active:bg-primary-700': 
            variant === 'primary',
          'dark:bg-neutral-700 dark:text-neutral-200 dark:border-neutral-600 dark:hover:bg-neutral-600': 
            variant === 'secondary',
          'dark:border-primary-600 dark:text-primary-400 dark:hover:bg-primary-950': 
            variant === 'outline',
          'dark:text-neutral-300 dark:hover:bg-neutral-800': 
            variant === 'ghost',
        },
        
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
})

Button.displayName = 'Button'

export { Button }