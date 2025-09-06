import React, { useState, useEffect } from 'react'
import { 
  Save, 
  TestTube, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Settings as SettingsIcon,
  Bell,
  Zap,
  Clock,
  Shield,
  Database,
  Bot
} from 'lucide-react'
import { apiService } from '../api/apiService'
import { useHealth } from '../contexts/HealthContext'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input, Label, FormField } from '../components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Checkbox } from '../components/ui/checkbox'
import { PageHeader } from '../components/ui/page-header'
import { Skeleton } from '../components/ui/skeleton'
import { EmptyState, ErrorState } from '../components/ui/empty-state'

// Configuration sections data
const configSections = [
  {
    id: 'azure',
    title: 'Azure DevOps',
    description: 'Connect to your Azure DevOps organization',
    icon: Database,
    color: 'primary'
  },
  {
    id: 'ai',
    title: 'AI Provider',
    description: 'Configure AI services for insights',
    icon: Bot,
    color: 'info'
  },
  {
    id: 'notifications',
    title: 'Notifications',
    description: 'Set up alerts and webhooks',
    icon: Bell,
    color: 'warning'
  },
  {
    id: 'polling',
    title: 'Polling Intervals',
    description: 'Configure data refresh schedules',
    icon: Clock,
    color: 'success'
  }
]

// Section Navigation Component
const SectionNav = ({ activeSection, onSectionChange }) => {
  return (
    <nav className="space-y-2">
      {configSections.map((section) => {
        const isActive = activeSection === section.id
        const colorClasses = {
          primary: 'text-primary-600 bg-primary-50 dark:text-primary-400 dark:bg-primary-600/10',
          info: 'text-info-600 bg-info-50 dark:text-info-400 dark:bg-info-600/10',
          warning: 'text-warning-600 bg-warning-50 dark:text-warning-400 dark:bg-warning-600/10',
          success: 'text-success-600 bg-success-50 dark:text-success-400 dark:bg-success-600/10'
        }

        return (
          <button
            key={section.id}
            onClick={() => onSectionChange(section.id)}
            className={`w-full flex items-center gap-x-3 rounded-lg px-3 py-2 text-left text-body-sm font-medium transition-all ${
              isActive
                ? `${colorClasses[section.color]} shadow-sm`
                : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-200 dark:hover:text-neutral-300'
            }`}
          >
            <section.icon className={`h-5 w-5 shrink-0 ${isActive ? '' : 'text-neutral-400'}`} />
            <div className="min-w-0 flex-1">
              <div className="font-medium">{section.title}</div>
              <div className={`text-caption ${isActive ? 'opacity-80' : 'text-neutral-500'}`}>
                {section.description}
              </div>
            </div>
          </button>
        )
      })}
    </nav>
  )
}

// Password Input Component
const PasswordInput = ({ value, onChange, placeholder, ...props }) => {
  const [show, setShow] = useState(false)
  
  return (
    <div className="relative">
      <Input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="pr-10"
        {...props}
      />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="absolute right-1 top-1 h-8 w-8 p-0"
        onClick={() => setShow(!show)}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </Button>
    </div>
  )
}

// Azure DevOps Configuration
const AzureDevOpsSection = ({ settings, onSettingsChange, onTest, testing, testResult }) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Database className="h-5 w-5 text-primary-600" />
        Azure DevOps Configuration
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <FormField label="Organization" required>
          <Input
            placeholder="your-organization"
            value={settings.azureDevOps.organization}
            onChange={(e) => onSettingsChange('azureDevOps', 'organization', e.target.value)}
          />
        </FormField>
        
        <FormField label="Project" required>
          <Input
            placeholder="your-project"
            value={settings.azureDevOps.project}
            onChange={(e) => onSettingsChange('azureDevOps', 'project', e.target.value)}
          />
        </FormField>
      </div>

      <FormField label="Personal Access Token" required>
        <PasswordInput
          placeholder="your-personal-access-token"
          value={settings.azureDevOps.personalAccessToken}
          onChange={(e) => onSettingsChange('azureDevOps', 'personalAccessToken', e.target.value)}
        />
      </FormField>

      <FormField label="Base URL">
        <Input
          placeholder="https://dev.azure.com"
          value={settings.azureDevOps.baseUrl}
          onChange={(e) => onSettingsChange('azureDevOps', 'baseUrl', e.target.value)}
        />
      </FormField>

      {/* Test Connection */}
      <div className="flex items-center justify-between pt-4 border-t border-neutral-200 dark:border-neutral-300">
        <div className="flex-1">
          {testResult && (
            <div className={`flex items-center gap-2 text-body-sm ${
              testResult.success ? 'text-success-600' : 'text-error-600'
            }`}>
              {testResult.success ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              {testResult.message}
            </div>
          )}
        </div>
        <Button
          onClick={onTest}
          disabled={testing}
          variant="outline"
          className="flex items-center gap-2"
        >
          <TestTube className={`h-4 w-4 ${testing ? 'animate-pulse' : ''}`} />
          {testing ? 'Testing...' : 'Test Connection'}
        </Button>
      </div>
    </CardContent>
  </Card>
)

