"use client"

import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup } from "@/components/ui/select"
import { apiService } from '../api/apiService'
import { useState, useEffect } from 'react'

const chartConfig = {
  avgCycleTime: {
    label: "Average Cycle Time",
    color: "hsl(var(--chart-3))",
  },
}

export function PRCycleTimeChart({ refreshTrigger }) {
  const [chartData, setChartData] = useState([])
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState("30")
  const [prInfo, setPrInfo] = useState({
    totalPRs: 0,
    completedPRs: 0,
    activePRs: 0,
    avgCycleTime: 0
  })
  const [trend, setTrend] = useState({ direction: "stable" })

  const dateRangeOptions = [
    { value: "7", label: "Last 7 days" },
    { value: "30", label: "Last 30 days" },
    { value: "60", label: "Last 60 days" },
    { value: "90", label: "Last 90 days" }
  ]

  useEffect(() => {
    fetchPRData()
  }, [dateRange])

  useEffect(() => {
    if (refreshTrigger) {
      fetchPRData()
    }
  }, [refreshTrigger])

  const fetchPRData = async () => {
    try {
      setLoading(true)
      const response = await apiService.getPRCycleTime(parseInt(dateRange))
      
      setChartData(response.chartData || [])
      setPrInfo(response.prInfo || {})
      setTrend(response.trend || {})
    } catch (error) {
      console.error('Error fetching PR cycle time data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTrendIcon = () => {
    switch (trend.direction) {
      case 'decreasing': return <TrendingDown className="h-4 w-4 text-green-600" />
      case 'increasing': return <TrendingUp className="h-4 w-4 text-red-600" />
      default: return <Minus className="h-4 w-4 text-gray-600" />
    }
  }

  const getTrendText = () => {
    switch (trend.direction) {
      case 'decreasing': return 'Cycle time decreasing (good)'
      case 'increasing': return 'Cycle time increasing (needs attention)'
      default: return 'Cycle time stable'
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>PR Cycle Time</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading PR data...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>PR Cycle Time</CardTitle>
            <CardDescription>Average time from creation to completion</CardDescription>
          </div>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {dateRangeOptions.map((option) => (
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
              dataKey="weekLabel"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              label={{ value: 'Days', angle: -90, position: 'insideLeft' }}
            />
            <ChartTooltip
              cursor={false}
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload
                  return (
                    <div className="bg-background border rounded-lg p-3 shadow-lg">
                      <p className="font-medium">Week of {label}</p>
                      <p className="text-sm">
                        Avg Cycle Time: <span className="font-medium text-purple-600">{data.avgCycleTime} days</span>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {data.completedPRs}/{data.totalPRs} PRs completed
                      </p>
                    </div>
                  )
                }
                return null
              }}
            />
            <Line
              dataKey="avgCycleTime"
              type="monotone"
              stroke="hsl(var(--chart-3))"
              strokeWidth={3}
              dot={{ 
                fill: "hsl(var(--chart-3))", 
                strokeWidth: 2,
                stroke: "hsl(var(--background))",
                r: 4 
              }}
              activeDot={{ 
                r: 6,
                fill: "hsl(var(--chart-3))",
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
          {getTrendText()} • Avg: {prInfo.avgCycleTime} days
        </div>
        <div className="text-muted-foreground leading-none">
          Total PRs: {prInfo.totalPRs} • Completed: {prInfo.completedPRs} • Active: {prInfo.activePRs}
        </div>
      </CardFooter>
    </Card>
  )
}
