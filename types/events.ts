export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type: 'study' | 'assignment' | 'exam' | 'break' | 'personal';
  description?: string;
  location?: string;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  notificationEnabled: boolean;
  notificationTime: number; // minutes before event
  color?: string;
  recurring?: {
    type: 'daily' | 'weekly' | 'monthly';
    interval: number;
    endDate?: Date;
  };
}

export interface StudyPlan {
  id: string;
  subject: string;
  topic: string;
  duration: number; // in minutes
  difficulty: 'easy' | 'medium' | 'hard';
  materials: string[];
  goals: string[];
  events: CalendarEvent[];
}
