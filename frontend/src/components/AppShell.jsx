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
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Zap,
  Bell,
  Palette
} from 'lucide-react'
import clsx from 'clsx'
import { useHealth } from '../contexts/HealthContext'
import { Button } from './ui/button'

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Work Items', href: '/work-items', icon: CheckSquare },
  { name: 'Pipelines', href: '/pipelines', icon: GitBranch },
  { name: 'Pull Requests', href: '/pull-requests', icon: GitPullRequest },
  { name: 'Logs', href: '/logs', icon: FileText },
  { name: 'Settings', href: '/settings', icon: Settings },
  { name: 'Components', href: '/components', icon: Palette },
]

// Dark mode hook
function useDarkMode() {
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('darkMode')
      if (saved) return JSON.parse(saved)
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    return false
  })

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode))
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  return [darkMode, setDarkMode]
}

// Header component  
const Header = ({ onMenuClick, sidebarCollapsed }) => {
  const { isConnected, isChecking, checkConnection } = useHealth()
  const [darkMode, setDarkMode] = useDarkMode()

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-neutral-200 bg-neutral-50/95 backdrop-blur supports-[backdrop-filter]:bg-neutral-50/75 px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8 dark:border-neutral-300 dark:bg-neutral-100/95 dark:supports-[backdrop-filter]:bg-neutral-100/75">
      <Button
        variant="ghost"
        size="sm"
        onClick={onMenuClick}
        className="lg:hidden"
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Open sidebar</span>
      </Button>

      {/* Search */}
      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <div className="relative flex flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-4 w-4 text-neutral-400" />
          </div>
          <input
            className="block w-full rounded-lg border border-neutral-300 bg-neutral-50 py-2 pl-10 pr-3 text-body placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500/20 dark:bg-neutral-200 dark:border-neutral-400"
            placeholder="Search..."
            type="search"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-x-4 lg:gap-x-6">
        {/* Connection Status */}
        <div className="hidden sm:flex sm:items-center sm:gap-x-2">
          <div className={clsx(
            'flex items-center gap-x-2 rounded-full px-3 py-1.5 text-body-sm font-medium',
            isConnected 
              ? 'bg-success-50 text-success-600 dark:bg-success-600/10' 
              : 'bg-error-50 text-error-600 dark:bg-error-600/10'
          )}>
            <div className={clsx(
              'h-2 w-2 rounded-full',
              isConnected ? 'bg-success-500' : 'bg-error-500'
            )} />
            {isChecking ? 'Checking...' : (isConnected ? 'Connected' : 'Disconnected')}
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={checkConnection}
            disabled={isChecking}
          >
            <RefreshCw className={clsx('h-4 w-4', isChecking && 'animate-spin')} />
            <span className="sr-only">Refresh connection</span>
          </Button>
        </div>

        {/* Dark mode toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setDarkMode(!darkMode)}
        >
          {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          <span className="sr-only">Toggle theme</span>
        </Button>

        {/* Notifications */}
        <Button variant="ghost" size="sm">
          <Bell className="h-4 w-4" />
          <span className="sr-only">Notifications</span>
        </Button>
      </div>
    </header>
  )
}

// Sidebar component
const Sidebar = ({ open, onClose, collapsed, onToggleCollapsed }) => {
  const location = useLocation()

  return (
    <>
      {/* Mobile sidebar overlay */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-neutral-900/50 backdrop-blur-sm" onClick={onClose} />
          <div className="fixed inset-y-0 left-0 z-50 w-72 overflow-y-auto bg-neutral-50 px-4 pb-4 shadow-xl ring-1 ring-neutral-900/10 dark:bg-neutral-100 dark:ring-white/10">
            <div className="flex h-16 shrink-0 items-center justify-between">
              <div className="flex items-center gap-x-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-white">
                  <Zap className="h-5 w-5" />
                </div>
                <span className="text-h4 font-semibold text-neutral-900 dark:text-neutral-50">
                  DevOps Agent
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <SidebarNav />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className={clsx(
        'hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:flex-col transition-all duration-300',
        collapsed ? 'lg:w-16' : 'lg:w-72'
      )}>
        <div className="flex flex-col flex-grow overflow-y-auto bg-neutral-50 border-r border-neutral-200 shadow-sm dark:bg-neutral-100 dark:border-neutral-300">
          {/* Logo */}
          <div className={clsx(
            'flex h-16 shrink-0 items-center px-4 border-b border-neutral-200 dark:border-neutral-300',
            collapsed ? 'justify-center' : 'justify-between'
          )}>
            <div className="flex items-center gap-x-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-white shrink-0">
                <Zap className="h-5 w-5" />
              </div>
              {!collapsed && (
                <span className="text-h4 font-semibold text-neutral-900 dark:text-neutral-50">
                  DevOps Agent
                </span>
              )}
            </div>
            {!collapsed && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleCollapsed}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex flex-1 flex-col px-4 pb-4 pt-5">
            <ul className="flex flex-1 flex-col gap-y-2">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href
                return (
                  <li key={item.name}>
                    <Link
                      to={item.href}
                      className={clsx(
                        'group flex gap-x-3 rounded-lg p-3 text-body-sm font-medium transition-all duration-150',
                        isActive
                          ? 'bg-primary-50 text-primary-700 dark:bg-primary-600/10 dark:text-primary-400'
                          : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-200 dark:hover:text-neutral-300',
                        collapsed && 'justify-center'
                      )}
                    >
                      <item.icon
                        className={clsx(
                          'h-5 w-5 shrink-0 transition-colors',
                          isActive
                            ? 'text-primary-600 dark:text-primary-400'
                            : 'text-neutral-400 group-hover:text-neutral-500 dark:group-hover:text-neutral-300'
                        )}
                      />
                      {!collapsed && (
                        <span className="truncate">{item.name}</span>
                      )}
                      {collapsed && (
                        <span className="absolute left-14 rounded bg-neutral-900 px-2 py-1 text-caption text-white opacity-0 transition-opacity group-hover:opacity-100 dark:bg-neutral-800">
                          {item.name}
                        </span>
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* Collapse toggle for desktop */}
          {collapsed && (
            <div className="p-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleCollapsed}
                className="w-full justify-center"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// Main layout component
export default function AppShell({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed')
    return saved ? JSON.parse(saved) : false
  })

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(sidebarCollapsed))
  }, [sidebarCollapsed])

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-100">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={sidebarCollapsed}
        onToggleCollapsed={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <div className={clsx(
        'transition-all duration-300',
        sidebarCollapsed ? 'lg:pl-16' : 'lg:pl-72'
      )}>
        <Header
          onMenuClick={() => setSidebarOpen(true)}
          sidebarCollapsed={sidebarCollapsed}
        />

        <main className="px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  )
}