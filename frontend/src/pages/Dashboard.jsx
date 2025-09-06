import React, { useState, useEffect } from 'react'
import { 
  CheckSquare, 
  GitBranch, 
  GitPullRequest, 
  AlertTriangle,
  TrendingUp,
  Clock,
  Users,
  Activity,
  RefreshCw,
  Zap,
  BarChart3,
  ExternalLink
} from 'lucide-react'
import { apiService } from '../api/apiService'
import { useHealth } from '../contexts/HealthContext'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { cn } from '@/lib/utils'

function StatCard({ title, value, subtitle, icon: Icon, isLoading, progress, trend }) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-4 rounded" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-16 mb-2" />
          <Skeleton className="h-4 w-32" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">
          {subtitle}
        </p>
        {progress !== undefined && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>{title === 'Work Items' ? 'Completion' : 'Success Rate'}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}
        {trend && (
          <div className={cn(
            "flex items-center gap-1 text-xs mt-2",
            trend > 0 ? "text-green-600" : trend < 0 ? "text-red-600" : "text-muted-foreground"
          )}>
            <TrendingUp className={cn("h-3 w-3", trend < 0 && "rotate-180")} />
            <span>{Math.abs(trend)}% from last week</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function AlertCard({ type, count, message, description }) {
  const icons = {
    overdue: Clock,
    failed: GitBranch,
    idle: GitPullRequest,
    healthy: TrendingUp
  }
  
  const variants = {
    overdue: "destructive",
    failed: "destructive", 
    idle: "default",
    healthy: "default"
  }

  const Icon = icons[type]

  return (
    <Alert variant={variants[type]} className="border-l-4">
      <Icon className="h-4 w-4" />
      <AlertTitle className="text-sm font-medium">
        {count !== undefined ? `${count} ${message}` : message}
      </AlertTitle>
      <AlertDescription className="text-xs">
        {description}
      </AlertDescription>
    </Alert>
  )
}

function ActivityItem({ activity, index }) {
  return (
    <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex-shrink-0 mt-1">
        <div className="w-2 h-2 bg-primary rounded-full" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-snug">{activity.message}</p>
        <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [initialLoading, setInitialLoading] = useState(true)
  const [loadingStates, setLoadingStates] = useState({
    workItems: true,
    builds: true,
    pullRequests: true,
    logs: true
  })
  const [error, setError] = useState(null)
  const [stats, setStats] = useState({
    workItems: { total: 0, active: 0, completed: 0, overdue: 0 },
    builds: { total: 0, succeeded: 0, failed: 0 },
    pullRequests: { total: 0, active: 0, idle: 0 }
  })
  const [recentActivity, setRecentActivity] = useState([])
  const { isConnected, isChecking, healthData } = useHealth()
  const { toast } = useToast()

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setInitialLoading(true)
      setError(null)
      setLoadingStates({
        workItems: true,
        builds: true,
        pullRequests: true,
        logs: true
      })

      // Phase 1: Load critical work items data first
      try {
        const workItems = await apiService.getCurrentSprintSummary()
        setStats(prev => ({
          ...prev,
          workItems: {
            total: workItems.total || 0,
            active: workItems.active || 0,
            completed: workItems.completed || 0,
            overdue: workItems.overdue || 0
          }
        }))
        setLoadingStates(prev => ({ ...prev, workItems: false }))
        setInitialLoading(false)
      } catch (err) {
        console.error('Failed to load work items:', err)
        setLoadingStates(prev => ({ ...prev, workItems: false }))
      }

      // Phase 2: Load remaining data in parallel
      const [builds, pullRequests, logs] = await Promise.allSettled([
        apiService.getRecentBuilds(),
        apiService.getPullRequests(),
        apiService.getLogs({ limit: 10 })
      ])

      // Process builds data
      if (builds.status === 'fulfilled') {
        const buildsData = builds.value
        setStats(prev => ({
          ...prev,
          builds: {
            total: buildsData.count || 0,
            succeeded: buildsData.value?.filter(b => b.result === 'succeeded').length || 0,
            failed: buildsData.value?.filter(b => b.result === 'failed').length || 0
          }
        }))
      }
      setLoadingStates(prev => ({ ...prev, builds: false }))

      // Process pull requests data
      if (pullRequests.status === 'fulfilled') {
        const prData = pullRequests.value
        setStats(prev => ({
          ...prev,
          pullRequests: {
            total: prData.count || 0,
            active: prData.value?.filter(pr => pr.status === 'active').length || 0,
            idle: prData.idle || 0
          }
        }))
      }
      setLoadingStates(prev => ({ ...prev, pullRequests: false }))

      // Process recent activity
      if (logs.status === 'fulfilled') {
        setRecentActivity(logs.value.logs || [])
      }
      setLoadingStates(prev => ({ ...prev, logs: false }))

      // Show success toast
      if (!initialLoading) {
        toast({
          title: "Dashboard refreshed",
          description: "All data has been updated successfully.",
        })
      }

    } catch (err) {
      setError('Failed to load dashboard data')
      console.error('Dashboard error:', err)
      setInitialLoading(false)
      setLoadingStates({
        workItems: false,
        builds: false,
        pullRequests: false,
        logs: false
      })
      
      toast({
        title: "Error loading dashboard",
        description: "Failed to load dashboard data. Please try again.",
        variant: "destructive",
      })
    }
  }

  const isRefreshing = Object.values(loadingStates).some(loading => loading)

  // Calculate progress percentages
  const workItemsProgress = stats.workItems.total > 0 
    ? (stats.workItems.completed / stats.workItems.total) * 100 
    : 0
    
  const buildsSuccessRate = stats.builds.total > 0 
    ? (stats.builds.succeeded / stats.builds.total) * 100 
    : 0

  const systemHealthStatus = isChecking ? 'Checking...' : isConnected ? 'Healthy' : 'Unhealthy'
  const systemHealthDescription = isChecking 
    ? 'Checking connection...' 
    : isConnected 
      ? `Uptime: ${healthData?.uptime ? Math.floor(healthData.uptime / 3600) + 'h' : 'N/A'}`
      : 'Backend disconnected'

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your Azure DevOps monitoring
          </p>
        </div>
        <Button 
          onClick={loadDashboardData}
          disabled={isRefreshing}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Work Items"
          value={stats.workItems.total}
          subtitle={`${stats.workItems.active} active, ${stats.workItems.overdue} overdue`}
          icon={CheckSquare}
          isLoading={loadingStates.workItems}
          progress={workItemsProgress}
        />
        <StatCard
          title="Recent Builds"
          value={stats.builds.total}
          subtitle={`${stats.builds.succeeded} succeeded, ${stats.builds.failed} failed`}
          icon={GitBranch}
          isLoading={loadingStates.builds}
          progress={buildsSuccessRate}
        />
        <StatCard
          title="Pull Requests"
          value={stats.pullRequests.total}
          subtitle={`${stats.pullRequests.active} active, ${stats.pullRequests.idle} idle`}
          icon={GitPullRequest}
          isLoading={loadingStates.pullRequests}
        />
        <StatCard
          title="System Status"
          value={systemHealthStatus}
          subtitle={systemHealthDescription}
          icon={Activity}
          isLoading={false}
        />
      </div>

      {/* Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Active Alerts */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Active Alerts</CardTitle>
                <CardDescription>
                  System notifications and warnings
                </CardDescription>
              </div>
              <AlertTriangle className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {isRefreshing ? (
              <div className="space-y-3">
                {Array.from({ length: 2 }).map((_, index) => (
                  <div key={index} className="p-3 border rounded-lg">
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ))}
              </div>
            ) : (
              <>
                {stats.workItems.overdue > 0 && (
                  <AlertCard
                    type="overdue"
                    count={stats.workItems.overdue}
                    message="overdue work items"
                    description="Require immediate attention"
                  />
                )}
                {stats.builds.failed > 0 && (
                  <AlertCard
                    type="failed"
                    count={stats.builds.failed}
                    message="failed builds"
                    description="Check build logs for details"
                  />
                )}
                {stats.pullRequests.idle > 0 && (
                  <AlertCard
                    type="idle"
                    count={stats.pullRequests.idle}
                    message="idle pull requests"
                    description="No activity for 48+ hours"
                  />
                )}
                {stats.workItems.overdue === 0 && stats.builds.failed === 0 && stats.pullRequests.idle === 0 && (
                  <AlertCard
                    type="healthy"
                    message="All systems healthy"
                    description="No active alerts"
                  />
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Recent Activity</CardTitle>
                <CardDescription>
                  Latest system events and updates
                </CardDescription>
              </div>
              <Activity className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            {loadingStates.logs ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3">
                    <Skeleton className="w-2 h-2 rounded-full mt-2" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-3/4 mb-1" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentActivity.length > 0 ? (
              <div className="space-y-1">
                {recentActivity.slice(0, 5).map((activity, index) => (
                  <ActivityItem key={index} activity={activity} index={index} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-sm text-muted-foreground font-medium">No recent activity</p>
                <p className="text-xs text-muted-foreground">
                  Activity will appear here when events occur
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}