// AI Configuration Section
const AISection = ({ settings, onSettingsChange }) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Bot className="h-5 w-5 text-info-600" />
        AI Configuration
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-6">
      <FormField label="AI Provider" required>
        <Select
          value={settings.ai.provider}
          onValueChange={(value) => onSettingsChange('ai', 'provider', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select AI provider" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="openai">OpenAI</SelectItem>
            <SelectItem value="groq">Groq</SelectItem>
            <SelectItem value="gemini">Google Gemini</SelectItem>
          </SelectContent>
        </Select>
      </FormField>

      {settings.ai.provider === 'openai' && (
        <FormField label="OpenAI API Key" required>
          <PasswordInput
            placeholder="sk-..."
            value={settings.ai.openaiApiKey}
            onChange={(e) => onSettingsChange('ai', 'openaiApiKey', e.target.value)}
          />
        </FormField>
      )}

      {settings.ai.provider === 'groq' && (
        <FormField label="Groq API Key" required>
          <PasswordInput
            placeholder="gsk_..."
            value={settings.ai.groqApiKey}
            onChange={(e) => onSettingsChange('ai', 'groqApiKey', e.target.value)}
          />
        </FormField>
      )}

      {settings.ai.provider === 'gemini' && (
        <FormField label="Gemini API Key" required>
          <PasswordInput
            placeholder="AIza..."
            value={settings.ai.geminiApiKey}
            onChange={(e) => onSettingsChange('ai', 'geminiApiKey', e.target.value)}
          />
        </FormField>
      )}

      <FormField label="Model" required>
        <Input
          placeholder="gpt-3.5-turbo"
          value={settings.ai.model}
          onChange={(e) => onSettingsChange('ai', 'model', e.target.value)}
        />
      </FormField>
    </CardContent>
  </Card>
)

// Notifications Section
const NotificationsSection = ({ settings, onSettingsChange }) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Bell className="h-5 w-5 text-warning-600" />
        Notifications
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-6">
      <div className="flex items-center space-x-2">
        <Checkbox
          id="enableNotifications"
          checked={settings.notifications.enabled}
          onCheckedChange={(checked) => onSettingsChange('notifications', 'enabled', checked)}
        />
        <Label htmlFor="enableNotifications" className="text-body-sm font-medium">
          Enable notifications
        </Label>
      </div>

      {settings.notifications.enabled && (
        <>
          <FormField label="Microsoft Teams Webhook URL">
            <PasswordInput
              placeholder="https://outlook.office.com/webhook/..."
              value={settings.notifications.teamsWebhookUrl}
              onChange={(e) => onSettingsChange('notifications', 'teamsWebhookUrl', e.target.value)}
            />
          </FormField>

          <FormField label="Slack Webhook URL">
            <PasswordInput
              placeholder="https://hooks.slack.com/services/..."
              value={settings.notifications.slackWebhookUrl}
              onChange={(e) => onSettingsChange('notifications', 'slackWebhookUrl', e.target.value)}
            />
          </FormField>

          <FormField label="Google Chat Webhook URL">
            <PasswordInput
              placeholder="https://chat.googleapis.com/v1/spaces/..."
              value={settings.notifications.googleChatWebhookUrl}
              onChange={(e) => onSettingsChange('notifications', 'googleChatWebhookUrl', e.target.value)}
            />
          </FormField>
        </>
      )}
    </CardContent>
  </Card>
)

