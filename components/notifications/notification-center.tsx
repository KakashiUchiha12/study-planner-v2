"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Bell, Check, X, ExternalLink } from "lucide-react"
import { notificationManager, type StudyNotification } from "@/lib/notifications"
import { format } from "date-fns"
import Link from "next/link"

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<StudyNotification[]>([])
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const unsubscribe = notificationManager.subscribe(setNotifications)
    return unsubscribe
  }, [])

  const unreadCount = notifications.filter(n => !n.read).length

  const handleMarkAsRead = (id: string) => {
    notificationManager.markAsRead(id)
  }

  const handleMarkAllAsRead = () => {
    notificationManager.markAllAsRead()
  }

  const handleRemove = (id: string) => {
    notificationManager.removeNotification(id)
  }

  const getNotificationIcon = (type: StudyNotification["type"]) => {
    switch (type) {
      case "reminder": return "⏰"
      case "achievement": return "🎉"
      case "deadline": return "⚠️"
      case "goal": return "🎯"
      default: return "📚"
    }
  }

  const getNotificationColor = (type: StudyNotification["type"]) => {
    switch (type) {
      case "reminder": return "border-blue-200 bg-blue-50 dark:bg-blue-950/20"
      case "achievement": return "border-green-200 bg-green-50 dark:bg-green-950/20"
      case "deadline": return "border-red-200 bg-red-50 dark:bg-red-950/20"
      case "goal": return "border-purple-200 bg-purple-50 dark:bg-purple-950/20"
      default: return "border-gray-200 bg-gray-50 dark:bg-gray-950/20"
    }
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-80 p-0" align="end">
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Notifications</CardTitle>
              {unreadCount > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleMarkAllAsRead}
                  className="text-xs"
                >
                  Mark all read
                </Button>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            <ScrollArea className="h-96">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No notifications yet</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 border-l-4 ${getNotificationColor(notification.type)} ${
                        !notification.read ? "bg-opacity-100" : "bg-opacity-50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                            <h4 className={`text-sm font-medium ${!notification.read ? "text-foreground" : "text-muted-foreground"}`}>
                              {notification.title}
                            </h4>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-primary rounded-full" />
                            )}
                          </div>
                          <p className={`text-sm ${!notification.read ? "text-foreground" : "text-muted-foreground"}`}>
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(notification.timestamp, "MMM dd, HH:mm")}
                          </p>
                          {notification.actionUrl && (
                            <Link href={notification.actionUrl}>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="mt-2 h-6 px-2 text-xs"
                                onClick={() => setIsOpen(false)}
                              >
                                View <ExternalLink className="h-3 w-3 ml-1" />
                              </Button>
                            </Link>
                          )}
                        </div>
                        
                        <div className="flex flex-col gap-1">
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMarkAsRead(notification.id)}
                              className="h-6 w-6 p-0"
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemove(notification.id)}
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  )
}
