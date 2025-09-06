import React, { useState, useEffect } from 'react'
import { 
  Save, 
  TestTube, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Info,
  Settings as SettingsIcon,
  Bell,
  Zap,
  Clock,
  Shield,
  Database,
  Webhook,
  Bot,
  HelpCircle,
  ExternalLink
} from 'lucide-react'
import { apiService } from '../api/apiService'
import { useHealth } from '../contexts/HealthContext'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

function ConnectionStatus({ isConnected, isChecking }) {
  return (
    <div className="flex items-center gap-2">
      <div className={cn(
        "h-2 w-2 rounded-full",
        isConnected ? "bg-green-500" : "bg-red-500"
      )} />
      <span className="text-sm">
        {isChecking ? 'Checking...' : isConnected ? 'Connected' : 'Disconnected'}
      </span>
      <Badge variant={isConnected ? "default" : "destructive"}>
        {isConnected ? 'Healthy' : 'Offline'}
      </Badge>
    </div>
  )
}

function SecretInput({ label, description, value, onChange, placeholder, type = "password" }) {
  const [isVisible, setIsVisible] = useState(false)
  
  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        {label}
        {description && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <HelpCircle className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p>{description}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </Label>
      <div className="relative">
        <Input
          type={isVisible ? "text" : type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="pr-10"
        />
        {type === "password" && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => setIsVisible(!isVisible)}
          >
            {isVisible ? (
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Eye className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        )}
      </div>
    </div>
  )
}

function CronInput({ label, value, onChange, examples }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0 */2 * * *"
        className="font-mono"
      />
      {examples && (
        <div className="text-xs space-y-1">
          <div className="text-muted-foreground">Examples:</div>
          {examples.map((example, idx) => (
            <div key={idx} className="text-muted-foreground">
              <code className="bg-muted px-1 rounded">{example.pattern}</code> - {example.description}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Settings() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState(null)
  const { isConnected, healthData } = useHealth()
  const { toast } = useToast()
  
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
      enabled: true,
      teamsWebhookUrl: '',
      slackWebhookUrl: '',
      googleChatWebhookUrl: ''
    },
    polling: {
      workItems: '*/15 * * * *',
      pipelines: '*/10 * * * *',
      pullRequests: '0 */2 * * *',
      overdueCheck: '0 9 * * *'
    }
  })

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setLoading(true)
      const data = await apiService.getSettings()
      setSettings(prev => ({ ...prev, ...data }))
    } catch (error) {
      console.error('Failed to load settings:', error)
      toast({
        title: "Error loading settings",
        description: "Could not load current settings. Using defaults.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    try {
      setSaving(true)
      await apiService.updateSettings(settings)
      toast({
        title: "Settings saved",
        description: "Your configuration has been saved successfully.",
      })
    } catch (error) {
      console.error('Failed to save settings:', error)
      toast({
        title: "Error saving settings",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const testConnection = async () => {
    try {
      setTesting(true)
      setTestResult(null)
      
      const result = await apiService.testConnection(settings.azureDevOps)
      
      setTestResult({
        success: result.success,
        message: result.message || (result.success ? 'Connection successful!' : 'Connection failed')
      })
      
      toast({
        title: result.success ? "Connection successful" : "Connection failed",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      })
    } catch (error) {
      console.error('Connection test failed:', error)
      setTestResult({
        success: false,
        message: 'Connection test failed. Please check your configuration.'
      })
      
      toast({
        title: "Connection test failed",
        description: "Please check your Azure DevOps configuration.",
        variant: "destructive",
      })
    } finally {
      setTesting(false)
    }
  }

  const updateSetting = (category, field, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value
      }
    }))
  }

  const cronExamples = {
    workItems: [
      { pattern: "*/15 * * * *", description: "Every 15 minutes" },
      { pattern: "0 */1 * * *", description: "Every hour" }
    ],
    pipelines: [
      { pattern: "*/10 * * * *", description: "Every 10 minutes" },
      { pattern: "*/5 * * * *", description: "Every 5 minutes" }
    ],
    pullRequests: [
      { pattern: "0 */2 * * *", description: "Every 2 hours" },
      { pattern: "0 9,17 * * *", description: "At 9 AM and 5 PM" }
    ],
    overdueCheck: [
      { pattern: "0 9 * * *", description: "Daily at 9 AM" },
      { pattern: "0 9 * * 1-5", description: "Weekdays at 9 AM" }
    ]
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
          <div className="h-4 w-96 bg-muted animate-pulse rounded" />
        </div>
        <div className="grid gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-5 w-32 bg-muted animate-pulse rounded" />
              </CardHeader>
              <CardContent className="space-y-4">
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className="space-y-2">
                    <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                    <div className="h-10 w-full bg-muted animate-pulse rounded" />
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Configure your Azure DevOps monitoring agent
        </p>
        <ConnectionStatus isConnected={isConnected} isChecking={false} />
      </div>

      <Tabs defaultValue="azure" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="azure" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Azure DevOps
          </TabsTrigger>
          <TabsTrigger value="ai" className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            AI Settings
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="scheduling" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Scheduling
          </TabsTrigger>
        </TabsList>

        {/* Azure DevOps Configuration */}
        <TabsContent value="azure" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Azure DevOps Configuration
              </CardTitle>
              <CardDescription>
                Configure your Azure DevOps organization and authentication
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Organization</Label>
                  <Input
                    value={settings.azureDevOps.organization}
                    onChange={(e) => updateSetting('azureDevOps', 'organization', e.target.value)}
                    placeholder="your-organization"
                  />
                  <p className="text-sm text-muted-foreground">
                    Your Azure DevOps organization name
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Project</Label>
                  <Input
                    value={settings.azureDevOps.project}
                    onChange={(e) => updateSetting('azureDevOps', 'project', e.target.value)}
                    placeholder="your-project"
                  />
                  <p className="text-sm text-muted-foreground">
                    The project to monitor
                  </p>
                </div>
              </div>

              <SecretInput
                label="Personal Access Token"
                description="Generate a PAT with Work Items (Read), Build (Read), and Code (Read) permissions"
                value={settings.azureDevOps.personalAccessToken}
                onChange={(value) => updateSetting('azureDevOps', 'personalAccessToken', value)}
                placeholder="your-personal-access-token"
              />

              <div className="space-y-2">
                <Label>Base URL</Label>
                <Input
                  value={settings.azureDevOps.baseUrl}
                  onChange={(e) => updateSetting('azureDevOps', 'baseUrl', e.target.value)}
                  placeholder="https://dev.azure.com"
                />
                <p className="text-sm text-muted-foreground">
                  Azure DevOps base URL (usually https://dev.azure.com)
                </p>
              </div>

              {testResult && (
                <Alert variant={testResult.success ? "default" : "destructive"}>
                  {testResult.success ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )}
                  <AlertTitle>
                    {testResult.success ? 'Connection Successful' : 'Connection Failed'}
                  </AlertTitle>
                  <AlertDescription>{testResult.message}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2">
                <Button 
                  onClick={testConnection} 
                  disabled={testing}
                  variant="outline"
                  className="gap-2"
                >
                  <TestTube className={cn("h-4 w-4", testing && "animate-spin")} />
                  {testing ? 'Testing...' : 'Test Connection'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Configuration */}
        <TabsContent value="ai" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                AI Configuration
              </CardTitle>
              <CardDescription>
                Configure AI providers for enhanced insights and summaries
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>AI Provider</Label>
                <Select
                  value={settings.ai.provider}
                  onValueChange={(value) => updateSetting('ai', 'provider', value)}
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
                <p className="text-sm text-muted-foreground">
                  Choose your preferred AI provider for generating insights
                </p>
              </div>

              {settings.ai.provider === 'openai' && (
                <SecretInput
                  label="OpenAI API Key"
                  description="Get your API key from https://platform.openai.com/api-keys"
                  value={settings.ai.openaiApiKey}
                  onChange={(value) => updateSetting('ai', 'openaiApiKey', value)}
                  placeholder="sk-..."
                />
              )}

              {settings.ai.provider === 'groq' && (
                <SecretInput
                  label="Groq API Key"
                  description="Get your API key from https://console.groq.com/keys"
                  value={settings.ai.groqApiKey}
                  onChange={(value) => updateSetting('ai', 'groqApiKey', value)}
                  placeholder="gsk_..."
                />
              )}

              {settings.ai.provider === 'gemini' && (
                <SecretInput
                  label="Google Gemini API Key"
                  description="Get your API key from https://aistudio.google.com/app/apikey"
                  value={settings.ai.geminiApiKey}
                  onChange={(value) => updateSetting('ai', 'geminiApiKey', value)}
                  placeholder="AI..."
                />
              )}

              <div className="space-y-2">
                <Label>Model</Label>
                <Input
                  value={settings.ai.model}
                  onChange={(e) => updateSetting('ai', 'model', e.target.value)}
                  placeholder="gpt-3.5-turbo"
                />
                <p className="text-sm text-muted-foreground">
                  Specific model to use (e.g., gpt-3.5-turbo, llama2-70b-4096, gemini-pro)
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Settings
              </CardTitle>
              <CardDescription>
                Configure how and where you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Enable Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Turn on/off all notifications
                  </p>
                </div>
                <Switch
                  checked={settings.notifications.enabled}
                  onCheckedChange={(checked) => updateSetting('notifications', 'enabled', checked)}
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Webhook className="h-4 w-4" />
                    Microsoft Teams Webhook URL
                  </Label>
                  <Input
                    value={settings.notifications.teamsWebhookUrl}
                    onChange={(e) => updateSetting('notifications', 'teamsWebhookUrl', e.target.value)}
                    placeholder="https://outlook.office.com/webhook/..."
                  />
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    Configure incoming webhook in Teams channel
                    <Button variant="link" size="sm" className="h-auto p-0" asChild>
                      <a href="https://docs.microsoft.com/en-us/microsoftteams/platform/webhooks-and-connectors/how-to/add-incoming-webhook" target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </Button>
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Webhook className="h-4 w-4" />
                    Slack Webhook URL
                  </Label>
                  <Input
                    value={settings.notifications.slackWebhookUrl}
                    onChange={(e) => updateSetting('notifications', 'slackWebhookUrl', e.target.value)}
                    placeholder="https://hooks.slack.com/services/..."
                  />
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    Create an incoming webhook in your Slack workspace
                    <Button variant="link" size="sm" className="h-auto p-0" asChild>
                      <a href="https://api.slack.com/messaging/webhooks" target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </Button>
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Webhook className="h-4 w-4" />
                    Google Chat Webhook URL
                  </Label>
                  <Input
                    value={settings.notifications.googleChatWebhookUrl}
                    onChange={(e) => updateSetting('notifications', 'googleChatWebhookUrl', e.target.value)}
                    placeholder="https://chat.googleapis.com/v1/spaces/..."
                  />
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    Configure incoming webhook in Google Chat
                    <Button variant="link" size="sm" className="h-auto p-0" asChild>
                      <a href="https://developers.google.com/chat/how-tos/webhooks" target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </Button>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Scheduling */}
        <TabsContent value="scheduling" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Polling Intervals
              </CardTitle>
              <CardDescription>
                Configure how often different data sources are checked
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Cron Expression Format</AlertTitle>
                <AlertDescription>
                  Use standard cron format: minute hour day month weekday
                  <br />
                  <code className="bg-muted px-1 rounded">* * * * *</code> = minute hour day month weekday
                </AlertDescription>
              </Alert>

              <div className="grid gap-4 md:grid-cols-2">
                <CronInput
                  label="Work Items"
                  value={settings.polling.workItems}
                  onChange={(value) => updateSetting('polling', 'workItems', value)}
                  examples={cronExamples.workItems}
                />

                <CronInput
                  label="Pipelines"
                  value={settings.polling.pipelines}
                  onChange={(value) => updateSetting('polling', 'pipelines', value)}
                  examples={cronExamples.pipelines}
                />

                <CronInput
                  label="Pull Requests"
                  value={settings.polling.pullRequests}
                  onChange={(value) => updateSetting('polling', 'pullRequests', value)}
                  examples={cronExamples.pullRequests}
                />

                <CronInput
                  label="Overdue Check"
                  value={settings.polling.overdueCheck}
                  onChange={(value) => updateSetting('polling', 'overdueCheck', value)}
                  examples={cronExamples.overdueCheck}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button 
          onClick={saveSettings} 
          disabled={saving}
          className="gap-2"
        >
          <Save className={cn("h-4 w-4", saving && "animate-spin")} />
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  )
}