// Polling Section
const PollingSection = ({ settings, onSettingsChange }) => {
  const intervals = [
    { key: 'workItemsInterval', label: 'Work Items', description: 'How often to check for work item updates' },
    { key: 'pipelineInterval', label: 'Pipelines', description: 'How often to check pipeline status' },
    { key: 'pullRequestInterval', label: 'Pull Requests', description: 'How often to check pull request status' },
    { key: 'overdueCheckInterval', label: 'Overdue Check', description: 'How often to check for overdue items' }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-success-600" />
          Polling Intervals
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {intervals.map((interval) => (
          <FormField key={interval.key} label={interval.label} help={interval.description}>
            <Input
              placeholder="*/15 * * * *"
              value={settings.polling[interval.key]}
              onChange={(e) => onSettingsChange('polling', interval.key, e.target.value)}
            />
          </FormField>
        ))}
      </CardContent>
    </Card>
  )
}

export default function Settings() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState(null)
  const [activeSection, setActiveSection] = useState('azure')
  const [error, setError] = useState(null)
  const { isConnected } = useHealth()
  
  const [settings, setSettings] = useState({
    azureDevOps: {
      organization: '',
      project: '',
      personalAccessToken: '',
      baseUrl: 'https://dev.azure.com'
    },
    ai: {
      provider: 'openai',
      openaiApiKey: '',
      groqApiKey: '',
      geminiApiKey: '',
      model: 'gpt-3.5-turbo'
    },
    notifications: {
      teamsWebhookUrl: '',
      slackWebhookUrl: '',
      googleChatWebhookUrl: '',
      enabled: true
    },
    polling: {
      workItemsInterval: '*/15 * * * *',
      pipelineInterval: '*/10 * * * *',
      pullRequestInterval: '0 */2 * * *',
      overdueCheckInterval: '0 9 * * *'
    }
  })

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await apiService.getSettings()
      if (response) {
        setSettings(prev => ({ ...prev, ...response }))
      }
    } catch (err) {
      console.error('Error loading settings:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const updateSetting = (section, key, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }))
    setTestResult(null) // Clear test results when settings change
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      await apiService.saveSettings(settings)
      // Could add success toast here
    } catch (err) {
      console.error('Error saving settings:', err)
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleTest = async () => {
    try {
      setTesting(true)
      setTestResult(null)
      const result = await apiService.testConnection(settings.azureDevOps)
      setTestResult({
        success: result.success || false,
        message: result.message || (result.success ? 'Connection successful!' : 'Connection failed')
      })
    } catch (err) {
      setTestResult({
        success: false,
        message: err.message || 'Connection test failed'
      })
    } finally {
      setTesting(false)
    }
  }

  if (error && loading) {
    return <ErrorState message={error} onRetry={loadSettings} />
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Settings" description="Configure your Azure DevOps monitoring agent" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
          <div className="lg:col-span-3">
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </div>
    )
  }

  const renderSection = () => {
    switch (activeSection) {
      case 'azure':
        return (
          <AzureDevOpsSection
            settings={settings}
            onSettingsChange={updateSetting}
            onTest={handleTest}
            testing={testing}
            testResult={testResult}
          />
        )
      case 'ai':
        return <AISection settings={settings} onSettingsChange={updateSetting} />
      case 'notifications':
        return <NotificationsSection settings={settings} onSettingsChange={updateSetting} />
      case 'polling':
        return <PollingSection settings={settings} onSettingsChange={updateSetting} />
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Configure your Azure DevOps monitoring agent"
        actions={[
          <Button
            key="save"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2"
          >
            <Save className={`h-4 w-4 ${saving ? 'animate-pulse' : ''}`} />
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        ]}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Section Navigation */}
        <div className="lg:col-span-1">
          <SectionNav 
            activeSection={activeSection} 
            onSectionChange={setActiveSection} 
          />
        </div>

        {/* Section Content */}
        <div className="lg:col-span-3">
          {renderSection()}
        </div>
      </div>
    </div>
  )
}