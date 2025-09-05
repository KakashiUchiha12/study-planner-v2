interface SaveDialogOptions {
  defaultPath?: string
  filters?: Array<{ name: string; extensions: string[] }>
}

interface SaveDialogResult {
  canceled: boolean
  filePath?: string
}

interface OpenDialogOptions {
  properties?: string[]
  filters?: Array<{ name: string; extensions: string[] }>
}

interface OpenDialogResult {
  canceled: boolean
  filePaths: string[]
}

interface MessageBoxOptions {
  type?: 'info' | 'warning' | 'error' | 'question'
  title?: string
  message?: string
  detail?: string
}

interface MessageBoxResult {
  response: number
}

interface NotificationOptions {
  title?: string
  body?: string
  silent?: boolean
}

export interface ElectronAPI {
  // App info
  getAppVersion: () => Promise<string>;
  getAppPath: () => Promise<string>;
  
  // Dialog methods
  showSaveDialog: (options: SaveDialogOptions) => Promise<SaveDialogResult>;
  showOpenDialog: (options: OpenDialogOptions) => Promise<OpenDialogResult>;
  showMessageBox: (options: MessageBoxOptions) => Promise<MessageBoxResult>;
  
  // File operations
  writeFile: (filePath: string, data: string) => Promise<{ success: boolean; error?: string }>;
  readFile: (filePath: string) => Promise<{ success: boolean; data?: string; error?: string }>;
  
  // Notifications
  showNotification: (options: NotificationOptions) => Promise<{ success: boolean; error?: string }>;
  
  // Window management
  minimizeWindow: () => Promise<void>;
  maximizeWindow: () => Promise<void>;
  closeWindow: () => Promise<void>;
  
  // Menu event listeners
  onMenuNewTask: (callback: () => void) => void;
  onMenuNewSubject: (callback: () => void) => void;
  onMenuExportData: (callback: () => void) => void;
  onMenuImportData: (callback: () => void) => void;
  onMenuStartStudy: (callback: () => void) => void;
  onMenuDashboard: (callback: () => void) => void;
  onMenuTasks: (callback: () => void) => void;
  onMenuSubjects: (callback: () => void) => void;
  onMenuShortcuts: (callback: () => void) => void;
  
  // Remove listeners
  removeAllListeners: (channel: string) => void;
  
  // Platform info
  platform: string;
  
  // Local storage helpers
  localStorage: {
    getItem: (key: string) => string | null;
    setItem: (key: string, value: string) => boolean;
    removeItem: (key: string) => boolean;
    clear: () => boolean;
  };
}

export interface DesktopAPI {
  isElectron: boolean;
  getUserDataPath: () => string;
  saveFile: (data: any, filename: string) => Promise<{ success: boolean; filePath?: string; canceled?: boolean; error?: string }>;
  openFile: () => Promise<{ success: boolean; filePath?: string; canceled?: boolean; error?: string }>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
    desktopAPI?: DesktopAPI;
  }
}
