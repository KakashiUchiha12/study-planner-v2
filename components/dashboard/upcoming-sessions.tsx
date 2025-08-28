import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, Plus } from "lucide-react"

export function UpcomingSessions() {
  const sessions = [
    {
      id: 1,
      title: "Mathematics Review",
      subject: "Mathematics",
      time: "Today, 3:00 PM",
      duration: "2 hours",
      type: "Study Session",
    },
    {
      id: 2,
      title: "Physics Lab Report",
      subject: "Physics",
      time: "Tomorrow, 10:00 AM",
      duration: "1 hour",
      type: "Assignment",
    },
    {
      id: 3,
      title: "Chemistry Test",
      subject: "Chemistry",
      time: "Friday, 9:00 AM",
      duration: "1.5 hours",
      type: "Test",
    },
  ]

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Upcoming Sessions</CardTitle>
            <CardDescription>Your scheduled study sessions and deadlines</CardDescription>
          </div>
          <Button size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sessions.map((session) => (
            <div key={session.id} className="flex items-center justify-between space-x-4">
              <div className="flex items-center space-x-3">
                <div className="rounded-full bg-primary/10 p-2">
                  <Calendar className="h-4 w-4 text-primary" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">{session.title}</p>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-xs">
                      {session.subject}
                    </Badge>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Clock className="mr-1 h-3 w-3" />
                      {session.duration}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">{session.time}</p>
                </div>
              </div>
              <Badge variant={session.type === "Test" ? "destructive" : "secondary"} className="text-xs">
                {session.type}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
