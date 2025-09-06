import React from 'react'
import clsx from 'clsx'

const Input = React.forwardRef(({ className, type = 'text', error, ...props }, ref) => {
  return (
    <input
      type={type}
      ref={ref}
      className={clsx(
        'flex h-10 w-full rounded-lg border bg-neutral-50 px-3 py-2 text-body',
        'placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-offset-1',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'transition-colors duration-150',
        
        // Default state
        !error && 'border-neutral-300 focus:border-primary-500 focus:ring-primary-500/20',
        
        // Error state
        error && 'border-error-500 focus:border-error-500 focus:ring-error-500/20',
        
        // Dark mode
        'dark:bg-neutral-200 dark:border-neutral-400 dark:placeholder:text-neutral-500',
        
        className
      )}
      {...props}
    />
  )
})
Input.displayName = 'Input'

const Label = React.forwardRef(({ className, required, children, ...props }, ref) => {
  return (
    <label
      ref={ref}
      className={clsx(
        'block text-body-sm font-medium text-neutral-700 dark:text-neutral-300',
        'mb-1.5',
        className
      )}
      {...props}
    >
      {children}
      {required && <span className="text-error-500 ml-1">*</span>}
    </label>
  )
})
Label.displayName = 'Label'

const FormField = ({ label, error, help, required, children, className, ...props }) => {
  return (
    <div className={clsx('space-y-1', className)} {...props}>
      {label && <Label required={required}>{label}</Label>}
      {children}
      {help && !error && (
        <p className="text-caption text-neutral-500 dark:text-neutral-400">{help}</p>
      )}
      {error && (
        <p className="text-caption text-error-600 dark:text-error-400">{error}</p>
      )}
    </div>
  )
}

const Textarea = React.forwardRef(({ className, error, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={clsx(
        'flex min-h-[80px] w-full rounded-lg border bg-neutral-50 px-3 py-2 text-body',
        'placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-offset-1',
        'disabled:cursor-not-allowed disabled:opacity-50 resize-vertical',
        'transition-colors duration-150',
        
        // Default state
        !error && 'border-neutral-300 focus:border-primary-500 focus:ring-primary-500/20',
        
        // Error state
        error && 'border-error-500 focus:border-error-500 focus:ring-error-500/20',
        
        // Dark mode
        'dark:bg-neutral-200 dark:border-neutral-400 dark:placeholder:text-neutral-500',
        
        className
      )}
      {...props}
    />
  )
})
Textarea.displayName = 'Textarea'

export { Input, Label, FormField, Textarea }