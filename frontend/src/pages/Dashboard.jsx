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
  Brain,
  Zap,
  Target,
  BarChart3,
  Lightbulb,
  ChevronRight,
  Sparkles
} from 'lucide-react'
import { apiService } from '../api/apiService'
import { useHealth } from '../contexts/HealthContext'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'
import SkeletonCard from '../components/SkeletonCard'

export default function Dashboard() {
  const [initialLoading, setInitialLoading] = useState(true)
  const [loadingStates, setLoadingStates] = useState({
    workItems: true,
    builds: true,
    pullRequests: true,
    logs: true,
    agenticInsights: true
  })
  const [error, setError] = useState(null)
  const [stats, setStats] = useState({
    workItems: { total: 0, active: 0, completed: 0, overdue: 0 },
    builds: { total: 0, succeeded: 0, failed: 0 },
    pullRequests: { total: 0, active: 0, idle: 0 }
  })
  const [recentActivity, setRecentActivity] = useState([])
  const [agenticInsights, setAgenticInsights] = useState(null)
  const [agenticEnabled, setAgenticEnabled] = useState(false)
  const { isConnected, isChecking, healthData, lastCheck } = useHealth()

  useEffect(() => {
    loadDashboardData()
    checkAgenticStatus()
  }, [])

  const checkAgenticStatus = async () => {
    try {
      const response = await apiService.request('/ai/agentic/status')
      setAgenticEnabled(response.agenticEnabled)
      
      if (response.agenticEnabled) {
        loadAgenticInsights()
      }
    } catch (error) {
      console.error('Error checking agentic status:', error)
    }
  }

  const loadAgenticInsights = async () => {
    try {
      setLoadingStates(prev => ({ ...prev, agenticInsights: true }))
      
      // Calculate metrics for proactive insights
      const metrics = {
        buildSuccessRate: stats.builds.total > 0 ? stats.builds.succeeded / stats.builds.total : 1,
        deploymentFrequency: 2, // Mock data - would come from real metrics
        averageLeadTime: 5, // Mock data
        overdueItemsCount: stats.workItems.overdue
      }

      const response = await apiService.request('/ai/agentic/insights', {
        method: 'POST',
        data: { 
          metrics,
          sessionId: 'dashboard_insights'
        }
      })
      
      setAgenticInsights(response.insights)
    } catch (error) {
      console.error('Error loading agentic insights:', error)
    } finally {
      setLoadingStates(prev => ({ ...prev, agenticInsights: false }))
    }
  }

  const loadDashboardData = async () => {
    try {
      setInitialLoading(true)
      setError(null)
      setLoadingStates({
        workItems: true,
        builds: true,
        pullRequests: true,
        logs: true,
        agenticInsights: agenticEnabled
      })

      // Phase 1: Load critical work items data first (fastest)
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
        setInitialLoading(false) // Show UI immediately after first data loads
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

      // Load agentic insights if enabled
      if (agenticEnabled) {
        setTimeout(loadAgenticInsights, 500) // Small delay to let stats update first
      }

    } catch (err) {
      setError('Failed to load dashboard data')
      console.error('Dashboard error:', err)
      setInitialLoading(false)
      setLoadingStates({
        workItems: false,
        builds: false,
        pullRequests: false,
        logs: false,
        agenticInsights: false
      })
    }
  }

  // Only show full loading spinner on initial load with error
  if (initialLoading && error) {
    return <LoadingSpinner />
  }

  if (error && initialLoading) {
    return <ErrorMessage message={error} onRetry={loadDashboardData} />
  }

  const statCards = [
    {
      title: 'Work Items',
      value: stats.workItems.total,
      subtitle: `${stats.workItems.active} active, ${stats.workItems.overdue} overdue`,
      icon: CheckSquare,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Recent Builds',
      value: stats.builds.total,
      subtitle: `${stats.builds.succeeded} succeeded, ${stats.builds.failed} failed`,
      icon: GitBranch,
      color: stats.builds.failed > 0 ? 'text-red-600' : 'text-green-600',
      bgColor: stats.builds.failed > 0 ? 'bg-red-50' : 'bg-green-50'
    },
    {
      title: 'Pull Requests',
      value: stats.pullRequests.total,
      subtitle: `${stats.pullRequests.active} active, ${stats.pullRequests.idle} idle`,
      icon: GitPullRequest,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'System Status',
      value: isChecking ? 'Checking...' : isConnected ? 'Healthy' : 'Unhealthy',
      subtitle: isChecking ? 'Checking connection...' : 
                isConnected ? `Uptime: ${healthData?.uptime ? Math.floor(healthData.uptime / 3600) + 'h' : 'N/A'}` : 
                'Backend disconnected',
      icon: Activity,
      color: isChecking ? 'text-yellow-600' : isConnected ? 'text-green-600' : 'text-red-600',
      bgColor: isChecking ? 'bg-yellow-50' : isConnected ? 'bg-green-50' : 'bg-red-50'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header with Refresh Button */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-gray-600">Overview of your Azure DevOps monitoring</p>
        </div>
        <button
          onClick={loadDashboardData}
          disabled={initialLoading || Object.values(loadingStates).some(loading => loading)}
          className="group inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-600 bg-gradient-to-r from-gray-50 to-gray-100 border-0 rounded-xl hover:from-blue-50 hover:to-indigo-50 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-300"
        >
          <RefreshCw className={`h-4 w-4 transition-all duration-300 ${(initialLoading || Object.values(loadingStates).some(loading => loading)) ? 'animate-spin text-blue-500' : 'group-hover:text-blue-500 group-hover:rotate-180'}`} />
          <span className="font-medium">{(initialLoading || Object.values(loadingStates).some(loading => loading)) ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          const isSystemStatus = stat.title === 'System Status'
          const tooltipText = isSystemStatus && lastCheck 
            ? `Last checked: ${lastCheck.toLocaleTimeString()}`
            : undefined
          
          // Show skeleton for loading states
          const isLoading = (
            (stat.title === 'Work Items' && loadingStates.workItems) ||
            (stat.title === 'Recent Builds' && loadingStates.builds) ||
            (stat.title === 'Pull Requests' && loadingStates.pullRequests) ||
            (stat.title === 'System Status' && false) // System status loads immediately
          )
          
          if (isLoading) {
            return <SkeletonCard key={index} />
          }
            
          return (
            <div 
              key={index} 
              className="card hover:shadow-lg transition-shadow duration-200"
              title={tooltipText}
            >
              <div className="flex items-center">
                <div className={`p-2 rounded-lg ${stat.bgColor} transition-all duration-200 hover:scale-105`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                </div>
              </div>
              <p className="mt-2 text-sm text-gray-500">{stat.subtitle}</p>
              
              {/* Add progress indicator for Work Items */}
              {stat.title === 'Work Items' && stats.workItems.total > 0 && (
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>Completion</span>
                    <span>{Math.round((stats.workItems.completed / stats.workItems.total) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-500" 
                      style={{ width: `${Math.round((stats.workItems.completed / stats.workItems.total) * 100)}%` }}
                    ></div>
                  </div>
                </div>
              )}
              
              {/* Add success rate for Builds */}
              {stat.title === 'Recent Builds' && stats.builds.total > 0 && (
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>Success Rate</span>
                    <span>{Math.round((stats.builds.succeeded / stats.builds.total) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all duration-500" 
                      style={{ width: `${Math.round((stats.builds.succeeded / stats.builds.total) * 100)}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* AI Agent Insights */}
      {agenticEnabled && (
        <div className="card bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-purple-200 dark:border-purple-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-purple-500 to-blue-600 rounded-lg">
                <Brain className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">AI Agent Insights</h3>
                <p className="text-sm text-purple-600 dark:text-purple-300">Proactive recommendations from your intelligent assistant</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
              <span className="text-xs font-medium text-purple-600 dark:text-purple-300">AGENTIC MODE</span>
            </div>
          </div>
          
          <div className="space-y-4">
            {loadingStates.agenticInsights ? (
              <div className="flex items-center gap-3 p-4 bg-white/50 dark:bg-gray-800/50 rounded-xl">
                <Sparkles className="h-5 w-5 text-purple-500 animate-spin" />
                <div className="flex-1">
                  <div className="h-4 bg-purple-200 dark:bg-purple-700 rounded w-3/4 mb-2 animate-pulse"></div>
                  <div className="h-3 bg-purple-100 dark:bg-purple-800 rounded w-1/2 animate-pulse"></div>
                </div>
              </div>
            ) : agenticInsights ? (
              <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl p-4 border border-purple-100 dark:border-purple-800">
                <div className="flex items-start gap-3">
                  <Lightbulb className="h-5 w-5 text-purple-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
                      {agenticInsights}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <Brain className="h-8 w-8 text-purple-300 mx-auto mb-2" />
                <p className="text-sm text-purple-600 dark:text-purple-300">
                  AI insights will appear here based on your team's performance metrics
                </p>
              </div>
            )}
            
            {/* Action items from AI */}
            {agenticInsights && (
              <div className="flex items-center justify-between pt-3 border-t border-purple-100 dark:border-purple-800">
                <span className="text-xs text-purple-600 dark:text-purple-300 font-medium">
                  💡 Want more detailed analysis? Ask the AI agent about specific areas
                </span>
                <ChevronRight className="h-4 w-4 text-purple-400" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Agentic Mode Activation Banner */}
      {!agenticEnabled && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex-shrink-0">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Unlock Intelligent DevOps Insights
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                Enable agentic mode to get proactive recommendations, context-aware analysis, and intelligent automation 
                suggestions powered by advanced AI reasoning.
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-full">
                  <Target className="h-3 w-3" /> Smart Analysis
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-medium rounded-full">
                  <BarChart3 className="h-3 w-3" /> Proactive Insights
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-medium rounded-full">
                  <Brain className="h-3 w-3" /> Memory & Context
                </span>
              </div>
              <button 
                onClick={checkAgenticStatus}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white text-sm font-medium rounded-lg transition-all duration-200 transform hover:scale-105"
              >
                <Brain className="h-4 w-4" />
                Enable Agentic Mode
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Alerts */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Active Alerts</h3>
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
          </div>
          <div className="space-y-3">
            {(loadingStates.workItems || loadingStates.builds || loadingStates.pullRequests) ? (
              // Show skeleton loading for alerts
              Array.from({ length: 2 }).map((_, index) => (
                <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg animate-pulse">
                  <div className="h-5 w-5 bg-gray-300 rounded mr-3"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-300 rounded w-3/4 mb-1"></div>
                    <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                  </div>
                </div>
              ))
            ) : (
              <>
                {stats.workItems.overdue > 0 && (
                  <div className="flex items-center p-3 bg-red-50 rounded-lg">
                    <Clock className="h-5 w-5 text-red-500 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-red-800">
                        {stats.workItems.overdue} overdue work items
                      </p>
                      <p className="text-xs text-red-600">Require immediate attention</p>
                    </div>
                  </div>
                )}
                {stats.builds.failed > 0 && (
                  <div className="flex items-center p-3 bg-red-50 rounded-lg">
                    <GitBranch className="h-5 w-5 text-red-500 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-red-800">
                        {stats.builds.failed} failed builds
                      </p>
                      <p className="text-xs text-red-600">Check build logs for details</p>
                    </div>
                  </div>
                )}
                {stats.pullRequests.idle > 0 && (
                  <div className="flex items-center p-3 bg-yellow-50 rounded-lg">
                    <GitPullRequest className="h-5 w-5 text-yellow-500 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800">
                        {stats.pullRequests.idle} idle pull requests
                      </p>
                      <p className="text-xs text-yellow-600">No activity for 48+ hours</p>
                    </div>
                  </div>
                )}
                {stats.workItems.overdue === 0 && stats.builds.failed === 0 && stats.pullRequests.idle === 0 && (
                  <div className="flex items-center p-3 bg-green-50 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-green-500 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-green-800">All systems healthy</p>
                      <p className="text-xs text-green-600">No active alerts</p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
            <Activity className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {loadingStates.logs ? (
              // Show skeleton loading for recent activity
              Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="flex items-start space-x-3 animate-pulse">
                  <div className="flex-shrink-0">
                    <div className="w-2 h-2 bg-gray-300 rounded-full mt-2"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="h-4 bg-gray-300 rounded w-3/4 mb-1"></div>
                    <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                  </div>
                </div>
              ))
            ) : recentActivity.length > 0 ? (
              recentActivity.slice(0, 5).map((activity, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-2 h-2 bg-azure-500 rounded-full mt-2"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 truncate">{activity.message}</p>
                    <p className="text-xs text-gray-500">{activity.timestamp}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4">
                <Users className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No recent activity</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
