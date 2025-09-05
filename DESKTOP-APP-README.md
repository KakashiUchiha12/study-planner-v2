# StudyPlanner Desktop App

A comprehensive study management desktop application built with Electron and Next.js, featuring complete offline functionality and local data storage.

## Features

### 🖥️ Desktop Application
- **Native Windows Interface**: Full desktop app experience with native menus and shortcuts
- **Offline-First**: Complete functionality without internet connection
- **Local Data Storage**: All data stored locally using IndexedDB
- **Auto-Save**: Automatic data persistence
- **Export/Import**: Backup and restore your data

### 📚 Study Management
- **Subjects**: Organize your courses and subjects
- **Tasks**: Create and manage study tasks with priorities
- **Study Sessions**: Track your study time and productivity
- **Test Marks**: Record and analyze your test scores
- **Goals**: Set and track academic goals
- **Skills**: Develop and track skill progression

### 🎯 Key Features
- **Drag & Drop**: Reorder tasks and subjects easily
- **Progress Tracking**: Visual progress indicators
- **Time Management**: Study timer and session tracking
- **Data Analytics**: Insights into your study patterns
- **Responsive Design**: Works on all screen sizes

## Installation

### Prerequisites
- Windows 10/11
- Node.js 18+ (for development)
- Git (for development)

### Quick Start

1. **Download the Installer**
   - Run `build-desktop-app.bat` to create the installer
   - Install the app from the generated installer in the `dist` folder

2. **Development Setup**
   ```bash
   # Clone the repository
   git clone <repository-url>
   cd study-planner
   
   # Install dependencies
   npm install
   
   # Start development mode
   npm run electron:dev
   ```

## Usage

### Starting the App
- **Desktop**: Double-click the StudyPlanner icon
- **Development**: Run `start-desktop-app.bat`

### Keyboard Shortcuts
- `Ctrl+N`: New Task
- `Ctrl+Shift+N`: New Subject
- `Ctrl+S`: Start Study Session
- `Ctrl+D`: Dashboard
- `Ctrl+T`: Tasks
- `Ctrl+Shift+T`: Subjects
- `Ctrl+Q`: Exit

### Menu Options
- **File**: New items, Export/Import data
- **Edit**: Standard editing operations
- **View**: Zoom, fullscreen, developer tools
- **Study**: Quick access to study features
- **Help**: About, keyboard shortcuts

## Data Management

### Local Storage
- All data is stored locally in your browser's IndexedDB
- No internet connection required
- Data persists between app sessions
- Automatic backups on data changes

### Export/Import
- **Export**: Save all your data to a JSON file
- **Import**: Restore data from a backup file
- **Format**: Human-readable JSON format
- **Security**: All data stays on your computer

### Data Structure
```json
{
  "subjects": [...],
  "tasks": [...],
  "studySessions": [...],
  "testMarks": [...],
  "goals": [...],
  "userSettings": {...},
  "exportDate": "2024-01-01T00:00:00.000Z",
  "version": "1.0.0"
}
```

## Development

### Project Structure
```
study-planner/
├── electron/           # Electron main process
│   ├── main.js        # Main Electron process
│   └── preload.js     # Preload script for security
├── lib/
│   └── desktop-database.ts  # Local database service
├── hooks/
│   └── useDesktopData.ts    # Desktop-specific hooks
├── components/
│   └── desktop-app-wrapper.tsx  # Desktop app wrapper
├── app/               # Next.js app directory
├── public/            # Static assets
└── dist/              # Built application
```

### Available Scripts
- `npm run electron:dev`: Start development mode
- `npm run electron:build`: Build for Windows
- `npm run electron:build:all`: Build for all platforms
- `npm run build`: Build Next.js app
- `npm run dev`: Start Next.js development server

### Building the App
1. **Development Build**
   ```bash
   npm run electron:dev
   ```

2. **Production Build**
   ```bash
   npm run electron:build
   ```

3. **All Platforms**
   ```bash
   npm run electron:build:all
   ```

## Technical Details

### Architecture
- **Frontend**: Next.js 15 with React 18
- **Desktop**: Electron 28+
- **Database**: IndexedDB (local storage)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Build**: Electron Builder

### Security
- **Context Isolation**: Enabled for security
- **Node Integration**: Disabled in renderer
- **Preload Script**: Secure IPC communication
- **Local Data**: No external data transmission

### Performance
- **Lazy Loading**: Components loaded on demand
- **Code Splitting**: Optimized bundle sizes
- **Caching**: Aggressive caching for offline use
- **Memory Management**: Efficient data handling

## Troubleshooting

### Common Issues

1. **App Won't Start**
   - Check if Node.js is installed
   - Run `npm install` to install dependencies
   - Check console for error messages

2. **Data Not Saving**
   - Check browser storage permissions
   - Clear browser cache and restart
   - Check available disk space

3. **Import/Export Issues**
   - Ensure file is valid JSON format
   - Check file permissions
   - Try exporting first to test format

4. **Performance Issues**
   - Close other applications
   - Clear old data if needed
   - Restart the application

### Getting Help
- Check the console for error messages
- Try restarting the application
- Clear browser cache if needed
- Check available disk space

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Support

For support and questions:
- Check the troubleshooting section
- Review the console for error messages
- Create an issue on GitHub

---

**StudyPlanner Desktop App** - Your personal study management solution
