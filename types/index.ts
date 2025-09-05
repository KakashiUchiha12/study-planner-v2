export interface Task {
  id: string
  title: string
  description?: string | null
  status: 'pending' | 'in_progress' | 'completed'
  createdAt: Date
  updatedAt: Date
  dueDate?: Date | null
  completedAt?: Date | null
  priority: 'low' | 'medium' | 'high'
  category: string
  estimatedTime?: number | null
  timeSpent?: number | null
  tags: string
  progress?: number | null
  userId: string
  subjectId?: string | null
  order: number
}

export interface Subject {
  id: string
  name: string
  color: string
  description?: string | null
  code?: string | null
  credits: number
  instructor?: string | null
  totalChapters: number
  completedChapters: number
  totalMaterials: number
  completedMaterials: number
  totalFiles: number
  nextExam?: Date | null
  assignmentsDue: number
  createdAt: Date
  updatedAt: Date
  userId: string
}

export interface StudySession {
  id: string
  userId: string
  subjectId?: string | null
  durationMinutes: number
  startTime: Date
  endTime: Date
  notes?: string | null
  efficiency?: number | null
  sessionType?: string | null
  productivity?: number | null
  topicsCovered?: string | null
  materialsUsed?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface TestMark {
  id: string
  userId: string
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
  createdAt: Date
  updatedAt: Date
  userId: string
  subjectId?: string | null
  chapterId?: string | null
}
