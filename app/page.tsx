import Link from "next/link"
import { Button } from "@/components/ui/button"
import { BookOpen, Target, TrendingUp, Clock, CheckCircle, Users, Star, ArrowRight, Play, ExternalLink } from "lucide-react"

export default function HomePage() {
  console.log('🏠 HomePage: Rendering home page component');
  
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
              <div className="mt-10 flex flex-col sm:flex-row items-center gap-4 sm:gap-x-6">
                <Link href="/auth/signup">
                  <Button size="lg" className="px-8 w-full sm:w-auto">
                    Get Started Free
                  </Button>
                </Link>
                <Link href="/auth/login">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
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

      {/* Interactive Demo Section */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-base font-semibold leading-7 text-primary">Try it out</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Interactive Demo
          </p>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            Experience StudyPlanner's features firsthand with our interactive demo.
          </p>
        </div>
        
        {/* Demo Cards */}
        <div className="mx-auto mt-16 max-w-4xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Task Management Demo */}
            <div className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold">Task Management</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Complete assignments</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span>Study for exams</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span>Review notes</span>
                </div>
              </div>
              <Button variant="outline" size="sm" className="w-full mt-4">
                <Play className="h-4 w-4 mr-2" />
                Try Demo
              </Button>
            </div>

            {/* Progress Tracking Demo */}
            <div className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold">Progress Tracking</h3>
              </div>
              <div className="space-y-3">
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full" style={{ width: '75%' }}></div>
                </div>
                <div className="text-sm text-muted-foreground">75% Complete</div>
                <div className="text-sm">Mathematics</div>
              </div>
              <Button variant="outline" size="sm" className="w-full mt-4">
                <Play className="h-4 w-4 mr-2" />
                Try Demo
              </Button>
            </div>

            {/* Study Timer Demo */}
            <div className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold">Study Timer</h3>
              </div>
              <div className="space-y-3">
                <div className="text-2xl font-mono text-primary">25:00</div>
                <div className="text-sm text-muted-foreground">Pomodoro Session</div>
                <div className="text-sm">Focus Mode</div>
              </div>
              <Button variant="outline" size="sm" className="w-full mt-4">
                <Play className="h-4 w-4 mr-2" />
                Try Demo
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8 mt-32">
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

      {/* Testimonials Section */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8 mt-32">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-base font-semibold leading-7 text-primary">Student Success</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            What Students Say
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-muted-foreground mb-4">
                "StudyPlanner helped me organize my medical school studies. The progress tracking keeps me motivated!"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="font-semibold">Sarah M.</div>
                  <div className="text-sm text-muted-foreground">Medical Student</div>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-muted-foreground mb-4">
                "The study timer and session tracking features are game-changers for my productivity."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="font-semibold">Alex K.</div>
                  <div className="text-sm text-muted-foreground">Engineering Student</div>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-muted-foreground mb-4">
                "Finally, a study planner that actually helps me stay on track with my goals!"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="font-semibold">Maria L.</div>
                  <div className="text-sm text-muted-foreground">Law Student</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Other Projects Section */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8 mt-32">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-base font-semibold leading-7 text-primary">More from us</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Our Other Projects
          </p>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            Explore our other innovative solutions for students and professionals.
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <div className="bg-card border border-border rounded-xl p-8 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-white border border-gray-200 rounded-lg">
                  {/* PreDoctor.pk Logo */}
                  <img 
                    src="/images/logos/predoct.pk logo.jpg"
                    alt="PreDoctor.pk Logo"
                    className="w-16 h-16 object-contain"
                  />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">PreDoctor.pk</h3>
                  <p className="text-muted-foreground">Medical education platform</p>
                </div>
              </div>
              <p className="text-muted-foreground mb-6">
                Comprehensive resources for medical students preparing for their professional journey.
              </p>
              <a 
                href="https://predoctr.pk" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-primary hover:underline"
              >
                Visit Website <ExternalLink className="h-4 w-4" />
              </a>
            </div>

            <div className="bg-card border border-border rounded-xl p-8 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-white border border-gray-200 rounded-lg">
                  {/* FreeMDCAT Logo */}
                  <img 
                    src="/images/logos/freemdcat.com logo.webp"
                    alt="FreeMDCAT Logo"
                    className="w-16 h-16 object-contain"
                  />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">FreeMDCAT</h3>
                  <p className="text-muted-foreground">MCAT preparation platform</p>
                </div>
              </div>
              <p className="text-muted-foreground mb-6">
                Free resources and tools to help students prepare for medical college admission tests.
              </p>
              <a 
                href="https://freemdcat.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-primary hover:underline"
              >
                Visit Website <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced CTA Section */}
      <div className="mx-auto mt-32 max-w-7xl px-6 sm:mt-40 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Ready to transform your study routine?
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-muted-foreground">
            Join thousands of students who have improved their academic performance with StudyPlanner.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-x-6">
            <Link href="/auth/signup">
              <Button size="lg" className="px-8 w-full sm:w-auto">
                Start Your Journey
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Already have an account?
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mx-auto mt-32 max-w-7xl px-6 lg:px-8">
        <div className="border-t border-border pt-16 pb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="font-semibold mb-4">StudyPlanner</h3>
              <p className="text-sm text-muted-foreground">
                Your comprehensive academic companion for organized and effective studying.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/auth/signup" className="hover:text-foreground">Get Started</Link></li>
                <li><Link href="/auth/login" className="hover:text-foreground">Sign In</Link></li>
                <li><Link href="/subjects" className="hover:text-foreground">Subjects</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Our Projects</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="https://predoctr.pk" target="_blank" rel="noopener noreferrer" className="hover:text-foreground">PreDoctor.pk</a></li>
                <li><a href="https://freemdcat.com" target="_blank" rel="noopener noreferrer" className="hover:text-foreground">FreeMDCAT</a></li>
              </ul>
            </div>
          </div>
          <p className="text-center text-sm leading-5 text-muted-foreground">
            &copy; 2024 StudyPlanner. Built with passion for student success.
          </p>
        </div>
      </footer>
    </div>
  )
}
