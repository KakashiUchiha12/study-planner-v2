"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Target, 
  Calendar, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  Activity,
  Eye,
  BarChart3
} from "lucide-react"
import type { GoalCard } from "./goals-tab"

interface OverviewTabProps {
  goals: GoalCard[]
  onViewAllActivity: () => void
}

export function OverviewTab({ goals, onViewAllActivity }: OverviewTabProps) {
  // Calculate goal statistics
  const totalGoals = goals.length
  const activeGoals = goals.filter(goal => goal.status === 'active').length
  const completedGoals = goals.filter(goal => goal.status === 'completed').length
  const completionRate = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0

  // Calculate task statistics
  const totalTasks = goals.reduce((sum, goal) => sum + goal.tasks.length, 0)
  const completedTasks = goals.reduce((sum, goal) => 
    sum + goal.tasks.filter(task => task.completed).length, 0
  )
  const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  // Get recent goals (last 5)
  const recentGoals = goals
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)

  // Get upcoming deadlines (goals with target dates in the next 30 days)
  const upcomingDeadlines = goals
    .filter(goal => {
      if (!goal.targetDate || goal.status === 'completed') return false
      const targetDate = new Date(goal.targetDate)
      const now = new Date()
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
      return targetDate <= thirtyDaysFromNow
    })
    .sort((a, b) => new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime())
    .slice(0, 3)

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Goals</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalGoals}</div>
            <p className="text-xs text-muted-foreground">
              {activeGoals} active, {completedGoals} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Goal Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completionRate}%</div>
            <Progress value={completionRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTasks}</div>
            <p className="text-xs text-muted-foreground">
              {completedTasks} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Task Progress</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{taskCompletionRate}%</div>
            <Progress value={taskCompletionRate} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Recent Goals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Goals
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentGoals.length > 0 ? (
            <div className="space-y-3">
              {recentGoals.map((goal) => (
                <div key={goal.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{goal.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      {goal.description}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge 
                        variant={goal.status === 'completed' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {goal.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {goal.tasks.length} tasks
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">
                      {new Date(goal.createdAt).toLocaleDateString()}
                    </div>
                    {goal.targetDate && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Due: {new Date(goal.targetDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No goals created yet</p>
              <p className="text-sm">Create your first goal to get started!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upcoming Deadlines */}
      {upcomingDeadlines.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Upcoming Deadlines
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingDeadlines.map((goal) => {
                const daysUntilDeadline = Math.ceil(
                  (new Date(goal.targetDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                )
                
                return (
                  <div key={goal.id} className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{goal.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        {goal.description}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-orange-600 dark:text-orange-400">
                        {daysUntilDeadline === 0 ? 'Today' : 
                         daysUntilDeadline === 1 ? 'Tomorrow' : 
                         `${daysUntilDeadline} days`}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(goal.targetDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button 
              variant="outline" 
              onClick={onViewAllActivity}
              className="flex items-center gap-2"
            >
              <Activity className="h-4 w-4" />
              View All Activity
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/goals'}
              className="flex items-center gap-2"
            >
              <Target className="h-4 w-4" />
              Manage Goals
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/analytics'}
              className="flex items-center gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              View Analytics
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
