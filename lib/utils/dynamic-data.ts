/**
 * Dynamic Data Utilities
 * Replaces all hardcoded values with dynamic functions
 */

import { Subject, StudySession, TestMark, Task } from '../../types'

// Color generation utilities
export const generateRandomColor = (): string => {
  const colors = [
    '#0891b2', '#ec4899', '#f59e0b', '#10b981', '#8b5cf6', '#f97316',
    '#06b6d4', '#f43f5e', '#eab308', '#22c55e', '#a855f7', '#ea580c',
    '#0ea5e9', '#ef4444', '#fbbf24', '#16a34a', '#9333ea', '#f97316',
    '#0284c7', '#dc2626', '#f59e0b', '#15803d', '#7c3aed', '#ea580c'
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}

export const generateSubjectColor = (subjectName: string): string => {
  // Generate consistent color based on subject name
  const hash = subjectName.split('').reduce((a, b) => {
    a = ((a << 5) - a + b.charCodeAt(0)) & 0xffffffff
    return a
  }, 0)
  
  const colors = [
    '#0891b2', '#ec4899', '#f59e0b', '#10b981', '#8b5cf6', '#f97316',
    '#06b6d4', '#f43f5e', '#eab308', '#22c55e', '#a855f7', '#ea580c'
  ]
  
  return colors[Math.abs(hash) % colors.length]
}

// Time formatting utilities
export const formatStudyTime = (minutes: number): string => {
  if (minutes <= 0) return '0m'
  
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  
  if (hours === 0) return `${remainingMinutes}m`
  if (remainingMinutes === 0) return `${hours}h`
  return `${hours}h ${remainingMinutes}m`
}

export const formatStudyTimeShort = (minutes: number): string => {
  if (minutes <= 0) return '0m'
  
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  
  if (hours === 0) return `${remainingMinutes}m`
  if (remainingMinutes === 0) return `${hours}h`
  return `${hours}h ${remainingMinutes}m`
}

// Progress calculation utilities
export const calculateProgress = (completed: number, total: number): number => {
  if (!total || total <= 0) return 0
  return Math.round((completed / total) * 100)
}

export const calculateEfficiency = (
  testScore: number, 
  studyTime: number, 
  totalStudyTime: number
): number => {
  if (studyTime <= 0 || totalStudyTime <= 0 || testScore <= 0) return 0
  
  const testScoreRatio = testScore / 100
  const studyTimeRatio = studyTime / totalStudyTime
  
  const efficiency = Math.round(testScoreRatio * studyTimeRatio * 100)
  return Math.min(100, Math.max(0, efficiency))
}

// Data validation utilities
export const validateSubjectData = (subject: Partial<Subject>): boolean => {
  return !!(
    subject.name &&
    subject.name.trim().length > 0 &&
    subject.name.trim().length <= 50
  )
}

export const validateStudySessionData = (session: Partial<StudySession>): boolean => {
  return !!(
    session.duration &&
    session.duration > 0 &&
    session.date
  )
}

export const validateTestMarkData = (test: Partial<TestMark>): boolean => {
  return !!(
    test.subjectId &&
    test.marksObtained !== undefined && test.marksObtained >= 0 &&
    test.totalMarks !== undefined && test.totalMarks > 0 &&
    test.marksObtained !== undefined && test.totalMarks !== undefined && test.marksObtained <= test.totalMarks &&
    test.date
  )
}

export const validateTaskData = (task: Partial<Task>): boolean => {
  return !!(
    task.title &&
    task.title.trim().length > 0 &&
    task.title.trim().length <= 100
  )
}

// Default values utilities
export const getDefaultSubject = (name: string): Subject => ({
  id: `subject-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  name: name.trim(),
  code: `SUBJ${Date.now()}`,
  credits: 3,
  instructor: 'TBD',
  color: generateSubjectColor(name),
  progress: 0,
  nextExam: undefined,
  assignmentsDue: 0,
  materials: [],
  topics: [],
  totalChapters: 0,
  completedChapters: 0
})

export const getDefaultStudySession = (): StudySession => ({
  id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  date: new Date(),
  duration: 0,
  subject: '',
  efficiency: 5,
  sessionType: 'Focused Study',
  productivity: 3,
  notes: '',
  topicsCovered: [],
  materialsUsed: []
})

export const getDefaultTestMark = (): TestMark => ({
  id: `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  date: new Date(),
  subjectId: '',
  subjectName: '',
  marksObtained: 0,
  totalMarks: 100,
  title: '',
  percentage: 0,
  grade: 'F'
})

export const getDefaultTask = (): Task => ({
  id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  title: '',
  description: '',
  subject: '',
  completed: false,
  createdAt: new Date(),
  priority: 'medium',
  category: 'General',
  estimatedTime: 0,
  tags: [],
  progress: 0,
  timeSpent: 0
})

// Chart color utilities
export const getChartColors = (count: number): string[] => {
  const baseColors = [
    '#0891b2', '#ec4899', '#f59e0b', '#10b981', '#8b5cf6', '#f97316',
    '#06b6d4', '#f43f5e', '#eab308', '#22c55e', '#a855f7', '#ea580c',
    '#0ea5e9', '#ef4444', '#fbbf24', '#16a34a', '#9333ea', '#f97316'
  ]
  
  if (count <= baseColors.length) {
    return baseColors.slice(0, count)
  }
  
  // Generate additional colors if needed
  const additionalColors: string[] = []
  for (let i = baseColors.length; i < count; i++) {
    additionalColors.push(generateRandomColor())
  }
  
  return [...baseColors, ...additionalColors]
}

// Performance rating utilities
export const getPerformanceRating = (score: number): string => {
  if (score >= 90) return 'Excellent'
  if (score >= 80) return 'Very Good'
  if (score >= 70) return 'Good'
  if (score >= 60) return 'Satisfactory'
  if (score >= 50) return 'Needs Improvement'
  return 'Poor'
}

export const getPerformanceColor = (score: number): string => {
  if (score >= 80) return 'text-green-600'
  if (score >= 60) return 'text-yellow-600'
  return 'text-red-600'
}

export const getPerformanceBadgeVariant = (score: number): 'default' | 'secondary' | 'destructive' => {
  if (score >= 80) return 'default'
  if (score >= 60) return 'secondary'
  return 'destructive'
}

// Study goal utilities
export const getDefaultStudyGoals = () => ({
  dailyHours: 2,
  weeklyHours: 14,
  monthlyHours: 60,
  subjects: [],
  notifications: true,
  reminders: true
})

// Notification utilities
export const getDefaultNotificationSettings = () => ({
  studyReminders: true,
  breakReminders: true,
  goalUpdates: true,
  weeklyReports: true,
  emailNotifications: false,
  pushNotifications: true
})

// Data export utilities
export const getExportFormats = () => [
  { value: 'json', label: 'JSON', extension: '.json' },
  { value: 'csv', label: 'CSV', extension: '.csv' },
  { value: 'pdf', label: 'PDF Report', extension: '.pdf' }
]

// Time period utilities
export const getTimePeriods = () => [
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
  { value: '365', label: 'Last year' }
]

export const getMetrics = () => [
  { value: 'study-time', label: 'Study Time' },
  { value: 'productivity', label: 'Productivity' },
  { value: 'sessions', label: 'Sessions' },
  { value: 'test-scores', label: 'Test Scores' }
]

// Priority utilities
export const getPriorities = () => [
  { value: 'low', label: 'Low', color: 'text-green-600' },
  { value: 'medium', label: 'Medium', color: 'text-yellow-600' },
  { value: 'high', label: 'High', color: 'text-red-600' }
]

// Subject category utilities
export const getSubjectCategories = () => [
  'Mathematics',
  'Science',
  'Language',
  'History',
  'Literature',
  'Computer Science',
  'Arts',
  'Physical Education',
  'Other'
]

// Study session utilities
export const getProductivityLevels = () => [
  { value: 1, label: 'Very Low', description: 'Distracted, unproductive' },
  { value: 2, label: 'Low', description: 'Somewhat distracted' },
  { value: 3, label: 'Average', description: 'Normal productivity' },
  { value: 4, label: 'High', description: 'Focused, productive' },
  { value: 5, label: 'Very High', description: 'Highly focused, excellent' }
]

// File size utilities
export const getMaxFileSize = (): number => 10 * 1024 * 1024 // 10MB
export const getMaxFileSizeFormatted = (): string => '10MB'

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Date utilities
export const getDateRanges = () => [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'this-week', label: 'This Week' },
  { value: 'last-week', label: 'Last Week' },
  { value: 'this-month', label: 'This Month' },
  { value: 'last-month', label: 'Last Month' },
  { value: 'custom', label: 'Custom Range' }
]

// Chart configuration utilities
export const getChartConfig = () => ({
  height: 300,
  colors: getChartColors(10),
  grid: { strokeDasharray: '3 3' },
  tooltip: { 
    style: { backgroundColor: 'rgba(0, 0, 0, 0.8)', border: 'none' },
    contentStyle: { border: 'none', borderRadius: '8px' }
  },
  legend: { 
    wrapperStyle: { paddingTop: '20px' }
  }
})

// Responsive breakpoints
export const getBreakpoints = () => ({
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536
})

// Animation durations
export const getAnimationDurations = () => ({
  fast: 150,
  normal: 300,
  slow: 500
})

// Z-index layers
export const getZIndexLayers = () => ({
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
  toast: 1080
})
