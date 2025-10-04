"use client"

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Users, MapPin, GraduationCap, Calendar } from 'lucide-react'
import { useRouter } from 'next/navigation'

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

interface FollowersDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
  userName: string
}

export function FollowersDialog({ open, onOpenChange, userId, userName }: FollowersDialogProps) {
  const [followers, setFollowers] = useState<Follower[]>([])
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (open && userId) {
      fetchFollowers()
    }
  }, [open, userId])

  const fetchFollowers = async () => {
    setLoading(true)
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

  const handleUserClick = (followerId: string) => {
    onOpenChange(false)
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {userName}'s Followers
          </DialogTitle>
          <DialogDescription>
            {followers.length} {followers.length === 1 ? 'follower' : 'followers'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : followers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No followers yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {followers.map((follower) => (
                <div
                  key={follower.id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleUserClick(follower.id)}
                >
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
                    
                    <div className="flex items-center gap-4 text-xs text-gray-500">
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
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
