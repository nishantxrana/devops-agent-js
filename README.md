# AI-Powered Azure DevOps Monitoring Agent

A comprehensive monitoring solution for Azure DevOps with AI-powered insights, real-time notifications, and a modern React frontend.

## 🚀 Features

### Work Item Monitoring
- Real-time updates via Azure DevOps webhooks
- AI-generated summaries for new work items
- Daily sprint summaries with AI insights
- Overdue item tracking and reminders
- Markdown-formatted notifications to Teams/Slack

### Pipeline Monitoring
- Build completion notifications (success/failure)
- AI-powered failure analysis with logs summarization
- Build timeline and error extraction
- Deployment failure alerts
- Build success rate tracking

### Pull Request Monitoring
- PR creation and update notifications
- Reviewer assignment alerts
- Idle PR detection (48+ hours without activity)
- AI-generated changelog summaries
- Review status tracking

### AI Integration
- OpenAI GPT and Groq support
- Intelligent log analysis
- Work item description summarization
- PR diff analysis and changelog generation
- Sprint progress insights

### Frontend Dashboard
- Real-time monitoring dashboard
- Settings management with secure credential storage
- Live logs viewer with filtering
- Work items, pipelines, and PR status pages
- Responsive design with Tailwind CSS

## 🛠️ Tech Stack

**Backend:**
- Node.js with Express
- Azure DevOps REST APIs & Webhooks
- OpenAI / Groq for AI features
- Winston for logging
- Node-cron for scheduled tasks

**Frontend:**
- React 18 with Vite
- React Router for navigation
- Tailwind CSS for styling
- Axios for API communication
- Lucide React for icons

## 📋 Prerequisites

- Node.js 18+ and npm
- Azure DevOps organization and project
- Azure DevOps Personal Access Token (PAT)
- OpenAI API key or Groq API key
- Microsoft Teams or Slack webhook URL (optional)

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd js-devops-agent

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Backend Configuration

Create `.env` file in the `backend` directory:

```bash
cd backend
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Azure DevOps Configuration
AZURE_DEVOPS_ORG=your-organization
AZURE_DEVOPS_PROJECT=your-project
AZURE_DEVOPS_PAT=your-personal-access-token
AZURE_DEVOPS_BASE_URL=https://dev.azure.com

# AI Configuration
AI_PROVIDER=openai
OPENAI_API_KEY=your-openai-api-key
# OR for Groq:
# AI_PROVIDER=groq
# GROQ_API_KEY=your-groq-api-key
AI_MODEL=gpt-3.5-turbo

# Notification Configuration
TEAMS_WEBHOOK_URL=https://your-teams-webhook-url
SLACK_WEBHOOK_URL=https://your-slack-webhook-url
NOTIFICATIONS_ENABLED=true

# Polling Configuration (cron expressions)
WORK_ITEMS_POLL_INTERVAL=*/15 * * * *
PIPELINE_POLL_INTERVAL=*/10 * * * *
PR_POLL_INTERVAL=0 */2 * * *
OVERDUE_CHECK_INTERVAL=0 9 * * *

# Security Configuration
WEBHOOK_SECRET=your-webhook-secret
API_TOKEN=your-api-token

# Application Configuration
PORT=3001
NODE_ENV=development
LOG_LEVEL=info
FRONTEND_URL=http://localhost:5175
```

### 3. Start the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5175
- Backend API: http://localhost:3001

### 4. Configure Azure DevOps Webhooks

Set up webhooks in your Azure DevOps project:

1. Go to Project Settings → Service hooks
2. Create webhooks for:
   - **Work item created**: `http://your-domain:3001/api/webhooks/workitem/created`
   - **Work item updated**: `http://your-domain:3001/api/webhooks/workitem/updated`
   - **Build completed**: `http://your-domain:3001/api/webhooks/build/completed`
   - **Pull request created**: `http://your-domain:3001/api/webhooks/pullrequest/created`
   - **Pull request updated**: `http://your-domain:3001/api/webhooks/pullrequest/updated`

## 📁 Project Structure

