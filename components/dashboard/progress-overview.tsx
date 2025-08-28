import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { ChevronRight } from "lucide-react"

export function ProgressOverview() {
  const subjects = [
    {
      name: "Mathematics",
      progress: 85,
      chapters: "12/15",
      nextDeadline: "Quiz on Friday",
      color: "bg-primary",
    },
    {
      name: "Physics",
      progress: 72,
      chapters: "8/12",
      nextDeadline: "Lab report due Monday",
      color: "bg-accent",
    },
    {
      name: "Chemistry",
      progress: 90,
      chapters: "9/10",
      nextDeadline: "Final exam in 2 weeks",
      color: "bg-chart-2",
    },
    {
      name: "History",
      progress: 65,
      chapters: "6/10",
      nextDeadline: "Essay due next week",
      color: "bg-chart-1",
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subject Progress</CardTitle>
        <CardDescription>Track your progress across all subjects</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {subjects.map((subject) => (
            <div key={subject.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <h4 className="text-sm font-medium">{subject.name}</h4>
                  <Badge variant="outline" className="text-xs">
                    {subject.chapters} chapters
                  </Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">{subject.progress}%</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              <Progress value={subject.progress} className="h-2" />
              <p className="text-xs text-muted-foreground">{subject.nextDeadline}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
