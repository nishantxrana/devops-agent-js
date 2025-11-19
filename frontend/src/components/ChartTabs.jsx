"use client"

import { useState } from 'react'
import { BuildSuccessRateTrend } from './BuildSuccessRateTrend'
import { SprintBurndownChart } from './SprintBurndownChart'
import { TrendingUp, Target } from "lucide-react"

export function ChartTabs({ refreshTrigger }) {
  const [activeTab, setActiveTab] = useState('build-success')

  const tabs = [
    {
      id: 'build-success',
      label: 'Build Success Rate',
      icon: TrendingUp,
      component: <BuildSuccessRateTrend refreshTrigger={refreshTrigger} />
    },
    {
      id: 'sprint-burndown', 
      label: 'Sprint Burndown',
      icon: Target,
      component: <SprintBurndownChart refreshTrigger={refreshTrigger} />
    }
  ]

  return (
    <div className="w-full">
      {/* Tab Navigation */}
      <div className="border-b border-border bg-background">
        <nav className="flex space-x-8 px-1" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            
            return (
              <button
                key={tab.id}
                onClick={(e) => {
                  e.preventDefault()
                  setActiveTab(tab.id)
                }}
                className={`
                  group inline-flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200
                  ${isActive 
                    ? 'border-primary text-primary' 
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground'
                  }
                `}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className={`h-4 w-4 transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`} />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {tabs.find(tab => tab.id === activeTab)?.component}
      </div>
    </div>
  )
}