```
js-devops-agent/
├── backend/
│   ├── main.js                 # Express app entry point
│   ├── config/
│   │   └── settings.js         # Configuration management
│   ├── webhooks/
│   │   ├── index.js           # Webhook routes
│   │   ├── workItemWebhook.js # Work item handlers
│   │   ├── buildWebhook.js    # Build handlers
│   │   └── pullRequestWebhook.js # PR handlers
│   ├── polling/
│   │   ├── index.js           # Polling job manager
│   │   ├── workItemPoller.js  # Work item polling
│   │   ├── buildPoller.js     # Build polling
│   │   └── pullRequestPoller.js # PR polling
│   ├── devops/
│   │   └── azureDevOpsClient.js # Azure DevOps API client
│   ├── ai/
│   │   └── aiService.js       # AI integration service
│   ├── notifications/
│   │   └── notificationService.js # Teams/Slack notifications
│   └── utils/
│       ├── logger.js          # Winston logging
│       ├── errorHandler.js    # Error handling
│       ├── markdownFormatter.js # Message formatting
│       └── webhookValidator.js # Webhook security
├── frontend/
│   ├── src/
│   │   ├── main.jsx           # React entry point
│   │   ├── App.jsx            # Main app component
│   │   ├── components/
│   │   │   ├── Layout.jsx     # App layout with navigation
│   │   │   ├── LoadingSpinner.jsx
│   │   │   └── ErrorMessage.jsx
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx  # Main dashboard
│   │   │   ├── Settings.jsx   # Configuration page
│   │   │   ├── Logs.jsx       # Logs viewer
│   │   │   ├── WorkItems.jsx  # Work items page
│   │   │   ├── Pipelines.jsx  # Pipelines page
│   │   │   └── PullRequests.jsx # PR page
│   │   ├── api/
│   │   │   └── apiService.js  # Backend API client
│   │   └── styles/
│   │       └── index.css      # Tailwind CSS
│   ├── index.html
│   ├── vite.config.js
│   └── tailwind.config.js
└── README.md
```

## 🔧 Configuration

### Azure DevOps Personal Access Token

Create a PAT with the following scopes:
- **Work Items**: Read & Write
- **Build**: Read
- **Code**: Read
- **Pull Request**: Read

### AI Provider Setup

**OpenAI:**
1. Get API key from https://platform.openai.com/api-keys
2. Set `AI_PROVIDER=openai` and `OPENAI_API_KEY=your-key`

**Groq:**
1. Get API key from https://console.groq.com/keys
2. Set `AI_PROVIDER=groq` and `GROQ_API_KEY=your-key`

### Notification Setup

**Microsoft Teams:**
1. Create an Incoming Webhook connector in your Teams channel
2. Set `TEAMS_WEBHOOK_URL=your-webhook-url`

**Slack:**
1. Create an Incoming Webhook in your Slack workspace
2. Set `SLACK_WEBHOOK_URL=your-webhook-url`

## 🔍 API Endpoints

### Webhooks
- `POST /api/webhooks/workitem/created` - Work item created
- `POST /api/webhooks/workitem/updated` - Work item updated
- `POST /api/webhooks/build/completed` - Build completed
- `POST /api/webhooks/pullrequest/created` - PR created
- `POST /api/webhooks/pullrequest/updated` - PR updated
- `POST /api/webhooks/test` - Test webhook

### Health Checks
- `GET /health` - Application health
- `GET /api/webhooks/health` - Webhook service health

## 🧪 Testing

This project includes automated tests for both the backend and frontend.

### Backend Tests

The backend uses Jest for integration testing.

```bash
# From the root directory
npm test --prefix backend
```

### Frontend Tests

The frontend uses Vitest and React Testing Library for component testing.

```bash
# From the root directory
npm test --prefix frontend
```

## 📊 Monitoring

### Logs
- Application logs: `backend/logs/`
- Real-time logs: Available in frontend at `/logs`
- Log levels: error, warn, info, debug

### Polling Jobs
- Work items: Every 15 minutes (configurable)
- Pipelines: Every 10 minutes (configurable)
- Pull requests: Every 2 hours (configurable)
- Overdue check: Daily at 9 AM (configurable)

## 🚀 Production Deployment

### Running with Docker (Recommended)

The easiest way to run the application in production is with Docker.

1.  **Create an environment file:**
    Create a file named `backend.env` in the root of the project and add your environment variables there. You can copy the content from `backend/.env.example`.

2.  **Build the Docker image:**
    ```bash
    docker build -t devops-agent .
    ```

3.  **Run the Docker container:**
    ```bash
    docker run -p 80:80 --env-file backend.env devops-agent
    ```
    The application will be available at `http://localhost`.

### Manual Deployment

#### Environment Variables
Set all required environment variables in your production environment.

### Security
- Use strong `WEBHOOK_SECRET` for webhook validation
- Use HTTPS in production
- Secure your API tokens and keys
- Configure proper CORS origins

### Process Management
Consider using PM2 or similar for process management:

```bash
npm install -g pm2
pm2 start backend/main.js --name "devops-agent"
```

### Build Frontend
```bash
cd frontend
npm run build
```

Serve the `dist` folder with a web server like nginx.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

MIT License - see LICENSE file for details.

## 🆘 Troubleshooting

### Common Issues

**"Configuration validation failed"**
- Check all required environment variables are set
- Verify Azure DevOps PAT has correct permissions

**"Failed to connect to Azure DevOps"**
- Verify organization and project names
- Check PAT is valid and not expired
- Ensure network connectivity

**"AI service unavailable"**
- Check API key is valid
- Verify AI provider is correctly set
- Check API quotas and limits

**Webhooks not working**
- Verify webhook URLs are accessible
- Check webhook secret configuration
- Review Azure DevOps service hook settings

### Debug Mode
Set `LOG_LEVEL=debug` in your `.env` file for detailed logging.

### Support
For issues and questions, please create an issue in the repository.
