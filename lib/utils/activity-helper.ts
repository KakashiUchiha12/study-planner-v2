/**
 * Helper functions for creating user activities
 * These functions can be called from various parts of the app to automatically track user actions
 */

export interface ActivityData {
  type: string
  title: string
  description?: string
  metadata?: Record<string, unknown>
}

/**
 * Create a user activity by calling the API
 */
export async function createUserActivity(data: ActivityData): Promise<void> {
  try {
    const response = await fetch('/api/activities', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    })
    
    if (!response.ok) {
      console.error('Failed to create activity:', response.statusText)
    }
  } catch (error) {
    console.error('Error creating user activity:', error)
  }
}

/**
 * Predefined activity creators for common actions
 */
export const ActivityCreators = {
  /**
   * Profile updated activity
   */
  profileUpdated: (details?: string) => createUserActivity({
    type: 'profile_updated',
    title: 'Profile Updated',
    description: details || 'Your profile information has been updated',
    metadata: { action: 'profile_update', timestamp: new Date().toISOString() }
  }),

  /**
   * Goal created activity
   */
  goalCreated: (goalTitle: string, category?: string) => createUserActivity({
    type: 'goal_created',
    title: `New Goal: ${goalTitle}`,
    description: `You created a new goal${category ? ` in ${category}` : ''}`,
    metadata: { action: 'goal_create', goalTitle, category, timestamp: new Date().toISOString() }
  }),

  /**
   * Goal completed activity
   */
  goalCompleted: (goalTitle: string) => createUserActivity({
    type: 'goal_completed',
    title: `Goal Completed: ${goalTitle}`,
    description: `Congratulations! You've completed your goal`,
    metadata: { action: 'goal_complete', goalTitle, timestamp: new Date().toISOString() }
  }),

  /**
   * Skill progress activity
   */
  skillProgress: (skillName: string, progress: number) => createUserActivity({
    type: 'skill_progress',
    title: `Skill Progress: ${skillName}`,
    description: `Your ${skillName} skill has progressed to ${progress}%`,
    metadata: { action: 'skill_progress', skillName, progress, timestamp: new Date().toISOString() }
  }),

  /**
   * Test completed activity
   */
  testCompleted: (subjectName: string, score: number, totalQuestions: number) => createUserActivity({
    type: 'test_completed',
    title: `Test Completed: ${subjectName}`,
    description: `You completed a test with a score of ${score}/${totalQuestions}`,
    metadata: { action: 'test_complete', subjectName, score, totalQuestions, timestamp: new Date().toISOString() }
  }),

  /**
   * Document uploaded activity
   */
  documentUploaded: (documentName: string, type: string) => createUserActivity({
    type: 'document_uploaded',
    title: `Document Uploaded: ${documentName}`,
    description: `You uploaded a new ${type} document`,
    metadata: { action: 'document_upload', documentName, type, timestamp: new Date().toISOString() }
  }),

  /**
   * Study session started activity
   */
  studySessionStarted: (subjectName: string, duration: number) => createUserActivity({
    type: 'study_session_started',
    title: `Study Session Started: ${subjectName}`,
    description: `You started a ${duration}-minute study session`,
    metadata: { action: 'study_session_start', subjectName, duration, timestamp: new Date().toISOString() }
  }),

  /**
   * Study session completed activity
   */
  studySessionCompleted: (subjectName: string, duration: number, topics: string[]) => createUserActivity({
    type: 'study_session_completed',
    title: `Study Session Completed: ${subjectName}`,
    description: `You completed a ${duration}-minute study session covering ${topics.join(', ')}`,
    metadata: { action: 'study_session_complete', subjectName, duration, topics, timestamp: new Date().toISOString() }
  }),

  /**
   * Task completed activity
   */
  taskCompleted: (taskTitle: string, goalTitle?: string) => createUserActivity({
    type: 'task_completed',
    title: `Task Completed: ${taskTitle}`,
    description: goalTitle ? `You completed a task for your goal: ${goalTitle}` : 'You completed a task',
    metadata: { action: 'task_complete', taskTitle, goalTitle, timestamp: new Date().toISOString() }
  }),

  /**
   * Custom activity creator
   */
  custom: (type: string, title: string, description?: string, metadata?: Record<string, unknown>) => createUserActivity({
    type,
    title,
    description,
    metadata: { ...metadata, timestamp: new Date().toISOString() }
  })
}

/**
 * Batch create multiple activities (useful for bulk operations)
 */
export async function createBatchActivities(activities: ActivityData[]): Promise<void> {
  try {
    const promises = activities.map(activity => createUserActivity(activity))
    await Promise.all(promises)
  } catch (error) {
    console.error('Error creating batch activities:', error)
  }
}
