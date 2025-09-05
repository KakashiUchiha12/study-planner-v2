import { openDB, DBSchema, IDBPDatabase } from 'idb';

// Define the database schema
interface StudyPlannerDB extends DBSchema {
  subjects: {
    key: string;
    value: {
      id: string;
      name: string;
      description: string;
      color: string;
      code: string;
      credits: number;
      instructor: string;
      totalChapters: number;
      completedChapters: number;
      progress: number;
      nextExam: string | null;
      assignmentsDue: number;
      totalMaterials: number;
      completedMaterials: number;
      totalFiles: number;
      createdAt: string;
      updatedAt: string;
      userId: string;
    };
    indexes: {
      'by-userId': string;
      'by-name': string;
    };
  };
  tasks: {
    key: string;
    value: {
      id: string;
      title: string;
      description: string;
      subjectId: string;
      priority: 'low' | 'medium' | 'high';
      status: 'pending' | 'in_progress' | 'completed';
      dueDate: string | null;
      estimatedTime: number;
      timeSpent: number;
      progress: number;
      tags: string;
      order: number;
      createdAt: string;
      updatedAt: string;
      userId: string;
    };
  };
  studySessions: {
    key: string;
    value: {
      id: string;
      startTime: string;
      endTime: string;
      duration: number;
      subjectId: string;
      efficiency: number;
      sessionType: string;
      productivity: number;
      notes: string;
      topicsCovered: string | null;
      materialsUsed: string | null;
      createdAt: string;
      updatedAt: string;
      userId: string;
    };
  };
  testMarks: {
    key: string;
    value: {
      id: string;
      subjectId: string;
      score: number;
      maxScore: number;
      title: string;
      testType: string;
      testDate: string;
      mistakes: string | null;
      createdAt: string;
      updatedAt: string;
      userId: string;
    };
  };
  goals: {
    key: string;
    value: {
      id: string;
      title: string;
      description: string;
      targetDate: string | null;
      completed: boolean;
      createdAt: string;
      updatedAt: string;
      userId: string;
    };
  };
  goalTasks: {
    key: string;
    value: {
      id: string;
      goalId: string;
      title: string;
      description: string;
      dueDate: string | null;
      priority: 'low' | 'medium' | 'high';
      completed: boolean;
      order: number;
      createdAt: string;
      updatedAt: string;
    };
  };
  skills: {
    key: string;
    value: {
      id: string;
      name: string;
      description: string;
      category: string;
      currentLevel: number;
      targetLevel: number;
      createdAt: string;
      updatedAt: string;
      userId: string;
    };
  };
  skillObjectives: {
    key: string;
    value: {
      id: string;
      skillId: string;
      title: string;
      description: string;
      completed: boolean;
      order: number;
      createdAt: string;
      updatedAt: string;
    };
  };
  userSettings: {
    key: string;
    value: {
      id: string;
      userId: string;
      theme: string;
      taskReminders: boolean;
      studyReminders: boolean;
      breakReminders: boolean;
      breakDuration: number;
      studyStreakTracking: boolean;
      dataRetentionDays: number;
      dashboardLayout: string;
      showProgressBars: boolean;
      compactMode: boolean;
      autoBackup: boolean;
      createdAt: string;
      updatedAt: string;
    };
  };
}

class DesktopDatabase {
  private db: IDBPDatabase<StudyPlannerDB> | null = null;
  private userId: string = 'desktop-user';

  async initialize(): Promise<void> {
    try {
      this.db = await openDB<StudyPlannerDB>('StudyPlannerDB', 1, {
        upgrade(db) {
          // Create subjects store
          if (!db.objectStoreNames.contains('subjects')) {
            db.createObjectStore('subjects', { keyPath: 'id' });
          }

          // Create tasks store
          if (!db.objectStoreNames.contains('tasks')) {
            db.createObjectStore('tasks', { keyPath: 'id' });
          }

          // Create study sessions store
          if (!db.objectStoreNames.contains('studySessions')) {
            db.createObjectStore('studySessions', { keyPath: 'id' });
          }

          // Create test marks store
          if (!db.objectStoreNames.contains('testMarks')) {
            db.createObjectStore('testMarks', { keyPath: 'id' });
          }

          // Create goals store
          if (!db.objectStoreNames.contains('goals')) {
            db.createObjectStore('goals', { keyPath: 'id' });
          }

          // Create goal tasks store
          if (!db.objectStoreNames.contains('goalTasks')) {
            db.createObjectStore('goalTasks', { keyPath: 'id' });
          }

          // Create skills store
          if (!db.objectStoreNames.contains('skills')) {
            db.createObjectStore('skills', { keyPath: 'id' });
          }

          // Create skill objectives store
          if (!db.objectStoreNames.contains('skillObjectives')) {
            db.createObjectStore('skillObjectives', { keyPath: 'id' });
          }

          // Create user settings store
          if (!db.objectStoreNames.contains('userSettings')) {
            db.createObjectStore('userSettings', { keyPath: 'id' });
          }
        },
      });

      console.log('Desktop database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize desktop database:', error);
      throw error;
    }
  }

