"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Target, TrendingUp, Calendar, Eye, ArrowRight, CheckCircle, Activity, Clock } from "lucide-react"
import { useUserActivities } from '@/hooks/useUserActivities'

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
  description?: string | null
  dueDate?: Date | null
  priority: 'low' | 'medium' | 'high'
  completed: boolean
  goalId: string
  createdAt: Date
  updatedAt: Date
}

interface OverviewTabProps {
  goals: Goal[]
  onViewAllActivity: () => void
}

export function OverviewTab({ goals, onViewAllActivity }: OverviewTabProps) {
  const { activities, loading: activitiesLoading } = useUserActivities()
  const activeGoals = goals.filter(g => g.status === 'active').slice(0, 3)
  const completedGoals = goals.filter(g => g.status === 'completed').length
  const totalGoals = goals.length

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'profile_updated':
        return <Calendar className="w-4 h-4 text-blue-600" />
      case 'goal_created':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'skill_progress':
        return <Clock className="w-4 h-4 text-purple-600" />
      case 'test_completed':
        return <CheckCircle className="w-4 h-4 text-orange-600" />
      default:
        return <Activity className="w-4 h-4 text-gray-600" />
    }
  }

  const getActivityTypeLabel = (type: string) => {
    switch (type) {
      case 'profile_updated':
        return 'Profile Update'
      case 'goal_created':
        return 'Goal Created'
      case 'skill_progress':
        return 'Skill Progress'
      case 'test_completed':
        return 'Test Completed'
      default:
        return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    }
  }

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date()
    const activityDate = new Date(timestamp)
    const diffInHours = Math.floor((now.getTime() - activityDate.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) {
      return 'Just now'
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`
    } else {
      const diffInDays = Math.floor(diffInHours / 24)
      return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`
    }
  }

  const recentActivities = activities.slice(0, 3)

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Featured Goals */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-4">
          <Target className="h-5 w-5 text-green-600" />
          <h2 className="text-lg font-semibold text-slate-800">Featured Goals</h2>
        </div>
        {activeGoals.length > 0 ? (
          <div className="space-y-3">
            {activeGoals.map((goal) => (
              <div key={goal.id} className="p-3 bg-slate-50 rounded border border-slate-200">
                <h3 className="font-medium text-slate-800 mb-1 text-sm sm:text-base">{goal.title}</h3>
                <p className="text-xs sm:text-sm text-slate-600 mb-2">{goal.description}</p>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-700 border border-green-200">
                    {goal.status}
                  </span>
                  <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-700 border border-blue-200">
                    {goal.category}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500 text-sm">No active goals yet. Create your first goal to get started!</p>
        )}
      </div>

      {/* Progress Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white rounded-lg border border-slate-200 p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <Target className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
            <div>
              <p className="text-xs sm:text-sm text-slate-600">Total Goals</p>
              <p className="text-xl sm:text-2xl font-bold text-slate-800">{totalGoals}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-slate-200 p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
            <div>
              <p className="text-xs sm:text-sm text-slate-600">Completed</p>
              <p className="text-xl sm:text-2xl font-bold text-slate-800">{completedGoals}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-slate-200 p-3 sm:p-4 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-2 sm:gap-3">
            <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
            <div>
              <p className="text-xs sm:text-sm text-slate-600">Success Rate</p>
              <p className="text-xl sm:text-2xl font-bold text-slate-800">
                {totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <Activity className="h-5 w-5 text-orange-600" />
            <h2 className="text-lg font-semibold text-slate-800">Recent Activity</h2>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onViewAllActivity}
            className="text-sm border-slate-200 text-slate-700 hover:bg-slate-50 w-full sm:w-auto"
          >
            View All
          </Button>
        </div>
        
        {activitiesLoading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600 mx-auto"></div>
            <p className="text-sm text-slate-500 mt-2">Loading activities...</p>
          </div>
        ) : recentActivities.length > 0 ? (
          <div className="space-y-3">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="p-3 bg-slate-50 rounded border border-slate-200">
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-slate-800 text-sm sm:text-base">{activity.title}</h3>
                      <Badge variant="secondary" className="text-xs">
                        {getActivityTypeLabel(activity.type)}
                      </Badge>
                      {!activity.isRead && (
                        <Badge variant="default" className="text-xs bg-blue-600">
                          New
                        </Badge>
                      )}
                    </div>
                    {activity.description && (
                      <p className="text-sm text-slate-600 mb-1">{activity.description}</p>
                    )}
                    <p className="text-xs text-slate-500">{formatTimestamp(activity.timestamp)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500 text-sm">No recent activity. Start using the app to see your progress!</p>
        )}
      </div>
    </div>
  )
}
