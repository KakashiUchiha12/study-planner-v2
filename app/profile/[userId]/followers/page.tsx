"use client"

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Users, MapPin, GraduationCap, Calendar } from 'lucide-react'

interface Follower {
  id: string
  name: string
  username: string
  image?: string
  fullName?: string
  bio?: string
  university?: string
  program?: string
  followedAt: string
}

export default function FollowersPage() {
  const params = useParams()
  const router = useRouter()
  const userId = params.userId as string
  
  const [followers, setFollowers] = useState<Follower[]>([])
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState('')

  useEffect(() => {
    if (userId) {
      fetchFollowers()
      fetchUserName()
    }
  }, [userId])

  const fetchFollowers = async () => {
    try {
      const response = await fetch(`/api/profile/${userId}/followers`)
      if (response.ok) {
        const data = await response.json()
        setFollowers(data.followers)
      }
    } catch (error) {
      console.error('Error fetching followers:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUserName = async () => {
    try {
      const response = await fetch(`/api/profile/${userId}`)
      if (response.ok) {
        const data = await response.json()
        setUserName(data.user.name)
      }
    } catch (error) {
      console.error('Error fetching user name:', error)
    }
  }

  const handleUserClick = (followerId: string) => {
    router.push(`/profile/${followerId}`)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffInDays === 0) return 'Today'
    if (diffInDays === 1) return 'Yesterday'
    if (diffInDays < 7) return `${diffInDays} days ago`
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="flex items-center gap-3 p-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="p-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              {userName}'s Followers
            </h1>
            <p className="text-sm text-gray-600">
              {followers.length} {followers.length === 1 ? 'follower' : 'followers'}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : followers.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Users className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No followers yet</h3>
              <p className="text-gray-500">This user doesn't have any followers.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {followers.map((follower) => (
              <Card
                key={follower.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleUserClick(follower.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={follower.image} alt={follower.name} />
                      <AvatarFallback>
                        {follower.name?.charAt(0)?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {follower.fullName || follower.name}
                        </h3>
                        {follower.username && (
                          <Badge variant="outline" className="text-xs">
                            @{follower.username}
                          </Badge>
                        )}
                      </div>
                      
                      {follower.bio && (
                        <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                          {follower.bio}
                        </p>
                      )}
                      
                      <div className="flex flex-col gap-1 text-xs text-gray-500">
                        {follower.university && (
                          <div className="flex items-center gap-1">
                            <GraduationCap className="h-3 w-3" />
                            <span className="truncate">{follower.university}</span>
                          </div>
                        )}
                        {follower.program && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate">{follower.program}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>Followed {formatDate(follower.followedAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
