"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/hooks/use-session-simple'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Eye, EyeOff, Filter, Search, CheckCircle, Clock, Calendar } from 'lucide-react'
import { useUserActivities } from '@/hooks/useUserActivities'

interface UserActivity {
  id: string
  userId: string
  type: string
  title: string
  description?: string
  metadata?: string
  timestamp: Date
  isRead: boolean
  createdAt: Date
  updatedAt: Date
}

export default function ActivitiesPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const { activities, loading, error, fetchAllActivities, markAsRead, markAllAsRead } = useUserActivities()
  
  const [allActivities, setAllActivities] = useState<UserActivity[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalActivities, setTotalActivities] = useState(0)
  const [pageSize] = useState(20)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterRead, setFilterRead] = useState('all')

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      loadActivities()
    }
  }, [status, session?.user, currentPage])

  const loadActivities = async () => {
    try {
      const result = await fetchAllActivities(currentPage, pageSize)
      setAllActivities(result.activities)
      setTotalPages(result.totalPages)
      setTotalActivities(result.total)
    } catch (error) {
      console.error('Failed to load activities:', error)
    }
  }

  const handleMarkAsRead = async (activityId: string) => {
    try {
      await markAsRead(activityId)
      // Update local state
      setAllActivities(prev => prev.map(activity => 
        activity.id === activityId ? { ...activity, isRead: true } : activity
      ))
    } catch (error) {
      console.error('Failed to mark activity as read:', error)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead()
      // Update local state
      setAllActivities(prev => prev.map(activity => ({ ...activity, isRead: true })))
    } catch (error) {
      console.error('Failed to mark all activities as read:', error)
    }
  }

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
        return <Clock className="w-4 h-4 text-gray-600" />
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

  const filteredActivities = allActivities.filter(activity => {
    const matchesSearch = activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (activity.description && activity.description.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesType = filterType === 'all' || activity.type === filterType
    const matchesRead = filterRead === 'all' || 
                       (filterRead === 'read' && activity.isRead) || 
                       (filterRead === 'unread' && !activity.isRead)
    
    return matchesSearch && matchesType && matchesRead
  })

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading activities...</p>
        </div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    router.push('/auth/signin')
    return null
  }

  return (
    <div className="min-h-screen bg-slate-50 p-2 sm:p-4 md:p-8">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.back()}
                className="h-8 px-3"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Activity History</h1>
                <p className="text-sm sm:text-base text-slate-600">Track all your learning activities and progress</p>
              </div>
            </div>
            <Button
              onClick={handleMarkAllAsRead}
              variant="outline"
              size="sm"
              className="h-8 px-3"
            >
              <Eye className="w-4 h-4 mr-2" />
              Mark All Read
            </Button>
          </div>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Filters & Search</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Search activities..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Type</label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="profile_updated">Profile Updates</SelectItem>
                    <SelectItem value="goal_created">Goals</SelectItem>
                    <SelectItem value="skill_progress">Skills</SelectItem>
                    <SelectItem value="test_completed">Tests</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
                <Select value={filterRead} onValueChange={setFilterRead}>
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="unread">Unread</SelectItem>
                    <SelectItem value="read">Read</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-end">
                <Button
                  onClick={() => {
                    setSearchTerm('')
                    setFilterType('all')
                    setFilterRead('all')
                  }}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Activities List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                Activities ({filteredActivities.length} of {totalActivities})
              </CardTitle>
              <div className="text-sm text-slate-500">
                Page {currentPage} of {totalPages}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-slate-600">Loading activities...</p>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-red-600">Error: {error}</p>
                <Button onClick={loadActivities} variant="outline" className="mt-2">
                  Try Again
                </Button>
              </div>
            ) : filteredActivities.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-500">No activities found.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className={`p-4 rounded-lg border transition-all duration-200 ${
                      activity.isRead 
                        ? 'bg-slate-50 border-slate-200' 
                        : 'bg-white border-blue-200 shadow-sm'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="mt-1">
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className={`font-medium ${activity.isRead ? 'text-slate-700' : 'text-slate-800'}`}>
                              {activity.title}
                            </h3>
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
                            <p className="text-sm text-slate-600 mb-2">{activity.description}</p>
                          )}
                          <p className="text-xs text-slate-500">
                            {formatTimestamp(activity.timestamp)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        {!activity.isRead && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMarkAsRead(activity.id)}
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        )}
                        {activity.isRead && (
                          <div className="h-8 w-8 flex items-center justify-center text-slate-400">
                            <EyeOff className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i
                    if (page > totalPages) return null
                    
                    return (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className="h-8 w-8 p-0"
                      >
                        {page}
                      </Button>
                    )
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
