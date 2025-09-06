import React from 'react'
import { AlertTriangle, FileX, Search, RefreshCw } from 'lucide-react'
import { Button } from './button'

const EmptyState = ({ 
  icon: Icon = FileX, 
  title, 
  description, 
  action, 
  actionLabel,
  variant = 'default' 
}) => {
  const iconColors = {
    default: 'text-neutral-400',
    error: 'text-error-500',
    search: 'text-neutral-400'
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <div className={`mb-4 p-3 rounded-xl bg-neutral-100 dark:bg-neutral-200 ${iconColors[variant]}`}>
        <Icon className="h-8 w-8" />
      </div>
      
      <h3 className="text-h4 font-medium text-neutral-900 dark:text-neutral-50 mb-2">
        {title}
      </h3>
      
      {description && (
        <p className="text-body-sm text-neutral-600 dark:text-neutral-400 max-w-md mb-6">
          {description}
        </p>
      )}
      
      {action && actionLabel && (
        <Button onClick={action} variant="outline" className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          {actionLabel}
        </Button>
      )}
    </div>
  )
}

const ErrorState = ({ message, onRetry }) => {
  return (
    <EmptyState
      icon={AlertTriangle}
      variant="error"
      title="Something went wrong"
      description={message}
      action={onRetry}
      actionLabel="Try Again"
    />
  )
}

const SearchEmptyState = ({ query, onClear }) => {
  return (
    <EmptyState
      icon={Search}
      variant="search"
      title="No results found"
      description={`No items match "${query}". Try adjusting your search terms.`}
      action={onClear}
      actionLabel="Clear filters"
    />
  )
}

export { EmptyState, ErrorState, SearchEmptyState }