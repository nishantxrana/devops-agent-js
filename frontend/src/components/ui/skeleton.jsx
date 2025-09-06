import React from 'react'
import clsx from 'clsx'

const Skeleton = ({ className, ...props }) => {
  return (
    <div
      className={clsx(
        'animate-pulse rounded-lg bg-neutral-200/70 dark:bg-neutral-400/20',
        className
      )}
      {...props}
    />
  )
}

const SkeletonCard = ({ className }) => {
  return (
    <div className={clsx('p-6 space-y-4', className)}>
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-4/5" />
    </div>
  )
}

const SkeletonTable = ({ rows = 5, className }) => {
  return (
    <div className={clsx('space-y-3', className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4">
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  )
}

export { Skeleton, SkeletonCard, SkeletonTable }