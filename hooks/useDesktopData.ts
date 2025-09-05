import { useState, useEffect, useCallback } from 'react';
import { desktopDB } from '@/lib/desktop-database';

// Check if running in Electron
const isElectron = typeof window !== 'undefined' && window.electronAPI;

export function useDesktopData() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  // Initialize database
  useEffect(() => {
    const initDB = async () => {
      try {
        await desktopDB.initialize();
        setIsInitialized(true);
        console.log('Desktop database initialized');
      } catch (error) {
        console.error('Failed to initialize desktop database:', error);
      }
    };

    if (isElectron) {
      initDB();
    } else {
      setIsInitialized(true);
    }
  }, []);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Export data
  const exportData = useCallback(async () => {
    if (!isElectron || !isInitialized) return null;
    
    try {
      const data = await desktopDB.exportData();
      
      // Use Electron API to save file
      if (!window.electronAPI) {
        throw new Error('Electron API not available');
      }
      
      const result = await window.electronAPI.showSaveDialog({
        defaultPath: `studyplanner-backup-${new Date().toISOString().split('T')[0]}.json`,
        filters: [
          { name: 'JSON Files', extensions: ['json'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      });

      if (!result.canceled && result.filePath) {
        // In a real implementation, you'd write the file here
        // For now, we'll just return the data
        return { success: true, data, filePath: result.filePath };
      }
      
      return { success: false, canceled: true };
    } catch (error) {
      console.error('Export failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }, [isElectron, isInitialized]);

  // Import data
  const importData = useCallback(async () => {
    if (!isElectron || !isInitialized) return null;
    
    try {
      if (!window.electronAPI) {
        throw new Error('Electron API not available');
      }
      
      const result = await window.electronAPI.showOpenDialog({
        properties: ['openFile'],
        filters: [
          { name: 'JSON Files', extensions: ['json'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      });

      if (!result.canceled && result.filePaths.length > 0) {
        // In a real implementation, you'd read the file here
        // For now, we'll just return the file path
        return { success: true, filePath: result.filePaths[0] };
      }
      
      return { success: false, canceled: true };
    } catch (error) {
      console.error('Import failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }, [isElectron, isInitialized]);

  return {
    isElectron,
    isInitialized,
    isOnline,
    exportData,
    importData
  };
}

// Desktop-specific subjects hook
export function useDesktopSubjects() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isElectron, isInitialized } = useDesktopData();

  const loadSubjects = useCallback(async () => {
    if (!isElectron || !isInitialized) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await desktopDB.getSubjects();
      setSubjects(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load subjects');
    } finally {
      setLoading(false);
    }
  }, [isElectron, isInitialized]);

  useEffect(() => {
    loadSubjects();
  }, [loadSubjects]);

  const createSubject = useCallback(async (subjectData: any) => {
    if (!isElectron || !isInitialized) return null;
    
    try {
      const newSubject = await desktopDB.createSubject(subjectData);
      setSubjects(prev => [...prev, newSubject]);
      return newSubject;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create subject');
      return null;
    }
  }, [isElectron, isInitialized]);

  const updateSubject = useCallback(async (id: string, updates: any) => {
    if (!isElectron || !isInitialized) return null;
    
    try {
      const updatedSubject = await desktopDB.updateSubject(id, updates);
      setSubjects(prev => prev.map(s => s.id === id ? updatedSubject : s));
      return updatedSubject;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update subject');
      return null;
    }
  }, [isElectron, isInitialized]);

  const deleteSubject = useCallback(async (id: string) => {
    if (!isElectron || !isInitialized) return false;
    
    try {
      await desktopDB.deleteSubject(id);
      setSubjects(prev => prev.filter(s => s.id !== id));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete subject');
      return false;
    }
  }, [isElectron, isInitialized]);

  return {
    subjects,
    loading,
    error,
    createSubject,
    updateSubject,
    deleteSubject,
    refreshSubjects: loadSubjects
  };
}

// Desktop-specific tasks hook
export function useDesktopTasks() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isElectron, isInitialized } = useDesktopData();

  const loadTasks = useCallback(async () => {
    if (!isElectron || !isInitialized) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await desktopDB.getTasks();
      setTasks(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [isElectron, isInitialized]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const createTask = useCallback(async (taskData: any) => {
    if (!isElectron || !isInitialized) return null;
    
    try {
      const newTask = await desktopDB.createTask(taskData);
      setTasks(prev => [...prev, newTask]);
      return newTask;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task');
      return null;
    }
  }, [isElectron, isInitialized]);

  const updateTask = useCallback(async (id: string, updates: any) => {
    if (!isElectron || !isInitialized) return null;
    
    try {
      const updatedTask = await desktopDB.updateTask(id, updates);
      setTasks(prev => prev.map(t => t.id === id ? updatedTask : t));
      return updatedTask;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update task');
      return null;
    }
  }, [isElectron, isInitialized]);

  const deleteTask = useCallback(async (id: string) => {
    if (!isElectron || !isInitialized) return false;
    
    try {
      await desktopDB.deleteTask(id);
      setTasks(prev => prev.filter(t => t.id !== id));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete task');
      return false;
    }
  }, [isElectron, isInitialized]);

  return {
    tasks,
    loading,
    error,
    createTask,
    updateTask,
    deleteTask,
    refreshTasks: loadTasks
  };
}
