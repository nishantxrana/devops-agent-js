import React, { useState, useEffect } from 'react'
import { Search, Filter, Download, RefreshCw, Brain, Activity, History, Settings } from 'lucide-react'
import { apiService } from '../api/apiService'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'
import { format } from 'date-fns'

export default function Logs() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('logs')
  const [autoRefresh, setAutoRefresh] = useState(false)
  
  // Logs state
  const [logs, setLogs] = useState([])
  const [filteredLogs, setFilteredLogs] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [levelFilter, setLevelFilter] = useState('all')
  
  // Agent state
  const [agentStatus, setAgentStatus] = useState(null)
  const [agentReasoning, setAgentReasoning] = useState([])
  const [taskHistory, setTaskHistory] = useState([])
  const [agentLoading, setAgentLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [activeTab])

  useEffect(() => {
    let interval
    if (autoRefresh) {
      interval = setInterval(loadData, 5000) // Refresh every 5 seconds
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [autoRefresh, activeTab])

  useEffect(() => {
    filterLogs()
  }, [logs, searchTerm, levelFilter])

  const loadData = async () => {
    if (activeTab === 'logs') {
      await loadLogs()
    } else {
      await loadAgentData()
    }
  }

  const loadLogs = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await apiService.getLogs({ limit: 100 })
      setLogs(data.logs || [])
    } catch (err) {
      setError('Failed to load logs')
      console.error('Logs error:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadAgentData = async () => {
    try {
      setAgentLoading(true)
      setError(null)
      
      const [statusData, reasoningData, historyData] = await Promise.all([
        apiService.getAgentStatus(),
        apiService.getAgentReasoning({ limit: 50 }),
        apiService.getTaskHistory({ limit: 20 })
      ])
      
      setAgentStatus(statusData.status)
      setAgentReasoning(reasoningData.reasoning || [])
      setTaskHistory(historyData.history || [])
    } catch (err) {
      setError('Failed to load agent data')
      console.error('Agent data error:', err)
    } finally {
      setAgentLoading(false)
    }
  }

  const filterLogs = () => {
    let filtered = logs

    // Filter by level
    if (levelFilter !== 'all') {
      filtered = filtered.filter(log => log.level === levelFilter)
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(log =>
        log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.service?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredLogs(filtered)
  }

  const getLevelBadgeClass = (level) => {
    switch (level) {
      case 'error':
        return 'badge badge-error'
      case 'warn':
        return 'badge badge-warning'
      case 'info':
        return 'badge badge-info'
      case 'debug':
        return 'badge bg-gray-100 text-gray-800'
      default:
        return 'badge bg-gray-100 text-gray-800'
    }
  }

  const exportLogs = () => {
    const csvContent = [
      ['Timestamp', 'Level', 'Service', 'Message'],
      ...filteredLogs.map(log => [
        log.timestamp,
        log.level,
        log.service || '',
        log.message
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `devops-agent-logs-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const getTaskStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return 'badge badge-success'
      case 'failed':
        return 'badge badge-error'
      case 'running':
        return 'badge badge-warning'
      case 'cancelled':
        return 'badge bg-gray-100 text-gray-800'
      default:
        return 'badge bg-gray-100 text-gray-800'
    }
  }

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'critical':
        return 'badge badge-error'
      case 'high':
        return 'badge badge-warning'
      case 'medium':
        return 'badge badge-info'
      case 'low':
        return 'badge bg-gray-100 text-gray-800'
      default:
        return 'badge bg-gray-100 text-gray-800'
    }
  }

  if ((loading || agentLoading) && logs.length === 0 && !agentStatus) {
    return <LoadingSpinner />
  }

  if (error && logs.length === 0 && !agentStatus) {
    return <ErrorMessage message={error} onRetry={loadData} />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Monitoring & Agent Logs</h2>
          <p className="text-gray-600">Application logs, agent reasoning, and task execution history</p>
        </div>
        <div className="flex items-center space-x-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="h-4 w-4 text-azure-600 focus:ring-azure-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">Auto-refresh</span>
          </label>
          <button
            onClick={loadData}
            disabled={loading || agentLoading}
            className="btn btn-secondary flex items-center space-x-2"
          >
            <RefreshCw className={`h-4 w-4 ${(loading || agentLoading) ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="card">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('logs')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'logs'
                  ? 'border-azure-500 text-azure-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Settings className="h-4 w-4" />
                <span>Application Logs</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('agent')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'agent'
                  ? 'border-azure-500 text-azure-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Brain className="h-4 w-4" />
                <span>Agent Reasoning</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('tasks')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'tasks'
                  ? 'border-azure-500 text-azure-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <History className="h-4 w-4" />
                <span>Task History</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('status')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'status'
                  ? 'border-azure-500 text-azure-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Activity className="h-4 w-4" />
                <span>Agent Status</span>
              </div>
            </button>
          </nav>
        </div>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'logs' && (
        <div className="space-y-6">{renderLogsContent()}</div>
      )}
      
      {activeTab === 'agent' && (
        <div className="space-y-6">{renderAgentReasoningContent()}</div>
      )}
      
      {activeTab === 'tasks' && (
        <div className="space-y-6">{renderTaskHistoryContent()}</div>
      )}
      
      {activeTab === 'status' && (
        <div className="space-y-6">{renderAgentStatusContent()}</div>
      )}
    </div>
  )

  function renderLogsContent() {
    return (
      <>
        {/* Filters */}
        <div className="card">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search logs..."
                  className="input pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <select
                  className="input w-auto"
                  value={levelFilter}
                  onChange={(e) => setLevelFilter(e.target.value)}
                >
                  <option value="all">All Levels</option>
                  <option value="error">Error</option>
                  <option value="warn">Warning</option>
                  <option value="info">Info</option>
                  <option value="debug">Debug</option>
                </select>
              </div>
              <button
                onClick={exportLogs}
                className="btn btn-secondary flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>Export</span>
              </button>
            </div>
          </div>
        </div>

        {/* Logs Table */}
        <div className="card p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Level
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Service
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Message
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLogs.length > 0 ? (
                  filteredLogs.map((log, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {format(new Date(log.timestamp), 'MMM dd, HH:mm:ss')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={getLevelBadgeClass(log.level)}>
                          {log.level.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {log.service || 'system'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="max-w-md truncate" title={log.message}>
                          {log.message}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                      {searchTerm || levelFilter !== 'all' ? 'No logs match your filters' : 'No logs available'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-2xl font-semibold text-gray-900">{logs.length}</div>
            <div className="text-sm text-gray-600">Total Logs</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-2xl font-semibold text-red-600">
              {logs.filter(log => log.level === 'error').length}
            </div>
            <div className="text-sm text-gray-600">Errors</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-2xl font-semibold text-yellow-600">
              {logs.filter(log => log.level === 'warn').length}
            </div>
            <div className="text-sm text-gray-600">Warnings</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-2xl font-semibold text-blue-600">
              {logs.filter(log => log.level === 'info').length}
            </div>
            <div className="text-sm text-gray-600">Info</div>
          </div>
        </div>
      </>
    )
  }

  function renderAgentReasoningContent() {
    return (
      <>
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Agent Decision Making</h3>
          <p className="text-gray-600 mb-6">
            This shows the agent's reasoning process - how it interprets events, plans execution, and makes decisions.
          </p>
          
          {agentReasoning.length > 0 ? (
            <div className="space-y-3">
              {agentReasoning.map((entry, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <Brain className="h-5 w-5 text-azure-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-gray-900">{entry.entry}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {format(new Date(entry.timestamp), 'MMM dd, HH:mm:ss.SSS')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No agent reasoning available yet. The agent will start reasoning when it processes events.
            </div>
          )}
        </div>
      </>
    )
  }

  function renderTaskHistoryContent() {
    return (
      <>
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Task Execution History</h3>
          <p className="text-gray-600 mb-6">
            View completed tasks, their execution plans, and results. This shows how the agent processes events into actionable tasks.
          </p>
          
          {taskHistory.length > 0 ? (
            <div className="space-y-4">
              {taskHistory.map((task, index) => (
                <div key={task.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <h4 className="font-medium text-gray-900">{task.type}</h4>
                      <span className={getTaskStatusBadge(task.status)}>
                        {task.status.toUpperCase()}
                      </span>
                      <span className={getPriorityBadge(task.priority)}>
                        {task.priority.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">
                      {format(new Date(task.timestamp), 'MMM dd, HH:mm:ss')}
                    </div>
                  </div>
                  
                  {task.context && (
                    <div className="text-sm text-gray-600 mb-2">
                      <strong>Context:</strong> {JSON.stringify(task.context, null, 2)}
                    </div>
                  )}
                  
                  {task.execution && (
                    <div className="mt-3 p-3 bg-gray-50 rounded">
                      <div className="text-sm text-gray-700">
                        <strong>Execution:</strong> {task.execution.metrics.completedSteps} steps completed
                        {task.execution.metrics.duration && (
                          <span className="ml-2">in {task.execution.metrics.duration}ms</span>
                        )}
                      </div>
                      
                      {task.execution.reasoning && task.execution.reasoning.length > 0 && (
                        <div className="mt-2">
                          <details>
                            <summary className="cursor-pointer text-sm font-medium text-azure-600">
                              View execution reasoning
                            </summary>
                            <div className="mt-2 space-y-1">
                              {task.execution.reasoning.slice(0, 5).map((reason, i) => (
                                <div key={i} className="text-xs text-gray-600">• {reason}</div>
                              ))}
                            </div>
                          </details>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No task history available yet. Tasks will appear here as the agent processes events.
            </div>
          )}
        </div>
      </>
    )
  }

  function renderAgentStatusContent() {
    if (!agentStatus) {
      return (
        <div className="card">
          <div className="text-center py-8 text-gray-500">
            Loading agent status...
          </div>
        </div>
      )
    }

    return (
      <>
        {/* Agent Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="card">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Agent Status</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Initialized:</span>
                <span className={`badge ${agentStatus.initialized ? 'badge-success' : 'badge-error'}`}>
                  {agentStatus.initialized ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Uptime:</span>
                <span className="text-gray-900">{Math.floor(agentStatus.uptime / 3600)}h {Math.floor((agentStatus.uptime % 3600) / 60)}m</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Memory:</span>
                <span className="text-gray-900">{Math.round(agentStatus.memory.used / 1024 / 1024)}MB</span>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Task Queue</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Pending:</span>
                <span className="text-2xl font-semibold text-yellow-600">{agentStatus.taskQueue.pending}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Active:</span>
                <span className="text-2xl font-semibold text-blue-600">{agentStatus.taskQueue.active}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Completed:</span>
                <span className="text-2xl font-semibold text-green-600">{agentStatus.taskQueue.completed}</span>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Executor Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Success Rate:</span>
                <span className="text-2xl font-semibold text-green-600">{agentStatus.executor.successRate}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Avg Duration:</span>
                <span className="text-gray-900">{agentStatus.executor.averageDuration}ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Executions:</span>
                <span className="text-gray-900">{agentStatus.executor.total}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tools Overview */}
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Available Tools</h3>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {Object.entries(agentStatus.tools.toolsByCategory).map(([category, count]) => (
              <div key={category} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 capitalize">{category}</span>
                  <span className="text-2xl font-bold text-azure-600">{count}</span>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6">
            <details>
              <summary className="cursor-pointer text-sm font-medium text-azure-600">
                View all {agentStatus.tools.totalTools} tools
              </summary>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {agentStatus.tools.tools.map((tool, index) => (
                  <div key={index} className="p-3 border border-gray-200 rounded">
                    <div className="font-medium text-sm text-gray-900">{tool.name}</div>
                    <div className="text-xs text-gray-500 capitalize">{tool.category}</div>
                    <div className="text-xs text-gray-600 mt-1">{tool.description}</div>
                  </div>
                ))}
              </div>
            </details>
          </div>
        </div>

        {/* Active Agents */}
        {agentStatus.activeAgents.length > 0 && (
          <div className="card">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Active Agents</h3>
            <div className="space-y-3">
              {agentStatus.activeAgents.map((agent, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">Task: {agent.taskId}</div>
                    <div className="text-sm text-gray-600">Step: {agent.currentStep}</div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {format(new Date(agent.startTime), 'HH:mm:ss')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </>
    )
  }
}
