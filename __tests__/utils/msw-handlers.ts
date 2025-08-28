import { http, HttpResponse } from 'msw'

const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

// Mock data
const mockTasks = [
  {
    id: '1',
    title: 'Task 1',
    description: 'Description 1',
    completed: false,
    createdAt: new Date('2024-01-01'),
    dueDate: new Date('2024-12-31'),
    priority: 'high' as const,
    category: 'Study',
    estimatedTime: 60,
    tags: ['important'],
    subject: 'Math',
    progress: 0,
    timeSpent: 0
  },
  {
    id: '2',
    title: 'Task 2',
    description: 'Description 2',
    completed: false,
    createdAt: new Date('2024-01-02'),
    dueDate: new Date('2024-12-30'),
    priority: 'medium' as const,
    category: 'Assignment',
    estimatedTime: 30,
    tags: ['homework'],
    subject: 'Science',
    progress: 50,
    timeSpent: 15
  },
  {
    id: '3',
    title: 'Task 3',
    description: 'Description 3',
    completed: true,
    createdAt: new Date('2024-01-03'),
    dueDate: new Date('2024-12-29'),
    priority: 'low' as const,
    category: 'Review',
    estimatedTime: 45,
    tags: ['review'],
    subject: 'History',
    progress: 100,
    timeSpent: 45
  }
]

const mockSubjects = [
  {
    id: '1',
    name: 'Mathematics',
    code: 'MATH101',
    credits: 3,
    instructor: 'Dr. Smith',
    color: '#3B82F6',
    progress: 75,
    nextExam: new Date('2024-12-15'),
    assignmentsDue: 2,
    materials: ['Textbook', 'Calculator'],
    topics: ['Algebra', 'Calculus'],
    completedChapters: 6,
    totalChapters: 8
  },
  {
    id: '2',
    name: 'Physics',
    code: 'PHYS101',
    credits: 4,
    instructor: 'Dr. Johnson',
    color: '#10B981',
    progress: 60,
    nextExam: new Date('2024-12-20'),
    assignmentsDue: 1,
    materials: ['Lab Manual', 'Scientific Calculator'],
    topics: ['Mechanics', 'Thermodynamics'],
    completedChapters: 4,
    totalChapters: 7
  }
]

const mockStudySessions = [
  {
    id: '1',
    subject: 'Mathematics',
    duration: 120,
    date: new Date('2024-01-01'),
    notes: 'Studied algebra concepts',
    efficiency: 8,
    sessionType: 'Focused Study' as const,
    productivity: 4,
    topicsCovered: ['Linear Equations', 'Quadratic Functions'],
    materialsUsed: ['Textbook', 'Calculator']
  },
  {
    id: '2',
    subject: 'Physics',
    duration: 90,
    date: new Date('2024-01-02'),
    notes: 'Lab preparation',
    efficiency: 7,
    sessionType: 'Practice' as const,
    productivity: 3,
    topicsCovered: ['Newton\'s Laws'],
    materialsUsed: ['Lab Manual']
  }
]

const mockTestMarks = [
  {
    id: '1',
    date: new Date('2024-01-01'),
    subjectId: '1',
    subjectName: 'Mathematics',
    marksObtained: 85,
    totalMarks: 100,
    title: 'Midterm Exam',
    percentage: 85,
    grade: 'B+'
  },
  {
    id: '2',
    date: new Date('2024-01-02'),
    subjectId: '2',
    subjectName: 'Physics',
    marksObtained: 78,
    totalMarks: 100,
    title: 'Quiz 1',
    percentage: 78,
    grade: 'C+'
  }
]

// Helper function to calculate grade
function calculateGrade(percentage: number): string {
  if (percentage >= 90) return 'A+'
  if (percentage >= 85) return 'A'
  if (percentage >= 80) return 'A-'
  if (percentage >= 75) return 'B+'
  if (percentage >= 70) return 'B'
  if (percentage >= 65) return 'B-'
  if (percentage >= 60) return 'C+'
  if (percentage >= 55) return 'C'
  if (percentage >= 50) return 'C-'
  if (percentage >= 45) return 'D+'
  if (percentage >= 40) return 'D'
  return 'F'
}

