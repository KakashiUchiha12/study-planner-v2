/**
 * Local Storage Service for PWA Offline Functionality
 * Syncs SQLite data to IndexedDB for offline access
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb'

// Define the database schema
interface StudyPlannerDB extends DBSchema {
  subjects: {
    key: string
    value: SubjectData
    indexes: { 'by-userId': string }
  }
  tasks: {
    key: string
    value: TaskData
    indexes: { 'by-userId': string, 'by-subjectId': string }
  }
  studySessions: {
    key: string
    value: StudySessionData
    indexes: { 'by-userId': string, 'by-subjectId': string }
  }
  testMarks: {
    key: string
    value: TestMarkData
    indexes: { 'by-userId': string, 'by-subjectId': string }
  }
  goals: {
    key: string
    value: GoalData
    indexes: { 'by-userId': string }
  }
  skills: {
    key: string
    value: SkillData
    indexes: { 'by-userId': string }
  }
  files: {
    key: string
    value: FileData
    indexes: { 'by-userId': string, 'by-subjectId': string }
  }
  documents: {
    key: string
    value: DocumentData
    indexes: { 'by-userId': string, 'by-subjectId': string }
  }
  syncQueue: {
    key: string
    value: SyncQueueItem
  }
}

interface SubjectData {
  id: string
  userId: string
  name: string
  description?: string
  color?: string
  createdAt: Date
  updatedAt: Date
}

interface TaskData {
  id: string
  userId: string
  subjectId: string
  title: string
  description?: string
  completed: boolean
  priority: 'low' | 'medium' | 'high'
  dueDate?: Date
  createdAt: Date
  updatedAt: Date
}

interface StudySessionData {
  id: string
  userId: string
  subjectId: string
  duration: number
  startTime: Date
  endTime?: Date
  notes?: string
  createdAt: Date
  updatedAt: Date
}

interface TestMarkData {
  id: string
  userId: string
  subjectId: string
  testName: string
  marks: number
  totalMarks: number
  date: Date
  createdAt: Date
  updatedAt: Date
}

interface GoalData {
  id: string
  userId: string
  title: string
  description?: string
  targetDate?: Date
  completed: boolean
  createdAt: Date
  updatedAt: Date
}

interface SkillData {
  id: string
  userId: string
  name: string
  level: 'beginner' | 'intermediate' | 'advanced'
  description?: string
  createdAt: Date
  updatedAt: Date
}

interface FileData {
  id: string
  userId: string
  subjectId?: string
  name: string
  type: string
  size: number
  data?: ArrayBuffer
  filePath?: string
  metadata?: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
}

interface DocumentData {
  id: string
  userId: string
  subjectId?: string
  title: string
  content?: string
  type: string
  createdAt: Date
  updatedAt: Date
}

interface SyncQueueItem {
  id: string
  action: 'create' | 'update' | 'delete'
  table: string
  data: Record<string, unknown>
  timestamp: number
  synced: boolean
}

class LocalStorageService {
  private db: IDBPDatabase<StudyPlannerDB> | null = null
  private isOnline = navigator.onLine
  private isElectron = false

  constructor() {
    this.isElectron = typeof window !== 'undefined' && !!window.electronAPI
    this.init()
    this.setupOnlineOfflineListeners()
  }

  private async init() {
    try {
      this.db = await openDB<StudyPlannerDB>('StudyPlannerDB', 1, {
        upgrade(db) {
          // Subjects store
          if (!db.objectStoreNames.contains('subjects')) {
            const subjectsStore = db.createObjectStore('subjects', { keyPath: 'id' })
            subjectsStore.createIndex('by-userId', 'userId')
          }

          // Tasks store
          if (!db.objectStoreNames.contains('tasks')) {
            const tasksStore = db.createObjectStore('tasks', { keyPath: 'id' })
            tasksStore.createIndex('by-userId', 'userId')
            tasksStore.createIndex('by-subjectId', 'subjectId')
          }

          // Study Sessions store
          if (!db.objectStoreNames.contains('studySessions')) {
            const sessionsStore = db.createObjectStore('studySessions', { keyPath: 'id' })
            sessionsStore.createIndex('by-userId', 'userId')
            sessionsStore.createIndex('by-subjectId', 'subjectId')
          }

          // Test Marks store
          if (!db.objectStoreNames.contains('testMarks')) {
            const testMarksStore = db.createObjectStore('testMarks', { keyPath: 'id' })
            testMarksStore.createIndex('by-userId', 'userId')
            testMarksStore.createIndex('by-subjectId', 'subjectId')
          }

          // Goals store
          if (!db.objectStoreNames.contains('goals')) {
            const goalsStore = db.createObjectStore('goals', { keyPath: 'id' })
            goalsStore.createIndex('by-userId', 'userId')
          }

          // Skills store
          if (!db.objectStoreNames.contains('skills')) {
            const skillsStore = db.createObjectStore('skills', { keyPath: 'id' })
            skillsStore.createIndex('by-userId', 'userId')
          }

          // Files store
          if (!db.objectStoreNames.contains('files')) {
            const filesStore = db.createObjectStore('files', { keyPath: 'id' })
            filesStore.createIndex('by-userId', 'userId')
            filesStore.createIndex('by-subjectId', 'subjectId')
          }

          // Documents store
          if (!db.objectStoreNames.contains('documents')) {
            const documentsStore = db.createObjectStore('documents', { keyPath: 'id' })
            documentsStore.createIndex('by-userId', 'userId')
            documentsStore.createIndex('by-subjectId', 'subjectId')
          }

          // Sync Queue store
          if (!db.objectStoreNames.contains('syncQueue')) {
            const syncQueueStore = db.createObjectStore('syncQueue', { keyPath: 'id' })
            // No indexes for syncQueue
          }
        },
      })

      console.log('Local database initialized successfully')
    } catch (error) {
      console.error('Failed to initialize local database:', error)
    }
  }

  private setupOnlineOfflineListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true
      console.log('App is online - syncing data...')
      this.syncOfflineData()
    })

    window.addEventListener('offline', () => {
      this.isOnline = false
      console.log('App is offline - using local data')
    })
  }

  // Generic CRUD operations
  async create(table: string, data: Record<string, unknown>): Promise<Record<string, unknown>> {
    if (!this.db) throw new Error('Database not initialized')

    try {
      // Add to local storage
      await this.db.add(table as any, data as any)

      // If online, sync to server
      if (this.isOnline) {
        await this.syncToServer('create', table, data)
      } else {
        // Queue for later sync
        await this.queueForSync('create', table, data)
      }

      return data
    } catch (error) {
      console.error(`Failed to create ${table}:`, error)
      throw error
    }
  }

  async read(table: string, id?: string): Promise<Record<string, unknown> | Record<string, unknown>[]> {
    if (!this.db) throw new Error('Database not initialized')

    try {
      if (id) {
        return await this.db.get(table as any, id) as Record<string, unknown>
      } else {
        return await this.db.getAll(table as any) as Record<string, unknown>[]
      }
    } catch (error) {
      console.error(`Failed to read ${table}:`, error)
      throw error
    }
  }

  async update(table: string, id: string, data: Record<string, unknown>): Promise<Record<string, unknown>> {
    if (!this.db) throw new Error('Database not initialized')

    try {
      const updatedData = { ...data, id, updatedAt: new Date() }
      await this.db.put(table as any, updatedData as any)

      // If online, sync to server
      if (this.isOnline) {
        await this.syncToServer('update', table, updatedData)
      } else {
        // Queue for later sync
        await this.queueForSync('update', table, updatedData)
      }

      return updatedData
    } catch (error) {
      console.error(`Failed to update ${table}:`, error)
      throw error
    }
  }

  async delete(table: string, id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized')

    try {
      await this.db.delete(table as any, id)

      // If online, sync to server
      if (this.isOnline) {
        await this.syncToServer('delete', table, { id })
      } else {
        // Queue for later sync
        await this.queueForSync('delete', table, { id })
      }
    } catch (error) {
      console.error(`Failed to delete ${table}:`, error)
      throw error
    }
  }

  // Query operations
  async query(table: string, index: string, value: unknown): Promise<Record<string, unknown>[]> {
    if (!this.db) throw new Error('Database not initialized')

    try {
      const allItems = await this.db.getAll(table as any) as Record<string, unknown>[];
      return allItems.filter((item: Record<string, unknown>) => item[index] === value);
    } catch (error) {
      console.error(`Failed to query ${table}:`, error)
      throw error
    }
  }

  // Sync operations
  private async syncToServer(action: 'create' | 'update' | 'delete', table: string, data: Record<string, unknown>): Promise<void> {
    try {
      const endpoint = `/api/${table}`
      let response: Response

      switch (action) {
        case 'create':
          response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          })
          break
        case 'update':
          response = await fetch(`${endpoint}/${data.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          })
          break
        case 'delete':
          response = await fetch(`${endpoint}/${data.id}`, {
            method: 'DELETE'
          })
          break
      }

      if (!response.ok) {
        throw new Error(`Server sync failed: ${response.statusText}`)
      }

      console.log(`Successfully synced ${action} ${table}`)
    } catch (error) {
      console.error(`Failed to sync ${action} ${table}:`, error)
      // Queue for later sync
      await this.queueForSync(action, table, data)
    }
  }

  private async queueForSync(action: 'create' | 'update' | 'delete', table: string, data: Record<string, unknown>): Promise<void> {
    if (!this.db) return

    try {
      const syncItem: SyncQueueItem = {
        id: `${table}-${data.id}-${Date.now()}`,
        action,
        table,
        data,
        timestamp: Date.now(),
        synced: false
      }

      await this.db.add('syncQueue', syncItem)
      console.log(`Queued ${action} ${table} for sync`)
    } catch (error) {
      console.error('Failed to queue for sync:', error)
    }
  }

  async syncOfflineData(): Promise<void> {
    if (!this.db || !this.isOnline) return

    try {
      const allItems = await this.db.getAll('syncQueue') as SyncQueueItem[];
      const unsyncedItems = allItems.filter((item: SyncQueueItem) => !item.synced);
      
      for (const item of unsyncedItems) {
        try {
          await this.syncToServer(item.action, item.table, item.data)
          
          // Mark as synced
          await this.db.put('syncQueue', { ...item, synced: true })
        } catch (error) {
          console.error(`Failed to sync queued item ${item.id}:`, error)
        }
      }

      console.log(`Synced ${unsyncedItems.length} offline items`)
    } catch (error) {
      console.error('Failed to sync offline data:', error)
    }
  }

  // Bulk operations for initial sync
  async syncFromServer(table: string, userId: string): Promise<void> {
    if (!this.db || !this.isOnline) return

    try {
      const response = await fetch(`/api/${table}?userId=${userId}`)
      if (!response.ok) throw new Error(`Failed to fetch ${table}`)

      const data = await response.json() as Record<string, unknown>[]
      
      // Clear existing data
      await this.db.clear(table as any)
      
      // Add new data
      for (const item of data) {
        await this.db.add(table as any, item as any)
      }

      console.log(`Synced ${data.length} ${table} from server`)
    } catch (error) {
      console.error(`Failed to sync ${table} from server:`, error)
    }
  }

  // File operations
  async storeFile(file: File, metadata: Record<string, unknown>): Promise<string> {
    if (!this.db) throw new Error('Database not initialized')

    try {
      const fileId = `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      
      // In Electron, we can store files on the file system
      if (this.isElectron && window.electronAPI) {
        try {
          const appPath = await window.electronAPI.getAppPath()
          const filePath = `${appPath}/files/${fileId}-${file.name}`
          
          // Convert file to buffer for storage
          const arrayBuffer = await file.arrayBuffer()
          const buffer = Buffer.from(arrayBuffer)
          
          // Store file on disk
          await window.electronAPI.writeFile(filePath, buffer.toString('base64'))
          
          // Store metadata in IndexedDB
          const fileData: FileData = {
            id: fileId,
            userId: 'default', // This should be passed as parameter
            name: file.name,
            type: file.type,
            size: file.size,
            filePath, // Store the file path instead of data
            metadata,
            createdAt: new Date(),
            updatedAt: new Date()
          }

          await this.db.add('files', fileData)
          return fileId
        } catch (electronError) {
          console.warn('Failed to store file on disk, falling back to IndexedDB:', electronError)
        }
      }
      
      // Fallback to IndexedDB storage
      const fileData: FileData = {
        id: fileId,
        userId: 'default', // This should be passed as parameter
        name: file.name,
        type: file.type,
        size: file.size,
        data: await file.arrayBuffer(),
        metadata,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      await this.db.add('files', fileData)
      return fileId
    } catch (error) {
      console.error('Failed to store file:', error)
      throw error
    }
  }

  async getFile(fileId: string): Promise<File | null> {
    if (!this.db) throw new Error('Database not initialized')

    try {
      const fileData = await this.db.get('files', fileId) as FileData | undefined
      if (!fileData) return null

      // In Electron, try to read from file system first
      if (this.isElectron && window.electronAPI && fileData.filePath) {
        try {
          const result = await window.electronAPI.readFile(fileData.filePath)
          if (result.success && result.data) {
            const buffer = Buffer.from(result.data, 'base64')
            const blob = new Blob([buffer], { type: fileData.type })
            return new File([blob], fileData.name, { type: fileData.type })
          }
        } catch (electronError) {
          console.warn('Failed to read file from disk, falling back to IndexedDB:', electronError)
        }
      }

      // Fallback to IndexedDB
      if (fileData.data) {
        const blob = new Blob([fileData.data], { type: fileData.type })
        return new File([blob], fileData.name, { type: fileData.type })
      }

      return null
    } catch (error) {
      console.error('Failed to get file:', error)
      return null
    }
  }

  // Utility methods
  async clearAllData(): Promise<void> {
    if (!this.db) return

    try {
      const storeNames = ['subjects', 'tasks', 'studySessions', 'testMarks', 'goals', 'skills', 'files', 'documents']
      for (const storeName of storeNames) {
        await this.db.clear(storeName as any)
      }
      console.log('Cleared all local data')
    } catch (error) {
      console.error('Failed to clear data:', error)
    }
  }

  async getStorageInfo(): Promise<{ used: number; available: number }> {
    if (!navigator.storage || !navigator.storage.estimate) {
      return { used: 0, available: 0 }
    }

    try {
      const estimate = await navigator.storage.estimate()
      return {
        used: estimate.usage || 0,
        available: estimate.quota || 0
      }
    } catch (error) {
      console.error('Failed to get storage info:', error)
      return { used: 0, available: 0 }
    }
  }
}

// Export singleton instance
export const localStorage = new LocalStorageService()
export default localStorage
