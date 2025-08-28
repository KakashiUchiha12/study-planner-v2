import { Button } from "@/components/ui/button"
import { BookOpen, FileText, Clock, BarChart3 } from "lucide-react"
import Link from "next/link"

export function QuickActions() {
  const actions = [
    {
      title: "Add Subject",
      description: "Create a new subject",
      icon: BookOpen,
      color: "bg-primary text-primary-foreground hover:bg-primary/90",
      href: "/subjects",
    },
    {
      title: "Log Study Session",
      description: "Record your study time",
      icon: Clock,
      color: "bg-accent text-accent-foreground hover:bg-accent/90",
      href: "/study-sessions",
    },
    {
      title: "Add Test Score",
      description: "Record test results",
      icon: FileText,
      color: "bg-chart-2 text-white hover:bg-chart-2/90",
      href: "/test-marks",
    },
    {
      title: "View Analytics",
      description: "Check your progress",
      icon: BarChart3,
      color: "bg-chart-1 text-white hover:bg-chart-1/90",
      href: "/analytics",
    },
  ]

  return (
    <div className="mb-8">
      <h2 className="mb-4 text-lg font-semibold text-foreground">Quick Actions</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {actions.map((action) => (
          <Link key={action.title} href={action.href}>
            <Button variant="outline" className="h-auto flex-col space-y-2 p-6 hover:bg-muted/50 bg-transparent w-full">
              <action.icon className="h-8 w-8 text-primary" />
              <div className="text-center">
                <div className="font-medium">{action.title}</div>
                <div className="text-xs text-muted-foreground">{action.description}</div>
              </div>
            </Button>
          </Link>
        ))}
      </div>
    </div>
  )
}
