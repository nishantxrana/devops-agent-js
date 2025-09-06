import React, { useState, useEffect } from 'react'
import { 
  CheckSquare, 
  GitBranch, 
  GitPullRequest, 
  AlertTriangle,
  TrendingUp,
  Clock,
  Activity,
  RefreshCw,
  Zap,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { apiService } from '../api/apiService'
import { useHealth } from '../contexts/HealthContext'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { PageHeader } from '../components/ui/page-header'
import { Skeleton, SkeletonCard } from '../components/ui/skeleton'
import { EmptyState, ErrorState } from '../components/ui/empty-state'

// Metric Card Component
const MetricCard = ({ title, value, subtext, icon: Icon, color = 'primary', loading = false }) => {
  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-12 w-12 rounded-xl" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-12" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const colorClasses = {
    primary: 'bg-primary-100 text-primary-600 dark:bg-primary-600/10 dark:text-primary-400',
    success: 'bg-success-50 text-success-600 dark:bg-success-600/10 dark:text-success-500',
    warning: 'bg-warning-50 text-warning-600 dark:bg-warning-600/10 dark:text-warning-500',
    info: 'bg-info-50 text-info-600 dark:bg-info-600/10 dark:text-info-500'
  }

  return (
    <Card className="transition-all duration-200 hover:shadow-md">
      <CardContent className="p-6">
        <div className="flex items-center space-x-4">
          <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
            <Icon className="h-6 w-6" />
          </div>
          <div className="flex-1 space-y-1">
            <p className="text-body-sm font-medium text-neutral-600 dark:text-neutral-400">
              {title}
            </p>
            <p className="text-h2 font-bold text-neutral-900 dark:text-neutral-50">
              {value}
            </p>
            <p className="text-caption text-neutral-500 dark:text-neutral-400">
              {subtext}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Activity Item Component
const ActivityItem = ({ title, timestamp, type = 'info' }) => {
  const typeColors = {
    info: 'bg-info-500',
    success: 'bg-success-500',
    warning: 'bg-warning-500',
    error: 'bg-error-500'
  }

  return (
    <div className="flex items-start space-x-3 py-3 first:pt-0 last:pb-0">
      <div className={`mt-1 h-2 w-2 rounded-full ${typeColors[type]} shrink-0`} />
      <div className="flex-1 min-w-0">
        <p className="text-body-sm font-medium text-neutral-900 dark:text-neutral-50">
          {title}
        </p>
        <p className="text-caption text-neutral-500 dark:text-neutral-400">
          {new Date(timestamp).toLocaleString()}
        </p>
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
  const { isConnected, isChecking, healthData, lastCheck } = useHealth()

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

      const [workItemsResponse, buildsResponse, pullRequestsResponse, logsResponse] = await Promise.allSettled([
        apiService.getWorkItems(),
        apiService.getBuilds(),
        apiService.getPullRequests(),
        apiService.getLogs()
      ])

      // Process work items
      if (workItemsResponse.status === 'fulfilled') {
        const workItems = workItemsResponse.value?.value || []
        setStats(prev => ({
          ...prev,
          workItems: {
            total: workItems.length,
            active: workItems.filter(item => !['Closed', 'Done'].includes(item.fields?.['System.State'])).length,
            completed: workItems.filter(item => ['Closed', 'Done'].includes(item.fields?.['System.State'])).length,
            overdue: 0 // Would need to calculate based on dates
          }
        }))
      }

      // Process builds
      if (buildsResponse.status === 'fulfilled') {
        const builds = buildsResponse.value?.value || []
        setStats(prev => ({
          ...prev,
          builds: {
            total: builds.length,
            succeeded: builds.filter(build => build.result === 'succeeded').length,
            failed: builds.filter(build => build.result === 'failed').length
          }
        }))
      }

      // Process pull requests
      if (pullRequestsResponse.status === 'fulfilled') {
        const prs = pullRequestsResponse.value?.value || []
        setStats(prev => ({
          ...prev,
          pullRequests: {
            total: prs.length,
            active: prs.filter(pr => pr.status === 'active').length,
            idle: prs.filter(pr => pr.status !== 'active').length
          }
        }))
      }

      // Process logs for recent activity
      if (logsResponse.status === 'fulfilled') {
        const logs = logsResponse.value || []
        setRecentActivity(logs.slice(0, 5).map(log => ({
          title: log.message || 'System event',
          timestamp: log.timestamp || new Date().toISOString(),
          type: log.level === 'error' ? 'error' : log.level === 'warn' ? 'warning' : 'info'
        })))
      }

      setLoadingStates({
        workItems: false,
        builds: false,
        pullRequests: false,
        logs: false
      })

    } catch (err) {
      console.error('Error loading dashboard data:', err)
      setError(err.message)
    } finally {
      setInitialLoading(false)
    }
  }

  const handleRefresh = () => {
    loadDashboardData()
  }

  if (error && initialLoading) {
    return <ErrorState message={error} onRetry={handleRefresh} />
  }

  const anyLoading = Object.values(loadingStates).some(loading => loading)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Overview of your Azure DevOps monitoring"
        actions={[
          <Button
            key="refresh"
            onClick={handleRefresh}
            disabled={anyLoading}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${anyLoading ? 'animate-spin' : ''}`} />
            {anyLoading ? 'Refreshing...' : 'Refresh'}
          </Button>
        ]}
      />

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Work Items"
          value={stats.workItems.total}
          subtext={`${stats.workItems.active} active, ${stats.workItems.overdue} overdue`}
          icon={CheckSquare}
          color="primary"
          loading={loadingStates.workItems}
        />
        <MetricCard
          title="Recent Builds"
          value={stats.builds.total}
          subtext={`${stats.builds.succeeded} succeeded, ${stats.builds.failed} failed`}
          icon={GitBranch}
          color="success"
          loading={loadingStates.builds}
        />
        <MetricCard
          title="Pull Requests"
          value={stats.pullRequests.total}
          subtext={`${stats.pullRequests.active} active, ${stats.pullRequests.idle} idle`}
          icon={GitPullRequest}
          color="info"
          loading={loadingStates.pullRequests}
        />
        <MetricCard
          title="System Status"
          value={isConnected ? "Healthy" : "Offline"}
          subtext={lastCheck ? `Uptime: 0h` : 'Checking...'}
          icon={isConnected ? CheckCircle : XCircle}
          color={isConnected ? "success" : "warning"}
          loading={isChecking}
        />
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Active Alerts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning-600" />
              Active Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingStates.logs ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ) : (
              <div className="flex items-center space-x-3 py-4">
                <div className="p-2 bg-success-50 text-success-600 rounded-lg dark:bg-success-600/10">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-body-sm font-medium text-neutral-900 dark:text-neutral-50">
                    All systems healthy
                  </p>
                  <p className="text-caption text-neutral-500 dark:text-neutral-400">
                    No active alerts
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary-600" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingStates.logs ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-start space-x-3">
                    <Skeleton className="mt-1 h-2 w-2 rounded-full" />
                    <div className="space-y-1 flex-1">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentActivity.length > 0 ? (
              <div className="space-y-1">
                {recentActivity.map((activity, index) => (
                  <ActivityItem
                    key={index}
                    title={activity.title}
                    timestamp={activity.timestamp}
                    type={activity.type}
                  />
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <Activity className="h-12 w-12 mx-auto text-neutral-400 mb-4" />
                <p className="text-body-sm text-neutral-500 dark:text-neutral-400">
                  No recent activity
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}