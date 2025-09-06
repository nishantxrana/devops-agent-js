import React from 'react'
import { Routes, Route } from 'react-router-dom'
import AppShell from './components/AppShell'
import Dashboard from './pages/Dashboard'
import Settings from './pages/Settings'
import Logs from './pages/Logs'
import WorkItems from './pages/WorkItems'
import Pipelines from './pages/Pipelines'
import PullRequests from './pages/PullRequests'
import { HealthProvider } from './contexts/HealthContext'

function App() {
  return (
    <HealthProvider>
      <AppShell>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/work-items" element={<WorkItems />} />
          <Route path="/pipelines" element={<Pipelines />} />
          <Route path="/pull-requests" element={<PullRequests />} />
          <Route path="/logs" element={<Logs />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </AppShell>
    </HealthProvider>
  )
}

export default App
