"use client"

import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { apiService } from '../api/apiService'
import { useState, useEffect } from 'react'

const chartConfig = {
  successRate: {
    label: "Success Rate",
    color: "hsl(var(--chart-1))",
  },
}

export function BuildSuccessRateTrend({ refreshTrigger }) {
  const [chartData, setChartData] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    current7Day: 0,
    overall30Day: 0,
    worstDay: { date: '', rate: 0 },
    totalBuilds: 0,
    trend: 'stable'
  })

  useEffect(() => {
    fetchBuildData()
  }, [])

  useEffect(() => {
    if (refreshTrigger) {
      fetchBuildData()
    }
  }, [refreshTrigger])

  const fetchBuildData = async () => {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      const now = new Date().toISOString()
      
      const response = await apiService.getRecentBuilds(200, 'all', {
        minTime: thirtyDaysAgo,
        maxTime: now
      })

      const processedData = processBuildsForChart(response.value || [])
      setChartData(processedData)
      calculateStats(processedData)
    } catch (error) {
      console.error('Error fetching build data:', error)
    } finally {
      setLoading(false)
    }
  }

  const processBuildsForChart = (builds) => {
    const dailyStats = builds.reduce((acc, build) => {
      const date = new Date(build.startTime).toISOString().split('T')[0]
      if (!acc[date]) acc[date] = { total: 0, succeeded: 0 }
      
      acc[date].total++
      if (build.result === 'succeeded') acc[date].succeeded++
      
      return acc
    }, {})

    return Object.entries(dailyStats)
      .map(([date, stats]) => ({
        date,
        successRate: Math.round((stats.succeeded / stats.total) * 100),
        totalBuilds: stats.total,
        successfulBuilds: stats.succeeded,
        displayDate: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date))
  }

  const calculateStats = (data) => {
    if (data.length === 0) return

    const last7Days = data.slice(-7)
    const current7Day = last7Days.reduce((sum, day) => sum + day.successRate, 0) / last7Days.length
    const overall30Day = data.reduce((sum, day) => sum + day.successRate, 0) / data.length
    const totalBuilds = data.reduce((sum, day) => sum + day.totalBuilds, 0)
    
    const worstDay = data.reduce((worst, day) => 
      day.successRate < worst.rate ? { date: day.displayDate, rate: day.successRate } : worst,
      { date: '', rate: 100 }
    )

    const trend = current7Day > overall30Day + 5 ? 'up' : 
                  current7Day < overall30Day - 5 ? 'down' : 'stable'

    setStats({ current7Day, overall30Day, worstDay, totalBuilds, trend })
  }

  const getLineColor = (rate) => {
    if (rate >= 90) return "#22c55e" // Green
    if (rate >= 70) return "#f59e0b" // Yellow
    return "#ef4444" // Red
  }

  const getTrendIcon = () => {
    switch (stats.trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'down': return <TrendingDown className="h-4 w-4 text-red-600" />
      default: return <Minus className="h-4 w-4 text-gray-600" />
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Build Success Rate Trend</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading chart data...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Build Success Rate Trend</CardTitle>
        <CardDescription>Last 30 days pipeline health</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
          <LineChart data={chartData} margin={{ top: 20, left: 12, right: 12 }}>
            <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="3 3" />
            <XAxis
              dataKey="displayDate"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
            />
            <YAxis
              domain={[0, 100]}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}%`}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
            />
            <ChartTooltip
              cursor={false}
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload
                  return (
                    <div className="bg-background border rounded-lg p-3 shadow-lg">
                      <p className="font-medium">{label}</p>
                      <p className="text-sm">
                        Success Rate: <span className="font-medium">{data.successRate}%</span>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {data.successfulBuilds}/{data.totalBuilds} builds succeeded
                      </p>
                    </div>
                  )
                }
                return null
              }}
            />
            <Line
              dataKey="successRate"
              type="monotone"
              stroke="hsl(var(--chart-1))"
              strokeWidth={3}
              dot={{ 
                fill: "hsl(var(--chart-1))", 
                strokeWidth: 2,
                stroke: "hsl(var(--background))",
                r: 5 
              }}
              activeDot={{ 
                r: 7,
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
          7-day avg: {stats.current7Day.toFixed(1)}% vs 30-day avg: {stats.overall30Day.toFixed(1)}%
        </div>
        <div className="text-muted-foreground leading-none">
          Worst day: {stats.worstDay.date} ({stats.worstDay.rate}%) • Total builds: {stats.totalBuilds}
        </div>
      </CardFooter>
    </Card>
  )
}