  // Subjects
  async getSubjects() {
    if (!this.db) throw new Error('Database not initialized');
    const allSubjects = await this.db.getAll('subjects');
    return allSubjects.filter(subject => subject.userId === this.userId);
  }

  async createSubject(subject: Omit<StudyPlannerDB['subjects']['value'], 'id' | 'createdAt' | 'updatedAt'>) {
    if (!this.db) throw new Error('Database not initialized');
    const id = `subject-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    const newSubject = {
      ...subject,
      id,
      createdAt: now,
      updatedAt: now,
      userId: this.userId
    };
    await this.db.add('subjects', newSubject);
    return newSubject;
  }

  async updateSubject(id: string, updates: Partial<StudyPlannerDB['subjects']['value']>) {
    if (!this.db) throw new Error('Database not initialized');
    const subject = await this.db.get('subjects', id);
    if (!subject) throw new Error('Subject not found');
    
    const updatedSubject = {
      ...subject,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    await this.db.put('subjects', updatedSubject);
    return updatedSubject;
  }

  async deleteSubject(id: string) {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.delete('subjects', id);
  }

  // Tasks
  async getTasks() {
    if (!this.db) throw new Error('Database not initialized');
    const allTasks = await this.db.getAll('tasks');
    return allTasks.filter(task => task.userId === this.userId);
  }

  async createTask(task: Omit<StudyPlannerDB['tasks']['value'], 'id' | 'createdAt' | 'updatedAt'>) {
    if (!this.db) throw new Error('Database not initialized');
    const id = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    const newTask = {
      ...task,
      id,
      createdAt: now,
      updatedAt: now,
      userId: this.userId
    };
    await this.db.add('tasks', newTask);
    return newTask;
  }

  async updateTask(id: string, updates: Partial<StudyPlannerDB['tasks']['value']>) {
    if (!this.db) throw new Error('Database not initialized');
    const task = await this.db.get('tasks', id);
    if (!task) throw new Error('Task not found');
    
    const updatedTask = {
      ...task,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    await this.db.put('tasks', updatedTask);
    return updatedTask;
  }

  async deleteTask(id: string) {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.delete('tasks', id);
  }

  // Study Sessions
  async getStudySessions() {
    if (!this.db) throw new Error('Database not initialized');
    const allSessions = await this.db.getAll('studySessions');
    return allSessions.filter(session => session.userId === this.userId);
  }

  async createStudySession(session: Omit<StudyPlannerDB['studySessions']['value'], 'id' | 'createdAt' | 'updatedAt'>) {
    if (!this.db) throw new Error('Database not initialized');
    const id = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    const newSession = {
      ...session,
      id,
      createdAt: now,
      updatedAt: now,
      userId: this.userId
    };
    await this.db.add('studySessions', newSession);
    return newSession;
  }

  // Test Marks
  async getTestMarks() {
    if (!this.db) throw new Error('Database not initialized');
    const allTestMarks = await this.db.getAll('testMarks');
    return allTestMarks.filter(testMark => testMark.userId === this.userId);
  }

  async createTestMark(testMark: Omit<StudyPlannerDB['testMarks']['value'], 'id' | 'createdAt' | 'updatedAt'>) {
    if (!this.db) throw new Error('Database not initialized');
    const id = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    const newTestMark = {
      ...testMark,
      id,
      createdAt: now,
      updatedAt: now,
      userId: this.userId
    };
    await this.db.add('testMarks', newTestMark);
    return newTestMark;
  }

  // Goals
  async getGoals() {
    if (!this.db) throw new Error('Database not initialized');
    const allGoals = await this.db.getAll('goals');
    return allGoals.filter(goal => goal.userId === this.userId);
  }

  async createGoal(goal: Omit<StudyPlannerDB['goals']['value'], 'id' | 'createdAt' | 'updatedAt'>) {
    if (!this.db) throw new Error('Database not initialized');
    const id = `goal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    const newGoal = {
      ...goal,
      id,
      createdAt: now,
      updatedAt: now,
      userId: this.userId
    };
    await this.db.add('goals', newGoal);
    return newGoal;
  }

