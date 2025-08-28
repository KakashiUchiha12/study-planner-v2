export interface Task {
  id: string
  title: string
  description?: string | null
  status: string
  createdAt: Date
  updatedAt: Date
  dueDate?: Date
  completedAt?: Date
  priority: 'low' | 'medium' | 'high'
  category: string
  estimatedTime?: number
  timeSpent?: number
  tags: string
  progress?: number
  userId: string
  subjectId?: string | null
  order: number
}

export interface Subject {
  id: string
  name: string
  color: string
  description?: string
  code?: string
  credits: number
  instructor?: string
  totalChapters: number
  completedChapters: number
  progress: number
  nextExam?: Date
  assignmentsDue: number
  createdAt: Date
  updatedAt: Date
  userId: string
}

export interface StudySession {
  id: string
  userId: string
  subjectId?: string
  durationMinutes: number
  startTime: Date
  endTime: Date
  notes?: string
  efficiency?: number
  sessionType?: string
  productivity?: number
  topicsCovered?: string
  materialsUsed?: string
  createdAt: Date
}

export interface TestMark {
  id: string
  testDate: Date
  subjectId: string
  testName: string
  testType: string
  score: number
  maxScore: number
  notes?: string | null
  createdAt: Date
  updatedAt: Date
  mistakes?: string | null
}

export interface StudyGoal {
  id: string
  type: 'daily' | 'weekly' | 'monthly'
  target: number
  current: number
  period: string
}

export interface Material {
  id: string
  name: string
  type: 'textbook' | 'video' | 'article' | 'other'
  files: string[]
  links: string[]
  createdAt: string
}
