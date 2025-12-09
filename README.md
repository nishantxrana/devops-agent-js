# InsightOps

**AI-powered DevOps monitoring platform for Azure DevOps that provides intelligent insights, automated notifications, and enhanced development workflows.**

<div align="center">

![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-18+-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.3-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-8+-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)

[Features](#-features) • [Quick Start](#-quick-start) • [Architecture](#-architecture) • [Usage](#-usage) • [Roadmap](#-roadmap)

</div>

---

## 📋 Summary

InsightOps solves the challenge of managing complex Azure DevOps workflows by providing a unified, AI-enhanced monitoring dashboard. Instead of switching between multiple Azure DevOps views, teams get:

- **Real-time visibility** into sprints, builds, releases, and pull requests in one place
- **AI-powered analysis** that diagnoses build failures and suggests specific fixes
- **Smart notifications** to Slack, Microsoft Teams, and Google Chat with context-aware alerts
- **Multi-AI provider support** (OpenAI, Groq, Google Gemini) with runtime switching

**What makes it unique:** InsightOps combines an agentic AI architecture with rule-based learning to continuously improve its analysis and recommendations based on your team's patterns.

---

## 🚀 Features

### AI-Powered Build Analysis
- Intelligent diagnosis of build failures with specific fix recommendations
- Support for GPT-4, Gemini 2.0 Flash, Llama 3, and Mixtral models
- Dynamic provider switching without application restart
- Caching layer for faster repeated analyses

### Comprehensive DevOps Monitoring
- **Work Items**: Current sprint tracking with progress visualization and overdue detection
- **Build Pipelines**: Real-time build status, success rates, and failure history
- **Releases**: Deployment tracking across environments with approval workflows
- **Pull Requests**: Active PR monitoring with idle detection (48+ hours without activity)

### Smart Notifications
- Multi-platform support: Microsoft Teams, Slack, Google Chat
- Rich formatted messages with build status, AI analysis, and action items
- Configurable polling intervals via cron expressions
- Webhook support for real-time event handling

### Modern Dashboard UI
- Clean, responsive design built with React 18 and Tailwind CSS
- Dark/Light mode with system preference detection
- Collapsible sidebar navigation with smooth animations
- Real-time health indicators and live uptime counters

### Enterprise-Ready Security
- JWT authentication with secure session management
- Encrypted storage for API keys and credentials
- Rate limiting and CORS protection
- Helmet.js security headers

---

## 🛠️ Tech Stack

### Backend
| Technology | Purpose |
|------------|---------|
| Node.js 18+ | Runtime environment |
| Express.js | REST API framework |
| MongoDB + Mongoose | Database and ODM |
| Winston | Structured logging |
| node-cron | Background job scheduling |
| Joi / Zod | Request validation |

### Frontend
| Technology | Purpose |
|------------|---------|
| React 18 | UI framework |
| Vite | Build tool and dev server |
| Tailwind CSS | Utility-first styling |
| shadcn/ui + Radix UI | Component library |
| React Router | Client-side routing |
| Lucide Icons | Icon library |

### AI Integrations
| Provider | Models |
|----------|--------|
| OpenAI | GPT-4, GPT-4o-mini, GPT-3.5-turbo |
| Google Gemini | Gemini 2.0 Flash, Gemini 1.5 Pro |
| Groq | Llama 3 (8B/70B), Mixtral 8x7B |

---

## 🏗️ Architecture

```
InsightOps/
├── backend/                     # Node.js/Express API Server
│   ├── agents/                  # AI agent system (Monitor, Analyze, Execute)
│   ├── ai/                      # Multi-provider AI integration & routing
│   ├── api/                     # REST API endpoints and route handlers
│   ├── cache/                   # Caching layer for AI responses
│   ├── config/                  # Environment and settings management
│   ├── devops/                  # Azure DevOps API client (builds, releases, work items)
│   ├── learning/                # Pattern tracking and rule generation
│   ├── middleware/              # Auth, validation, rate limiting
│   ├── models/                  # MongoDB schemas (User, Settings)
│   ├── notifications/           # Teams, Slack, Google Chat integrations
│   ├── polling/                 # Background monitoring jobs
│   ├── services/                # Business logic services
│   ├── webhooks/                # Azure DevOps webhook handlers
│   ├── workflows/               # Agentic workflow definitions
│   └── main.js                  # Application entry point
│
├── frontend/                    # React/Vite SPA
│   └── src/
│       ├── api/                 # API client and service calls
│       ├── components/          # Reusable UI components
│       │   └── ui/              # shadcn/ui primitives
│       ├── contexts/            # React contexts (Auth, Theme, Health)
│       ├── hooks/               # Custom React hooks
│       └── pages/               # Route-level page components
│           ├── Dashboard.jsx    # Main overview with stats
│           ├── WorkItems.jsx    # Sprint work item management
│           ├── Pipelines.jsx    # Build pipeline monitoring
│           ├── Releases.jsx     # Release deployment tracking
│           ├── PullRequests.jsx # PR status and reviews
│           └── Settings.jsx     # Configuration UI
│
└── package.json                 # Monorepo scripts
```

---

## ⚡ Quick Start

### Prerequisites

- **Node.js** 18 or higher
- **MongoDB** (local or Atlas connection string)
- **Azure DevOps** Personal Access Token (PAT)
- **AI Provider API Key** (at least one of: OpenAI, Groq, or Google Gemini)

### Installation

```bash
# Clone the repository
git clone https://github.com/nishantxrana/InsightOps.git
cd InsightOps

# Install all dependencies (backend + frontend)
npm run install:all

# Configure environment variables
cp backend/.env.example backend/.env
# Edit backend/.env with your credentials (see Configuration below)

# Start development servers (backend on :3001, frontend on :5173)
npm run dev
```

### Configuration

Edit `backend/.env` with your settings:

```env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/insightops

# Security
JWT_SECRET=your-64-character-secret-key
ENCRYPTION_KEY=your-32-byte-hex-encryption-key

# Azure DevOps (configure via Settings UI after login)
# AZURE_DEVOPS_ORG=your-organization
# AZURE_DEVOPS_PROJECT=your-project
# AZURE_DEVOPS_PAT=your-personal-access-token

# AI Provider (configure via Settings UI after login)
# OPENAI_API_KEY=sk-...
# GROQ_API_KEY=gsk_...
# GEMINI_API_KEY=AI...
```

### Production Build

```bash
# Build frontend for production
npm run build

# Start production server (serves frontend from backend)
npm run start
```

---

## 📖 Usage

### Getting Started Flow

1. **Sign Up / Sign In** - Create an account on the landing page
2. **Configure Azure DevOps** - Go to Settings → Azure DevOps and enter:
   - Organization name
   - Project name
   - Personal Access Token (with Work Items, Build, Code, and Release read permissions)
3. **Configure AI Provider** - Choose OpenAI, Groq, or Gemini and add your API key
4. **Explore Dashboard** - View your sprint progress, builds, releases, and PRs

### Key Features Walkthrough

#### Dashboard Overview
The main dashboard provides at-a-glance stats:
- Sprint work item progress with completion percentage
- Build pipeline success rate
- Release deployment status
- Active pull request count with idle PR alerts

#### AI Build Analysis
When a build fails:
1. Navigate to **Pipelines** page
2. Click on a failed build
3. Click **Analyze with AI**
4. Receive specific diagnosis and fix recommendations

#### Notification Setup
1. Go to **Settings** → **Notifications**
2. Add webhook URLs for Teams, Slack, or Google Chat
3. Configure polling intervals (cron expressions)
4. Enable/disable notification types

### Screenshots

> TODO: Add screenshots of:
> - Landing page
> - Dashboard overview
> - Build failure analysis modal
> - Settings configuration

---

## 🗺️ Roadmap

### Planned Enhancements

- [ ] **Additional AI Providers** - Claude (Anthropic), Cohere integration
- [ ] **Custom Dashboards** - User-configurable metric widgets
- [ ] **Multi-Organization Support** - Manage multiple Azure DevOps orgs
- [ ] **Advanced DORA Metrics** - Deployment frequency, lead time, MTTR tracking
- [ ] **Mobile App** - React Native companion app
- [ ] **SSO Integration** - Azure AD, Okta, Google Workspace
- [ ] **Kubernetes Deployment** - Helm charts and operators
- [ ] **Plugin Architecture** - Custom integrations and extensions

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and commit: `git commit -m 'Add amazing feature'`
4. Push to your branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🔗 Links

- [Report a Bug](https://github.com/nishantxrana/InsightOps/issues/new?labels=bug)
- [Request a Feature](https://github.com/nishantxrana/InsightOps/issues/new?labels=enhancement)
- [View Open Issues](https://github.com/nishantxrana/InsightOps/issues)

---

<div align="center">

**If you find InsightOps useful, please consider giving it a ⭐ on GitHub!**

Built with ❤️ for the DevOps community

</div>
