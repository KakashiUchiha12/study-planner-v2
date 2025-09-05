# StudyPlanner Windows Desktop Application

A comprehensive study management desktop application built with Electron and Next.js, designed specifically for Windows users.

## Features

### Desktop-Specific Features
- **System Tray Integration**: Minimize to system tray, quick access from tray menu
- **Native Windows Notifications**: Study reminders and progress updates
- **File System Integration**: Store files locally on your computer
- **Keyboard Shortcuts**: Quick access to all major features
- **Offline Support**: Full functionality without internet connection
- **Data Export/Import**: Backup and restore your study data

### Core Study Management Features
- **Subject Management**: Organize your subjects and courses
- **Task Tracking**: Create and manage study tasks with deadlines
- **Study Sessions**: Track your study time and progress
- **Test Marks**: Record and analyze your test scores
- **Goal Setting**: Set and track academic goals
- **File Management**: Attach documents and study materials
- **Calendar Integration**: Visual study schedule and deadlines

## Installation

### Option 1: Installer (Recommended)
1. Download the latest `StudyPlanner-Setup-x.x.x.exe` from the releases
2. Run the installer and follow the setup wizard
3. The app will be installed in your Programs folder
4. Desktop and Start Menu shortcuts will be created automatically

### Option 2: Portable Version
1. Download `StudyPlanner-Portable-x.x.x.exe`
2. Extract to any folder on your computer
3. Run `StudyPlanner.exe` directly (no installation required)
4. Perfect for USB drives or shared computers

## System Requirements

- **Operating System**: Windows 10 or later (64-bit recommended)
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 500MB free space
- **Internet**: Optional (for cloud sync features)

## Quick Start

1. **Launch the Application**
   - Double-click the desktop shortcut or find "StudyPlanner" in your Start Menu
   - The app will start and show the main dashboard

2. **Create Your First Subject**
   - Click "Add Subject" or use `Ctrl+Shift+N`
   - Enter subject name, course code, and description
   - Add study materials and documents

3. **Add Study Tasks**
   - Click "Add Task" or use `Ctrl+N`
   - Set deadlines and priorities
   - Assign tasks to specific subjects

4. **Start Tracking Study Sessions**
   - Click "Start Study Session" or use `Ctrl+S`
   - Select subject and set session duration
   - Track your progress over time

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+N` | New Task |
| `Ctrl+Shift+N` | New Subject |
| `Ctrl+S` | Start Study Session |
| `Ctrl+D` | Dashboard |
| `Ctrl+T` | Tasks |
| `Ctrl+Shift+T` | Subjects |
| `Ctrl+Q` | Quit Application |

## System Tray Features

When minimized, StudyPlanner runs in your system tray:

- **Double-click tray icon**: Show/hide main window
- **Right-click tray icon**: Access quick menu
  - Show StudyPlanner
  - Dashboard
  - New Task
  - Quit

## Data Management

### Exporting Data
1. Go to File menu → Export Data
2. Choose location and filename
3. All your data will be saved as a JSON file

### Importing Data
1. Go to File menu → Import Data
2. Select your backup JSON file
3. Data will be restored and app will restart

### Automatic Backups
- Data is automatically saved locally
- No internet connection required
- Files stored in your user data directory

## File Storage

### Local File Storage
- Study materials and documents are stored on your computer
- Files are organized by subject and user
- No file size limits (limited by available disk space)

### File Types Supported
- PDF documents
- Images (JPG, PNG, GIF)
- Text files
- Office documents (Word, Excel, PowerPoint)
- And more...

## Troubleshooting

### App Won't Start
1. Check if you have Windows 10 or later
2. Try running as administrator
3. Check Windows Defender or antivirus settings
4. Reinstall the application

### Performance Issues
1. Close other applications to free up memory
2. Restart the application
3. Check available disk space
4. Update to the latest version

### Data Issues
1. Use the Export/Import feature to backup data
2. Check if files are being blocked by antivirus
3. Ensure you have write permissions to the app directory

### System Tray Issues
1. Check if system tray is enabled in Windows
2. Look for the StudyPlanner icon in hidden icons
3. Restart the application

## Advanced Features

### Offline Mode
- Full functionality without internet
- Data syncs when connection is restored
- Local file storage always available

### Multi-User Support
- Each Windows user has separate data
- No data sharing between user accounts
- Secure local storage

### Customization
- Dark/Light theme support
- Customizable dashboard
- Flexible task and subject organization

## Support

### Getting Help
1. Check this README for common issues
2. Use the Help menu in the application
3. Check keyboard shortcuts in Help → Keyboard Shortcuts

### Reporting Issues
- Include your Windows version
- Describe the exact steps to reproduce the issue
- Include any error messages

## Updates

### Automatic Updates
- The app will check for updates on startup
- Notifications will appear when updates are available
- Updates can be downloaded and installed automatically

### Manual Updates
1. Download the latest version from the website
2. Run the installer (it will update the existing installation)
3. Your data will be preserved

## Privacy and Security

- **Local Storage**: All data is stored locally on your computer
- **No Cloud Sync**: Your data never leaves your computer unless you explicitly export it
- **Secure**: Uses Windows security features and encrypted local storage
- **No Tracking**: No usage analytics or personal data collection

## Uninstallation

### Using Windows Settings
1. Go to Settings → Apps → Apps & features
2. Find "StudyPlanner" in the list
3. Click "Uninstall"

### Using Control Panel
1. Open Control Panel → Programs → Uninstall a program
2. Find "StudyPlanner" in the list
3. Right-click and select "Uninstall"

### Data Preservation
- Your data will be preserved in the user data directory
- You can manually delete the data folder if desired
- Location: `%APPDATA%/StudyPlanner/`

## License

This application is provided as-is for educational and personal use. See the main project license for details.

---

**StudyPlanner Desktop** - Organize Your Academic Success
