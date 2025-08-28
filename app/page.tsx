import Link from "next/link"
import { Button } from "@/components/ui/button"
import { BookOpen, Target, TrendingUp, Clock } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 pb-32 pt-16 sm:pt-24 lg:px-8 lg:pt-32">
          <div className="mx-auto max-w-2xl gap-x-14 lg:mx-0 lg:flex lg:max-w-none lg:items-center">
            <div className="w-full max-w-xl lg:shrink-0 xl:max-w-2xl">
              <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
                Master Your Studies with <span className="text-primary">StudyPlanner</span>
              </h1>
              <p className="relative mt-6 text-lg leading-8 text-muted-foreground sm:max-w-md lg:max-w-none">
                Organize your academic journey with our comprehensive study planner. Track subjects, monitor progress,
                log study sessions, and analyze your performance to achieve academic excellence.
              </p>
              <div className="mt-10 flex items-center gap-x-6">
                <Link href="/auth/signup">
                  <Button size="lg" className="px-8">
                    Get Started Free
                  </Button>
                </Link>
                <Link href="/auth/login">
                  <Button variant="outline" size="lg">
                    Sign In
                  </Button>
                </Link>
              </div>
            </div>
            <div className="mt-14 flex justify-end gap-8 sm:-mt-44 sm:justify-start sm:pl-20 lg:mt-0 lg:pl-0">
              <div className="ml-auto w-44 flex-none space-y-8 pt-32 sm:ml-0 sm:pt-80 lg:order-last lg:pt-36 xl:order-none xl:pt-80">
                <div className="relative">
                  <img
                    src="/student-studying.png"
                    alt="Student studying"
                    className="aspect-[2/3] w-full rounded-xl bg-muted object-cover shadow-lg"
                  />
                </div>
              </div>
              <div className="mr-auto w-44 flex-none space-y-8 sm:mr-0 sm:pt-52 lg:pt-36">
                <div className="relative">
                  <img
                    src="/academic-progress-charts.png"
                    alt="Progress tracking"
                    className="aspect-[2/3] w-full rounded-xl bg-muted object-cover shadow-lg"
                  />
                </div>
                <div className="relative">
                  <img
                    src="/organized-study-materials.png"
                    alt="Study organization"
                    className="aspect-[2/3] w-full rounded-xl bg-muted object-cover shadow-lg"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-base font-semibold leading-7 text-primary">Everything you need</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Comprehensive Study Management
          </p>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            From subject organization to progress analytics, StudyPlanner provides all the tools you need to excel in
            your academic journey.
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-4">
            <div className="flex flex-col">
              <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-foreground">
                <BookOpen className="h-5 w-5 flex-none text-primary" />
                Subject Management
              </dt>
              <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-muted-foreground">
                <p className="flex-auto">
                  Organize all your subjects in one place. Add descriptions, study materials, and track your progress
                  through each course.
                </p>
              </dd>
            </div>
            <div className="flex flex-col">
              <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-foreground">
                <Target className="h-5 w-5 flex-none text-primary" />
                Syllabus Tracking
              </dt>
              <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-muted-foreground">
                <p className="flex-auto">
                  Break down your syllabus into manageable chapters and modules. Mark completed sections and visualize
                  your progress.
                </p>
              </dd>
            </div>
            <div className="flex flex-col">
              <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-foreground">
                <TrendingUp className="h-5 w-5 flex-none text-primary" />
                Performance Analytics
              </dt>
              <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-muted-foreground">
                <p className="flex-auto">
                  Track test scores, analyze performance trends, and identify areas for improvement with detailed charts
                  and reports.
                </p>
              </dd>
            </div>
            <div className="flex flex-col">
              <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-foreground">
                <Clock className="h-5 w-5 flex-none text-primary" />
                Study Sessions
              </dt>
              <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-muted-foreground">
                <p className="flex-auto">
                  Log study sessions, set goals, and track time spent on each subject. Build consistent study habits
                  with session reminders.
                </p>
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* CTA Section */}
      <div className="mx-auto mt-32 max-w-7xl px-6 sm:mt-40 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Ready to transform your study routine?
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-muted-foreground">
            Join thousands of students who have improved their academic performance with StudyPlanner.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link href="/auth/signup">
              <Button size="lg" className="px-8">
                Start Your Journey
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mx-auto mt-32 max-w-7xl px-6 lg:px-8">
        <div className="border-t border-border pt-16 pb-8">
          <p className="text-center text-sm leading-5 text-muted-foreground">
            &copy; 2024 StudyPlanner. Built with passion for student success.
          </p>
        </div>
      </footer>
    </div>
  )
}
