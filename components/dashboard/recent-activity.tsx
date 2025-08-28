import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BookOpen, FileText, Clock, TrendingUp } from "lucide-react"

export function RecentActivity() {
  const activities = [
    {
      id: 1,
      type: "study",
      title: "Completed Chapter 5: Calculus",
      subject: "Mathematics",
      time: "2 hours ago",
      icon: BookOpen,
      color: "bg-primary/10 text-primary",
    },
    {
      id: 2,
      type: "test",
      title: "Physics Quiz - Scored 92%",
      subject: "Physics",
      time: "1 day ago",
      icon: TrendingUp,
      color: "bg-accent/10 text-accent",
    },
    {
      id: 3,
      type: "session",
      title: "Study Session: Organic Chemistry",
      subject: "Chemistry",
      time: "2 days ago",
      icon: Clock,
      color: "bg-chart-2/10 text-chart-2",
    },
    {
      id: 4,
      type: "assignment",
      title: "Submitted Essay: World War II",
      subject: "History",
      time: "3 days ago",
      icon: FileText,
      color: "bg-chart-1/10 text-chart-1",
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Your latest study activities and achievements</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-center space-x-4">
              <div className={`rounded-full p-2 ${activity.color}`}>
                <activity.icon className="h-4 w-4" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium leading-none">{activity.title}</p>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className="text-xs">
                    {activity.subject}
                  </Badge>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