export const handlers = [
  // Tasks API
  http.get(`${baseURL}/api/tasks`, () => {
    return HttpResponse.json(mockTasks)
  }),

  http.post(`${baseURL}/api/tasks`, async ({ request }) => {
    const newTask = await request.json() as any
    const task = {
      id: Date.now().toString(),
      createdAt: new Date(),
      completed: false,
      progress: 0,
      timeSpent: 0,
      ...newTask
    }
    mockTasks.push(task)
    return HttpResponse.json(task)
  }),

  http.put(`${baseURL}/api/tasks/:id`, async ({ params, request }) => {
    const { id } = params
    const updates = await request.json() as any
    const taskIndex = mockTasks.findIndex(task => task.id === id)
    
    if (taskIndex === -1) {
      return new HttpResponse(null, { status: 404 })
    }
    
    mockTasks[taskIndex] = { ...mockTasks[taskIndex], ...updates }
    return HttpResponse.json(mockTasks[taskIndex])
  }),

  http.delete(`${baseURL}/api/tasks/:id`, ({ params }) => {
    const { id } = params
    const taskIndex = mockTasks.findIndex(task => task.id === id)
    
    if (taskIndex === -1) {
      return new HttpResponse(null, { status: 404 })
    }
    
    mockTasks.splice(taskIndex, 1)
    return new HttpResponse(null, { status: 204 })
  }),

  // Subjects API
  http.get(`${baseURL}/api/subjects`, () => {
    return HttpResponse.json(mockSubjects)
  }),

  http.post(`${baseURL}/api/subjects`, async ({ request }) => {
    const newSubject = await request.json() as any
    const subject = {
      id: Date.now().toString(),
      progress: 0,
      assignmentsDue: 0,
      ...newSubject
    }
    mockSubjects.push(subject)
    return HttpResponse.json(subject)
  }),

  // Study Sessions API
  http.get(`${baseURL}/api/study-sessions`, () => {
    return HttpResponse.json(mockStudySessions)
  }),

  http.post(`${baseURL}/api/study-sessions`, async ({ request }) => {
    const newSession = await request.json() as any
    const session = {
      id: Date.now().toString(),
      date: new Date(newSession.date),
      ...newSession
    }
    mockStudySessions.push(session)
    return HttpResponse.json(session)
  }),

  // Test Marks API
  http.get(`${baseURL}/api/test-marks`, () => {
    return HttpResponse.json(mockTestMarks)
  }),

  http.post(`${baseURL}/api/test-marks`, async ({ request }) => {
    const newTest = await request.json() as any
    const testMark = {
      id: Date.now().toString(),
      date: new Date(newTest.date),
      percentage: (newTest.marksObtained / newTest.totalMarks) * 100,
      grade: calculateGrade((newTest.marksObtained / newTest.totalMarks) * 100),
      ...newTest
    }
    mockTestMarks.push(testMark)
    return HttpResponse.json(testMark)
  }),

  // Analytics API
  http.get(`${baseURL}/api/analytics/study-time`, () => {
    const totalTime = mockStudySessions.reduce((sum, session) => sum + session.duration, 0)
    const averageTime = totalTime / mockStudySessions.length
    
    return HttpResponse.json({
      totalTime,
      averageTime,
      sessions: mockStudySessions.length,
      dailyData: [
        { date: '2024-01-01', time: 120 },
        { date: '2024-01-02', time: 90 }
      ]
    })
  }),

  http.get(`${baseURL}/api/analytics/task-completion`, () => {
    const totalTasks = mockTasks.length
    const completedTasks = mockTasks.filter(task => task.completed).length
    const completionRate = (completedTasks / totalTasks) * 100
    
    return HttpResponse.json({
      totalTasks,
      completedTasks,
      completionRate,
      dailyData: [
        { date: '2024-01-01', completed: 0, total: 1 },
        { date: '2024-01-02', completed: 1, total: 2 }
      ]
    })
  }),

  // Auth API
  http.post(`${baseURL}/api/auth/signin`, async ({ request }) => {
    const credentials = await request.json() as any
    
    // Mock authentication - always succeed for testing
    return HttpResponse.json({
      success: true,
      user: {
        id: '1',
        email: credentials.email,
        name: 'Test User'
      }
    })
  }),

  // Catch-all handler
  http.all('*', () => {
    return new HttpResponse(null, { status: 404 })
  })
]
