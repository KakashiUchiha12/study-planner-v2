"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Target, TrendingUp, Calendar, Eye, ArrowRight } from "lucide-react"

interface Goal {
  id: string
  title: string
  description: string
  category: string
  status: string
  targetDate?: Date
  tasks: GoalTask[]
}

interface GoalTask {
  id: string
  title: string
  priority: string
  dueDate?: Date
  completed: boolean
}

interface OverviewTabProps {
  goals: Goal[]
  onViewAllActivity: () => void
}

export function OverviewTab({ goals, onViewAllActivity }: OverviewTabProps) {
  // Calculate progress for featured goals
  const calculateProgress = (goal: Goal): number => {
    if (goal.tasks.length === 0) return 0
    const completedTasks = goal.tasks.filter(task => task.completed).length
    return Math.round((completedTasks / goal.tasks.length) * 100)
  }

  // Get featured goals (active goals with highest priority)
  const featuredGoals = goals
    .filter(goal => goal.status === 'active')
    .sort((a, b) => {
      const priorityA = a.tasks.filter(t => t.priority === 'high').length
      const priorityB = b.tasks.filter(t => t.priority === 'high').length
      return priorityB - priorityA
    })
    .slice(0, 3)

  // Get recent activity (last 5 goal updates)
  const recentActivity = goals
    .flatMap(goal => goal.tasks.map(task => ({
      type: 'task',
      goalTitle: goal.title,
      taskTitle: task.title,
      completed: task.completed,
      date: task.dueDate || new Date()
    })))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5)

  // Calculate this month's progress
  const thisMonth = new Date()
  const thisMonthStart = new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 1)
  const thisMonthEnd = new Date(thisMonth.getFullYear(), thisMonth.getMonth() + 1, 0)

  const goalsCompletedThisMonth = goals.filter(goal => 
    goal.status === 'completed' && 
    goal.targetDate && 
    new Date(goal.targetDate) >= thisMonthStart && 
    new Date(goal.targetDate) <= thisMonthEnd
  ).length

  const skillsImprovedThisMonth = 0 // TODO: Implement when skills are added
  const documentsAddedThisMonth = 0 // TODO: Implement when documents are added

  return (
    <div className="space-y-6">
      {/* Featured Goals */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Target className="h-5 w-5 text-blue-600" />
            Featured Goals
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {featuredGoals.length > 0 ? (
            featuredGoals.map((goal) => {
              const progress = calculateProgress(goal)
              return (
                <div key={goal.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-slate-800">{goal.title}</h3>
                    <Badge variant="secondary" className="text-xs">
                      {progress}%
                    </Badge>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-sm text-slate-600">{goal.description}</p>
                </div>
              )
            })
          ) : (
            <p className="text-slate-500 text-center py-4">No active goals yet. Start by adding some goals!</p>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Recent Activity
            </CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onViewAllActivity}
              className="text-xs h-7 px-2"
            >
              View All Activity
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {recentActivity.length > 0 ? (
            recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center gap-3 text-sm">
                <div className={`w-2 h-2 rounded-full ${activity.completed ? 'bg-green-500' : 'bg-blue-500'}`} />
                <span className="text-slate-700">
                  {activity.completed ? 'Completed' : 'Updated'}: {activity.goalTitle}
                </span>
                <span className="text-slate-500 text-xs">
                  {new Date(activity.date).toLocaleDateString()}
                </span>
              </div>
            ))
          ) : (
            <p className="text-slate-500 text-center py-4">No recent activity</p>
          )}
        </CardContent>
      </Card>

      {/* This Month's Progress */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5 text-purple-600" />
            This Month's Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{goalsCompletedThisMonth}</div>
              <div className="text-xs text-slate-600">Goals Completed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{skillsImprovedThisMonth}</div>
              <div className="text-xs text-slate-600">Skills Improved</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">{documentsAddedThisMonth}</div>
              <div className="text-xs text-slate-600">Documents Added</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
