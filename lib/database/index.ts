// Database Services
export { dbService } from './database-service'
export { subjectService } from './subject-service'
export { chapterService } from './chapter-service'
export { materialService } from './material-service'
export { taskService } from './task-service'
export { studySessionService } from './study-session-service'
export { testMarkService } from './test-mark-service'
export { migrationUtility } from './migration-utility'

// New Profile Management Services
export { profileService } from './profile-service'
export { goalService } from './goal-service'
export { skillService } from './skill-service'
export { documentService } from './document-service'
export { calendarEventService } from './calendar-event-service'

// Types and Interfaces
export type { CreateSubjectData, UpdateSubjectData } from './subject-service'
export type { CreateChapterData, UpdateChapterData } from './chapter-service'
export type { CreateMaterialData, UpdateMaterialData } from './material-service'
export type { CreateTaskData, UpdateTaskData } from './task-service'
export type { CreateStudySessionData, UpdateStudySessionData } from './study-session-service'
export type { CreateTestMarkData, UpdateTestMarkData } from './test-mark-service'
export type { MigrationResult } from './migration-utility'

// New Profile Management Types
export type { 
  CreateProfileData, 
  UpdateProfileData 
} from './profile-service'
export type { 
  CreateGoalData, 
  UpdateGoalData, 
  CreateGoalTaskData, 
  UpdateGoalTaskData 
} from './goal-service'
export type { 
  CreateSkillData, 
  UpdateSkillData, 
  CreateSkillObjectiveData, 
  UpdateSkillObjectiveData 
} from './skill-service'
export type { 
  CreateDocumentData, 
  UpdateDocumentData 
} from './document-service'
export type { 
  CreateCalendarEventData, 
  UpdateCalendarEventData 
} from './calendar-event-service'

// Re-export Prisma types for convenience
export type { 
  Subject, 
  Chapter,
  Material,
  Task, 
  StudySession, 
  TestMark, 
  User,
  UserProfile,
  Goal,
  GoalTask,
  Skill,
  SkillObjective,
  Document,
  CalendarEvent
} from '@prisma/client'
