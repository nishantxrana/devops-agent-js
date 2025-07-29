import React from 'react'

export default function LoadingSpinner({ size = 'md', text = 'Loading...' }) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  }

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-azure-600 ${sizeClasses[size]}`}></div>
      {text && <p className="mt-4 text-sm text-gray-600">{text}</p>}
    </div>
  )
}
