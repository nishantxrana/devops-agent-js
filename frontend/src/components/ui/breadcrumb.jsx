import React from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'
import clsx from 'clsx'

const Breadcrumb = ({ items, className }) => {
  return (
    <nav className={clsx('flex', className)} aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-1 md:space-x-2">
        <li className="inline-flex items-center">
          <Link
            to="/"
            className="inline-flex items-center text-body-sm font-medium text-neutral-500 hover:text-primary-600 dark:text-neutral-400 dark:hover:text-primary-400 transition-colors"
          >
            <Home className="h-4 w-4 mr-1" />
            Home
          </Link>
        </li>
        {items?.map((item, index) => (
          <li key={item.href || index}>
            <div className="flex items-center">
              <ChevronRight className="h-4 w-4 text-neutral-400 mx-1" />
              {item.href ? (
                <Link
                  to={item.href}
                  className="text-body-sm font-medium text-neutral-500 hover:text-primary-600 dark:text-neutral-400 dark:hover:text-primary-400 transition-colors"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="text-body-sm font-medium text-neutral-900 dark:text-neutral-50">
                  {item.label}
                </span>
              )}
            </div>
          </li>
        ))}
      </ol>
    </nav>
  )
}

export { Breadcrumb }