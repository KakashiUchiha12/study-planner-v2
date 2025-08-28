"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Users, BookOpen, Clock, Target } from "lucide-react";
import { memo, useMemo } from "react";

interface DashboardStatsProps {
  totalSubjects: number;
  totalSessions: number;
  totalHours: number;
  averageScore: number;
  completedTasks: number;
  totalTasks: number;
}

const DashboardStats = memo(({
  totalSubjects,
  totalSessions,
  totalHours,
  averageScore,
  completedTasks,
  totalTasks
}: DashboardStatsProps) => {
  const stats = useMemo(() => [
    {
      title: "Total Subjects",
      value: totalSubjects,
      icon: BookOpen,
      description: "Active subjects",
      trend: "up",
      change: "+2 this week"
    },
    {
      title: "Study Sessions",
      value: totalSessions,
      icon: Clock,
      description: "Total sessions",
      trend: "up",
      change: "+5 this week"
    },
    {
      title: "Study Hours",
      value: `${totalHours}h`,
      icon: Target,
      description: "Total time",
      trend: "up",
      change: "+12h this week"
    },
    {
      title: "Average Score",
      value: `${averageScore}%`,
      icon: TrendingUp,
      description: "Test performance",
      trend: averageScore >= 80 ? "up" : "down",
      change: averageScore >= 80 ? "+5% this week" : "-2% this week"
    },
    {
      title: "Task Completion",
      value: `${Math.round((completedTasks / totalTasks) * 100)}%`,
      icon: Users,
      description: "Progress rate",
      trend: (completedTasks / totalTasks) >= 0.7 ? "up" : "down",
      change: (completedTasks / totalTasks) >= 0.7 ? "On track" : "Behind schedule"
    }
  ], [totalSubjects, totalSessions, totalHours, averageScore, completedTasks, totalTasks]);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {stats.map((stat, index) => (
        <Card key={index} className="hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">{stat.description}</p>
            <div className="flex items-center text-xs mt-2">
              {stat.trend === "up" ? (
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
              )}
              <span className={stat.trend === "up" ? "text-green-600" : "text-red-600"}>
                {stat.change}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
});

DashboardStats.displayName = "DashboardStats";

export default DashboardStats;
