import React from 'react'
import clsx from 'clsx'
import { Breadcrumb } from './breadcrumb'

const PageHeader = ({ 
  title, 
  description, 
  breadcrumbs, 
  actions,
  children,
  className 
}) => {
  return (
    <div className={clsx('border-b border-neutral-200 pb-6 mb-6 dark:border-neutral-300', className)}>
      {breadcrumbs && (
        <Breadcrumb items={breadcrumbs} className="mb-4" />
      )}
      
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-h2 font-semibold text-neutral-900 dark:text-neutral-50">
            {title}
          </h1>
          {description && (
            <p className="mt-1 text-body-sm text-neutral-600 dark:text-neutral-400">
              {description}
            </p>
          )}
        </div>
        
        {actions && (
          <div className="mt-4 flex md:ml-4 md:mt-0 gap-3">
            {actions}
          </div>
        )}
      </div>
      
      {children}
    </div>
  )
}

export { PageHeader }