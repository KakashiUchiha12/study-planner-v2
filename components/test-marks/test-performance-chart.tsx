"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, BarChart, Bar } from "recharts"

interface TestMark {
  id: string
  testName: string
  subjectName: string
  date: string
  percentage: number
  testType: string
}

interface TestPerformanceChartProps {
  testMarks: TestMark[]
}

export function TestPerformanceChart({ testMarks }: TestPerformanceChartProps) {
  // Prepare data for line chart (chronological performance)
  const lineChartData = testMarks
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((test, index) => ({
      test: `Test ${index + 1}`,
      testName: test.testName,
      percentage: test.percentage,
      subject: test.subjectName,
      date: test.date,
    }))

  // Prepare data for bar chart (performance by subject)
  const subjectPerformance = testMarks.reduce(
    (acc, test) => {
      if (!acc[test.subjectName]) {
        acc[test.subjectName] = { total: 0, count: 0, tests: [] }
      }
      acc[test.subjectName].total += test.percentage
      acc[test.subjectName].count += 1
      acc[test.subjectName].tests.push(test)
      return acc
    },
    {} as Record<string, { total: number; count: number; tests: TestMark[] }>,
  )

  const barChartData = Object.entries(subjectPerformance).map(([subject, data]) => ({
    subject,
    average: Math.round(data.total / data.count),
    testCount: data.count,
  }))

  const chartConfig = {
    percentage: {
      label: "Score (%)",
      color: "hsl(var(--primary))",
    },
    average: {
      label: "Average (%)",
      color: "hsl(var(--accent))",
    },
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Performance Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Trend</CardTitle>
          <CardDescription>Your test scores over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineChartData}>
                <XAxis dataKey="test" tick={{ fontSize: 12 }} interval="preserveStartEnd" />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                <ChartTooltip
                  content={<ChartTooltipContent />}
                  formatter={(value, name, props) => [`${value}%`, "Score"]}
                  labelFormatter={(label, payload) => {
                    if (payload && payload[0]) {
                      const data = payload[0].payload
                      return `${data.testName} (${new Date(data.date).toLocaleDateString()})`
                    }
                    return label
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="percentage"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: "hsl(var(--primary))", strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Subject Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Subject Performance</CardTitle>
          <CardDescription>Average scores by subject</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData}>
                <XAxis
                  dataKey="subject"
                  tick={{ fontSize: 12 }}
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                <ChartTooltip
                  content={<ChartTooltipContent />}
                  formatter={(value, name, props) => [`${value}%`, "Average Score"]}
                  labelFormatter={(label, payload) => {
                    if (payload && payload[0]) {
                      const data = payload[0].payload
                      return `${label} (${data.testCount} tests)`
                    }
                    return label
                  }}
                />
                <Bar dataKey="average" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
