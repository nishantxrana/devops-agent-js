"use client"

import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup } from "@/components/ui/select"
import { apiService } from '../api/apiService'
import { useState, useEffect } from 'react'

const chartConfig = {
  remaining: {
    label: "Remaining Work",
    color: "hsl(var(--chart-1))",
  },
  ideal: {
    label: "Ideal Burndown", 
    color: "hsl(var(--chart-2))",
  },
}

export function SprintBurndownChart({ refreshTrigger }) {
  const [chartData, setChartData] = useState([])
  const [loading, setLoading] = useState(true)
  const [sprintDays, setSprintDays] = useState("14")
  const [sprintInfo, setSprintInfo] = useState({
    name: "Current Sprint",
    totalStoryPoints: 0,
    completedWorkItems: 0,
    totalWorkItems: 0
  })
  const [velocity, setVelocity] = useState({ average: 0, trend: "on-track" })

  const sprintOptions = [
    { value: "7", label: "1 week sprint" },
    { value: "14", label: "2 week sprint" },
    { value: "21", label: "3 week sprint" }
  ]

  useEffect(() => {
    fetchSprintData()
  }, [sprintDays])

  useEffect(() => {
    if (refreshTrigger) {
      fetchSprintData()
    }
  }, [refreshTrigger])

  const fetchSprintData = async () => {
    try {
      setLoading(true)
      const response = await apiService.getSprintBurndown(parseInt(sprintDays))
      
      setChartData(response.burndownData || [])
      setSprintInfo(response.sprintInfo || {})
      setVelocity(response.velocity || {})
    } catch (error) {
      console.error('Error fetching sprint burndown data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTrendIcon = () => {
    switch (velocity.trend) {
      case 'on-track': return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'behind': return <TrendingDown className="h-4 w-4 text-red-600" />
      default: return <Minus className="h-4 w-4 text-gray-600" />
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sprint Burndown Chart</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading sprint data...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Sprint Burndown Chart</CardTitle>
            <CardDescription>{sprintInfo.name} progress tracking</CardDescription>
          </div>
          <Select value={sprintDays} onValueChange={setSprintDays}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {sprintOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
          <LineChart data={chartData} margin={{ top: 20, left: 12, right: 12 }}>
            <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              label={{ value: 'Story Points', angle: -90, position: 'insideLeft' }}
            />
            <ChartTooltip
              cursor={false}
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload
                  return (
                    <div className="bg-background border rounded-lg p-3 shadow-lg">
                      <p className="font-medium">{new Date(label).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                      <p className="text-sm">
                        Remaining: <span className="font-medium text-blue-600">{data.remaining} points</span>
                      </p>
                      <p className="text-sm">
                        Ideal: <span className="font-medium text-gray-600">{data.ideal} points</span>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Completed: {data.completed} points
                      </p>
                    </div>
                  )
                }
                return null
              }}
            />
            {/* Ideal burndown line */}
            <Line
              dataKey="ideal"
              type="monotone"
              stroke="hsl(var(--chart-2))"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ fill: "hsl(var(--chart-2))", r: 3 }}
              activeDot={{ r: 5 }}
            />
            {/* Actual burndown line */}
            <Line
              dataKey="remaining"
              type="monotone"
              stroke="hsl(var(--chart-1))"
              strokeWidth={3}
              dot={{ 
                fill: "hsl(var(--chart-1))", 
                strokeWidth: 2,
                stroke: "hsl(var(--background))",
                r: 4 
              }}
              activeDot={{ 
                r: 6,
                fill: "hsl(var(--chart-1))",
                stroke: "hsl(var(--background))",
                strokeWidth: 2
              }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 leading-none font-medium items-center">
          {getTrendIcon()}
          Sprint Status: {velocity.trend} • Velocity: {velocity.average} points/day
        </div>
        <div className="text-muted-foreground leading-none">
          Progress: {sprintInfo.completedWorkItems}/{sprintInfo.totalWorkItems} items • {sprintInfo.totalStoryPoints} total points
        </div>
      </CardFooter>
    </Card>
  )
}
