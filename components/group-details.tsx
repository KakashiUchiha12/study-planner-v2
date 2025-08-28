"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { X, Calendar, Users, MessageSquare, FileText } from "lucide-react"
import { format } from "date-fns"

interface StudyGroup {
  id: string
  name: string
  description: string
  subject: string
  university: string
  avatar: string
  memberCount: number
  maxMembers: number
  isPublic: boolean
  tags: string[]
  createdAt: string
  lastActivity: string
  owner: {
    id: string
    name: string
    avatar: string
  }
  members: string[]
  isMember: boolean
  notifications: boolean
  rules: string[]
  upcomingEvents: {
    id: string
    title: string
    date: string
    description: string
  }[]
  recentPosts: {
    id: string
    content: string
    author: string
    timestamp: string
  }[]
}

interface GroupDetailsProps {
  group: StudyGroup
  onClose: () => void
}

export default function GroupDetails({ group, onClose }: GroupDetailsProps) {
  const [activeTab, setActiveTab] = useState("overview")
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto m-4">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={group.avatar} alt={group.name} />
                <AvatarFallback className="text-2xl">{group.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-2xl font-bold">{group.name}</h2>
                <p className="text-muted-foreground">{group.subject} • {group.university}</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-6 w-6" />
            </Button>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="members">Members</TabsTrigger>
              <TabsTrigger value="events">Events</TabsTrigger>
              <TabsTrigger value="posts">Posts</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Group Information</h3>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium">Subject</Label>
                      <p className="text-sm text-muted-foreground">{group.subject}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">University</Label>
                      <p className="text-sm text-muted-foreground">{group.university}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Created</Label>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(group.createdAt), "MMMM dd, yyyy")}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Last Activity</Label>
                      <p className="text-sm text-muted-foreground">{group.lastActivity}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Privacy</Label>
                      <Badge variant={group.isPublic ? "default" : "secondary"}>
                        {group.isPublic ? "Public" : "Private"}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-3">Description</h3>
                  <p className="text-sm text-muted-foreground">{group.description}</p>
                  
                  <h3 className="text-lg font-semibold mb-3 mt-6">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {group.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              
              {group.rules && group.rules.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Group Rules</h3>
                  <ul className="space-y-2">
                    {group.rules.map((rule, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <span className="text-primary mt-1">•</span>
                        <span className="text-sm text-muted-foreground">{rule}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </TabsContent>

            <TabsContent value="members" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Members ({group.memberCount}/{group.maxMembers})</h3>
                <Badge variant={group.isPublic ? "default" : "secondary"}>
                  {group.isPublic ? "Public" : "Private"}
                </Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={group.owner.avatar} alt={group.owner.name} />
                    <AvatarFallback>{group.owner.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{group.owner.name}</p>
                    <p className="text-xs text-muted-foreground">Owner</p>
                  </div>
                </div>
                
                {group.members.slice(0, 8).map((memberId, index) => (
                  <div key={memberId} className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>U{index + 1}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">User {index + 1}</p>
                      <p className="text-xs text-muted-foreground">Member</p>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="events" className="space-y-4">
              <h3 className="text-lg font-semibold">Upcoming Events</h3>
              {group.upcomingEvents && group.upcomingEvents.length > 0 ? (
                <div className="space-y-3">
                  {group.upcomingEvents.map((event) => (
                    <Card key={event.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium">{event.title}</h4>
                            <p className="text-sm text-muted-foreground">{event.description}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {format(new Date(event.date), "MMMM dd, yyyy 'at' HH:mm")}
                            </p>
                          </div>
                          <Button size="sm" variant="outline">
                            Join Event
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">No upcoming events scheduled.</p>
              )}
            </TabsContent>

            <TabsContent value="posts" className="space-y-4">
              <h3 className="text-lg font-semibold">Recent Posts</h3>
              {group.recentPosts && group.recentPosts.length > 0 ? (
                <div className="space-y-3">
                  {group.recentPosts.map((post) => (
                    <Card key={post.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>{post.author.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="font-medium text-sm">{post.author}</span>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(post.timestamp), "MMM dd, HH:mm")}
                              </span>
                            </div>
                            <p className="text-sm">{post.content}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">No recent posts in this group.</p>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
} 