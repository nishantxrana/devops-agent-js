import React from 'react'
import { Brain, Sparkles } from 'lucide-react'

export default function LoadingSpinner({ size = 'md', text = 'Loading...', agentic = false }) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  }

  if (agentic) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-600 rounded-full animate-pulse opacity-20"></div>
          <div className={`relative bg-gradient-to-r from-purple-500 to-blue-600 text-white rounded-full flex items-center justify-center ${sizeClasses[size]} animate-bounce`}>
            <Brain className="h-5 w-5" />
          </div>
          <Sparkles className="absolute -top-1 -right-1 h-3 w-3 text-purple-400 animate-spin" />
        </div>
        {text && (
          <p className="mt-4 text-sm bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent font-medium">
            {text}
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className={`animate-spin rounded-full border-2 border-gray-300 dark:border-gray-600 border-t-blue-600 dark:border-t-blue-400 ${sizeClasses[size]}`}></div>
      {text && <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">{text}</p>}
    </div>
  )
}
