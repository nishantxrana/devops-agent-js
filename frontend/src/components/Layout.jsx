import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  Home, 
  CheckSquare, 
  GitBranch, 
  GitPullRequest, 
  FileText, 
  Settings,
  Menu,
  X,
  Zap,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Moon,
  Sun,
  Brain
} from 'lucide-react'
import clsx from 'clsx'
import { useHealth } from '../contexts/HealthContext'

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Work Items', href: '/work-items', icon: CheckSquare },
  { name: 'Pipelines', href: '/pipelines', icon: GitBranch },
  { name: 'Pull Requests', href: '/pull-requests', icon: GitPullRequest },
  { name: 'Logs', href: '/logs', icon: FileText },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed')
    return saved ? JSON.parse(saved) : false
  })
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode')
    return saved ? JSON.parse(saved) : false
  })
  const { isConnected, isChecking, checkConnection } = useHealth()
  const location = useLocation()

  // Apply dark mode class to document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('darkMode', JSON.stringify(darkMode))
  }, [darkMode])

  // Save sidebar state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(sidebarCollapsed))
  }, [sidebarCollapsed])

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Mobile sidebar */}
      <div className={clsx(
        'fixed inset-0 z-50 lg:hidden',
        sidebarOpen ? 'block' : 'hidden'
      )}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white dark:bg-gray-800 shadow-xl">
          <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Brain className="h-5 w-5 text-white" />
              </div>
              <span className="ml-2 text-lg font-bold text-gray-900 dark:text-white">DevOps Agent</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={clsx(
                    'group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200',
                    isActive
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                  )}
                >
                  <Icon
                    className={clsx(
                      'mr-3 h-5 w-5 transition-all duration-200',
                      isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-500 dark:text-gray-400 dark:group-hover:text-gray-300'
                    )}
                  />
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className={clsx(
        'hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col transition-all duration-300 ease-in-out z-30',
        sidebarCollapsed ? 'lg:w-16' : 'lg:w-64'
      )}>
        <div className="flex flex-col flex-grow bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-lg">
          <div className={clsx(
            'flex h-16 items-center transition-all duration-300 border-b border-gray-200 dark:border-gray-700',
            sidebarCollapsed ? 'justify-center px-2' : 'px-4'
          )}>
            <div className="h-8 w-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Brain className="h-5 w-5 text-white" />
            </div>
            {!sidebarCollapsed && (
              <span className="ml-3 text-lg font-bold text-gray-900 dark:text-white whitespace-nowrap overflow-hidden">
                DevOps Agent
              </span>
            )}
          </div>

          <nav className={clsx(
            'flex-1 space-y-2 py-4 transition-all duration-300',
            sidebarCollapsed ? 'px-2' : 'px-3'
          )}>
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.href
              return (
                <div key={item.name} className="relative group">
                  <Link
                    to={item.href}
                    className={clsx(
                      'flex items-center text-sm font-medium rounded-xl transition-all duration-200 relative',
                      sidebarCollapsed ? 'px-2 py-3 justify-center' : 'px-3 py-3',
                      isActive
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg transform scale-105'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white hover:scale-105'
                    )}
                  >
                    <Icon
                      className={clsx(
                        'h-5 w-5 flex-shrink-0 transition-all duration-200',
                        sidebarCollapsed ? 'mr-0' : 'mr-3',
                        isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-500 dark:text-gray-400 dark:group-hover:text-gray-300'
                      )}
                    />
                    {!sidebarCollapsed && (
                      <span className="whitespace-nowrap overflow-hidden">{item.name}</span>
                    )}
                  </Link>
                  
                  {/* Tooltip for collapsed state */}
                  {sidebarCollapsed && (
                    <div className="absolute left-full ml-3 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-sm rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50 top-1/2 transform -translate-y-1/2 shadow-lg">
                      {item.name}
                      <div className="absolute right-full top-1/2 transform -translate-y-1/2 border-4 border-transparent border-r-gray-900 dark:border-r-gray-700"></div>
                    </div>
                  )}
                </div>
              )
            })}
          </nav>

          {/* Toggle controls at bottom */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-2">
            {!sidebarCollapsed && (
              <button
                onClick={toggleDarkMode}
                className="w-full flex items-center justify-center p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 mb-2"
                title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                <span className="ml-2 text-sm">
                  {darkMode ? 'Light Mode' : 'Dark Mode'}
                </span>
              </button>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className={clsx(
                'w-full flex items-center cursor-pointer transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded-lg',
                sidebarCollapsed ? 'justify-center' : 'justify-center'
              )}
              title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {sidebarCollapsed ? (
                <ChevronRight className="h-4 w-4 text-gray-400" />
              ) : (
                <ChevronLeft className="h-4 w-4 text-gray-400" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className={clsx(
        'transition-all duration-300 ease-in-out',
        sidebarCollapsed ? 'lg:pl-16' : 'lg:pl-64'
      )}>
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 dark:text-gray-300 lg:hidden hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1 items-center">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                {navigation.find(item => item.href === location.pathname)?.name || 'Dashboard'}
              </h1>
            </div>
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              {/* Dark mode toggle for mobile/tablet */}
              <button
                onClick={toggleDarkMode}
                className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
                title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
              
              <div className="flex items-center space-x-3 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm rounded-full px-4 py-2 border border-gray-200 dark:border-gray-600">
                <div className={clsx(
                  'w-2 h-2 rounded-full transition-all duration-300',
                  isChecking ? 'bg-yellow-400 animate-pulse' : isConnected ? 'bg-green-400' : 'bg-red-400'
                )}></div>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  {isChecking ? 'Checking...' : isConnected ? 'Connected' : 'Disconnected'}
                </span>
                <button
                  onClick={checkConnection}
                  disabled={isChecking}
                  className={clsx(
                    'p-1 rounded-md text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100 transition-colors',
                    isChecking && 'animate-spin'
                  )}
                  title="Refresh connection status"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-8">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
