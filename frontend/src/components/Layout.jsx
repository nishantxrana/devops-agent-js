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
  Search,
  Bell,
  User
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useHealth } from '../contexts/HealthContext'
import { ThemeProvider, useTheme } from '../contexts/ThemeContext'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Work Items', href: '/work-items', icon: CheckSquare },
  { name: 'Pipelines', href: '/pipelines', icon: GitBranch },
  { name: 'Pull Requests', href: '/pull-requests', icon: GitPullRequest },
  { name: 'Logs', href: '/logs', icon: FileText },
  { name: 'Settings', href: '/settings', icon: Settings },
]

function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="w-9 px-0">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme('light')}>
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')}>
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('system')}>
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function HealthStatus() {
  const { isConnected, isChecking } = useHealth()
  
  return (
    <div className="flex items-center space-x-2">
      <div className={cn(
        "h-2 w-2 rounded-full",
        isConnected ? "bg-green-500" : "bg-red-500"
      )} />
      <span className="text-sm text-muted-foreground">
        {isChecking ? 'Checking...' : isConnected ? 'Connected' : 'Disconnected'}
      </span>
    </div>
  )
}

function SidebarNav({ className, isCollapsed, onNavigate, ...props }) {
  const location = useLocation()

  return (
    <nav className={cn("flex flex-col space-y-1", className)} {...props}>
      {navigation.map((item) => {
        const Icon = item.icon
        const isActive = location.pathname === item.href
        
        return (
          <TooltipProvider key={item.name}>
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Button
                  asChild
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start h-10",
                    isCollapsed && "justify-center px-2",
                    isActive && "bg-accent text-accent-foreground"
                  )}
                  onClick={onNavigate}
                >
                  <Link to={item.href}>
                    <Icon className={cn("h-4 w-4", !isCollapsed && "mr-3")} />
                    {!isCollapsed && <span>{item.name}</span>}
                  </Link>
                </Button>
              </TooltipTrigger>
              {isCollapsed && (
                <TooltipContent side="right" className="font-medium">
                  {item.name}
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        )
      })}
    </nav>
  )
}

function LayoutContent({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    // Initialize from localStorage, default to false if not found
    const saved = localStorage.getItem('sidebarCollapsed')
    return saved ? JSON.parse(saved) : false
  })
  const location = useLocation()

  // Save sidebar state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(sidebarCollapsed))
  }, [sidebarCollapsed])

  useEffect(() => {
    setSidebarOpen(false)
  }, [location])

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className={cn(
        "flex h-16 items-center border-b px-4",
        sidebarCollapsed && "px-2 justify-center"
      )}>
        <img src="/icon.svg" alt="DevOps Agent" className="h-8 w-8 flex-shrink-0" />
        {!sidebarCollapsed && (
          <span className="ml-3 text-xl font-semibold">DevOps Agent</span>
        )}
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-auto py-4 px-3">
        <SidebarNav 
          isCollapsed={sidebarCollapsed} 
          onNavigate={() => setSidebarOpen(false)}
        />
      </div>

      {/* Health Status */}
      {!sidebarCollapsed && (
        <>
          <Separator />
          <div className="p-4">
            <HealthStatus />
          </div>
        </>
      )}

      {/* Collapse Toggle */}
      <div className="hidden lg:block border-t">
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "w-full h-12 justify-center",
            !sidebarCollapsed && "justify-end"
          )}
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-72 p-0">
          {sidebarContent}
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar */}
      <div className={cn(
        "hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col lg:border-r lg:bg-card lg:transition-all lg:duration-300",
        sidebarCollapsed ? "lg:w-16" : "lg:w-72"
      )}>
        {sidebarContent}
      </div>

      {/* Main content */}
      <div className={cn(
        "flex flex-col lg:transition-all lg:duration-300",
        sidebarCollapsed ? "lg:pl-16" : "lg:pl-72"
      )}>
        {/* Top bar */}
        <header className="sticky top-0 z-40 flex h-16 items-center border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex w-full items-center justify-between px-4 lg:px-6">
            <div className="flex items-center space-x-4">
              <Sheet>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="lg:hidden"
                    onClick={() => setSidebarOpen(true)}
                  >
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle navigation menu</span>
                  </Button>
                </SheetTrigger>
              </Sheet>
            </div>

            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" className="w-9 px-0">
                <Search className="h-4 w-4" />
                <span className="sr-only">Search</span>
              </Button>
              <Button variant="ghost" size="sm" className="w-9 px-0">
                <Bell className="h-4 w-4" />
                <span className="sr-only">Notifications</span>
              </Button>
              <ThemeToggle />
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1">
          <div className="container mx-auto py-6 px-4 lg:px-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

export default function Layout({ children }) {
  return (
    <TooltipProvider>
      <ThemeProvider defaultTheme="system" storageKey="devops-agent-theme">
        <LayoutContent>{children}</LayoutContent>
      </ThemeProvider>
    </TooltipProvider>
  )
}