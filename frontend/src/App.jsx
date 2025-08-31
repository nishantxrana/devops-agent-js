import React, { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import AgentChat from './components/AgentChat'
import Dashboard from './pages/Dashboard'
import Settings from './pages/Settings'
import Logs from './pages/Logs'
import WorkItems from './pages/WorkItems'
import Pipelines from './pages/Pipelines'
import PullRequests from './pages/PullRequests'
import { HealthProvider } from './contexts/HealthContext'

function App() {
  const [isChatOpen, setIsChatOpen] = useState(false);

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };

  return (
    <HealthProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/work-items" element={<WorkItems />} />
            <Route path="/pipelines" element={<Pipelines />} />
            <Route path="/pull-requests" element={<PullRequests />} />
            <Route path="/logs" element={<Logs />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </Layout>
        
        {/* AI Agent Chat Interface */}
        <AgentChat isOpen={isChatOpen} onToggle={toggleChat} />
      </div>
    </HealthProvider>
  )
}

export default App
