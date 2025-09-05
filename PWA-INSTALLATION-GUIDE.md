# StudyPlanner PWA Installation Guide

## 🚀 Quick Installation

### Method 1: Automatic Installer
1. **Start the server:**
   ```bash
   npm run dev
   ```

2. **Open the installer:**
   - Go to: `http://localhost:3000/pwa-installer.html`
   - Click "Install StudyPlanner" button

### Method 2: Browser Install Button
1. **Start the server:**
   ```bash
   npm run dev
   ```

2. **Open the app:**
   - Go to: `http://localhost:3000`

3. **Look for install button:**
   - **Chrome/Edge:** Install icon in address bar
   - **Firefox:** Three dots menu → Install

### Method 3: Manual Installation
1. **Open Developer Tools:** Press `F12`
2. **Go to Application tab** (Chrome) or **Storage tab** (Firefox)
3. **Click "Manifest"** in the left sidebar
4. **Click "Add to homescreen"** button

## 🖥️ Desktop Shortcut

### Create Desktop Shortcut:
1. **Run the shortcut creator:**
   ```bash
   create-desktop-shortcut.bat
   ```

2. **Use the shortcut:**
   - Start server: `npm run dev`
   - Double-click "StudyPlanner" on desktop
   - Install PWA when prompted

## 📱 Mobile Installation

### Android (Chrome):
1. Open `http://localhost:3000` in Chrome
2. Tap the three dots menu
3. Select "Add to Home screen"
4. Tap "Add"

### iOS (Safari):
1. Open `http://localhost:3000` in Safari
2. Tap the share button
3. Select "Add to Home Screen"
4. Tap "Add"

## 🔧 Troubleshooting

### Install Button Not Showing:
1. **Check PWA requirements:**
   - Go to: `http://localhost:3000/pwa-installer.html`
   - Check if all requirements are met

2. **Clear browser cache:**
   - Press `Ctrl+Shift+Delete`
   - Clear cache and cookies

3. **Try different browser:**
   - Chrome/Edge work best for PWA installation

### App Not Working Offline:
1. **Check service worker:**
   - Press `F12` → Application tab → Service Workers
   - Should show "Active and running"

2. **Check manifest:**
   - Press `F12` → Application tab → Manifest
   - Should show manifest details

## 🎯 Features After Installation

✅ **Desktop App Experience**
- Runs in standalone window
- No browser UI
- Desktop icon

✅ **Offline Functionality**
- Works without internet
- Local data storage
- Automatic sync when online

✅ **Native Feel**
- App-like interface
- Fast loading
- Responsive design

## 📞 Support

If you encounter any issues:
1. Check the PWA installer: `http://localhost:3000/pwa-installer.html`
2. Verify all requirements are met
3. Try different browsers
4. Clear browser cache

---

**Happy Studying! 📚**