  // User Settings
  async getUserSettings() {
    if (!this.db) throw new Error('Database not initialized');
    const allSettings = await this.db.getAll('userSettings');
    const settings = allSettings.filter(setting => setting.userId === this.userId);
    return settings[0] || null;
  }

  async updateUserSettings(settings: Partial<StudyPlannerDB['userSettings']['value']>) {
    if (!this.db) throw new Error('Database not initialized');
    const existingSettings = await this.getUserSettings();
    
    if (existingSettings) {
      const updatedSettings = {
        ...existingSettings,
        ...settings,
        updatedAt: new Date().toISOString()
      };
      await this.db.put('userSettings', updatedSettings);
      return updatedSettings;
    } else {
      const id = `settings-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date().toISOString();
      const newSettings = {
        id,
        userId: this.userId,
        theme: 'light',
        taskReminders: true,
        studyReminders: true,
        breakReminders: true,
        breakDuration: 15,
        studyStreakTracking: true,
        dataRetentionDays: 365,
        dashboardLayout: 'default',
        showProgressBars: true,
        compactMode: false,
        autoBackup: true,
        createdAt: now,
        updatedAt: now,
        ...settings
      };
      await this.db.add('userSettings', newSettings);
      return newSettings;
    }
  }

  // Export/Import
  async exportData() {
    if (!this.db) throw new Error('Database not initialized');
    const data = {
      subjects: await this.getSubjects(),
      tasks: await this.getTasks(),
      studySessions: await this.getStudySessions(),
      testMarks: await this.getTestMarks(),
      goals: await this.getGoals(),
      userSettings: await this.getUserSettings(),
      exportDate: new Date().toISOString(),
      version: '1.0.0'
    };
    return data;
  }

  async importData(data: Record<string, unknown>) {
    if (!this.db) throw new Error('Database not initialized');
    
    // Clear existing data
    await this.db.clear('subjects');
    await this.db.clear('tasks');
    await this.db.clear('studySessions');
    await this.db.clear('testMarks');
    await this.db.clear('goals');
    await this.db.clear('userSettings');

    // Import new data
    if (data.subjects && Array.isArray(data.subjects)) {
      for (const subject of data.subjects) {
        await this.db.add('subjects', { ...subject, userId: this.userId } as any);
      }
    }
    if (data.tasks && Array.isArray(data.tasks)) {
      for (const task of data.tasks) {
        await this.db.add('tasks', { ...task, userId: this.userId } as any);
      }
    }
    if (data.studySessions && Array.isArray(data.studySessions)) {
      for (const session of data.studySessions) {
        await this.db.add('studySessions', { ...session, userId: this.userId } as any);
      }
    }
    if (data.testMarks && Array.isArray(data.testMarks)) {
      for (const testMark of data.testMarks) {
        await this.db.add('testMarks', { ...testMark, userId: this.userId } as any);
      }
    }
    if (data.goals && Array.isArray(data.goals)) {
      for (const goal of data.goals) {
        await this.db.add('goals', { ...goal, userId: this.userId } as any);
      }
    }
    if (data.userSettings && typeof data.userSettings === 'object') {
      const userSettings = data.userSettings as Record<string, unknown>;
      await this.db.add('userSettings', { 
        ...userSettings, 
        userId: this.userId,
        id: userSettings.id || 'default',
        theme: userSettings.theme || 'light',
        taskReminders: userSettings.taskReminders ?? true,
        studyReminders: userSettings.studyReminders ?? true,
        breakReminders: userSettings.breakReminders ?? true,
        breakDuration: userSettings.breakDuration ?? 5,
        studyStreakTracking: userSettings.studyStreakTracking ?? true,
        dataRetentionDays: userSettings.dataRetentionDays ?? 365,
        autoBackup: userSettings.autoBackup ?? true,
        backupFrequency: userSettings.backupFrequency ?? 'weekly',
        notifications: userSettings.notifications ?? true,
        soundEnabled: userSettings.soundEnabled ?? true,
        createdAt: userSettings.createdAt || new Date().toISOString(),
        updatedAt: userSettings.updatedAt || new Date().toISOString()
      } as any);
    }
  }
}

// Create singleton instance
export const desktopDB = new DesktopDatabase();
