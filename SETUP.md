# StudyPlanner - Enhanced Setup Guide

## 🚀 Features Implemented

### ✅ Mobile UI Improvements
- Responsive header with sticky positioning
- Optimized button sizes and spacing for mobile
- Better grid layouts for different screen sizes
- Custom breakpoint for extra small screens (xs: 480px)

### ✅ NextAuth.js Authentication
- Google and GitHub OAuth providers
- Credentials provider with demo account
- Secure session management
- Protected routes

### ✅ Real-time Synchronization
- Pusher integration for live updates
- Real-time task synchronization
- User-specific channels
- Automatic data sync across devices

### ✅ Advanced Analytics
- Comprehensive study time analysis
- Subject performance radar charts
- Productivity patterns by hour
- Task completion analytics
- Weekly comparison trends
- Detailed insights and recommendations

### ✅ File Upload System
- UploadThing integration
- Drag & drop interface
- Progress tracking
- Multiple file types support (images, PDFs, documents)
- File preview and management

### ✅ Smart Notifications
- Browser notifications
- Toast notifications
- Study reminders
- Deadline alerts
- Achievement notifications
- Goal completion tracking

## 🛠️ Setup Instructions

### 1. Install Dependencies

```bash
npm install
# or
pnpm install
```

### 2. Environment Variables

Create a `.env.local` file in the root directory:

```env
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-change-this-in-production

# OAuth Providers
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# UploadThing (for file uploads)
UPLOADTHING_SECRET=your-uploadthing-secret
UPLOADTHING_APP_ID=your-uploadthing-app-id

# Pusher (for real-time sync)
PUSHER_APP_ID=your-pusher-app-id
PUSHER_KEY=your-pusher-key
PUSHER_SECRET=your-pusher-secret
PUSHER_CLUSTER=your-pusher-cluster

# Public Pusher Keys (add to .env.local)
NEXT_PUBLIC_PUSHER_KEY=your-pusher-key
NEXT_PUBLIC_PUSHER_CLUSTER=your-pusher-cluster
```

### 3. Service Setup

#### Google OAuth Setup:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`

#### GitHub OAuth Setup:
1. Go to GitHub Settings → Developer settings → OAuth Apps
2. Create a new OAuth App
3. Set Authorization callback URL: `http://localhost:3000/api/auth/callback/github`

#### UploadThing Setup:
1. Sign up at [UploadThing](https://uploadthing.com/)
2. Create a new app
3. Get your App ID and Secret from the dashboard

#### Pusher Setup:
1. Sign up at [Pusher](https://pusher.com/)
2. Create a new Channels app
3. Get your app credentials from the dashboard

### 4. Run the Development Server

```bash
npm run dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## 🎯 Demo Account

Use these credentials to test the app:
- **Email:** demo@studyplanner.com
- **Password:** demo123

## 📱 Mobile Optimizations

The app now features:
- Responsive navigation with collapsible elements
- Touch-friendly button sizes
- Optimized layouts for small screens
- Sticky headers with backdrop blur
- Mobile-first grid systems

## 🔔 Notification Features

- **Study Reminders:** Get notified when it's time to study
- **Deadline Alerts:** Never miss a task deadline
- **Achievement Badges:** Celebrate your progress
- **Goal Tracking:** Stay motivated with goal notifications
- **Browser Notifications:** Native browser notification support

## 📊 Analytics Dashboard

Advanced analytics include:
- **Daily Study Trends:** Track your daily study patterns
- **Subject Performance:** Radar charts showing progress across subjects
- **Productivity Analysis:** Identify your most productive hours
- **Goal Achievement:** Monitor your study goal progress
- **Performance Insights:** AI-powered recommendations

## 📁 File Management

- **Drag & Drop Upload:** Easy file uploading interface
- **Progress Tracking:** Real-time upload progress
- **File Preview:** Preview images and documents
- **Organized Storage:** Files organized by subject and material
- **Cloud Storage:** Secure cloud storage via UploadThing

## 🔄 Real-time Features

- **Live Sync:** Changes sync instantly across devices
- **Collaborative Features:** Ready for study group features
- **Real-time Notifications:** Instant alerts and updates
- **Cross-device Consistency:** Same data everywhere

## 🚀 Production Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push

### Environment Variables for Production

Make sure to update these for production:
- `NEXTAUTH_URL` → Your production domain
- `NEXTAUTH_SECRET` → Generate a secure secret
- Update OAuth redirect URIs to production URLs

## 🔧 Customization

### Adding New Notification Types

```typescript
// In lib/notifications.ts
notificationManager.addNotification({
  type: "custom",
  title: "Custom Notification",
  message: "Your custom message",
  actionUrl: "/custom-page"
})
```

### Extending Analytics

Add new charts in `components/analytics/advanced-analytics.tsx`:

```typescript
// Add new data processing
const customAnalysis = useMemo(() => {
  // Your custom analytics logic
}, [data])
```

### Custom File Upload Handlers

Extend the file upload component in `components/file-upload.tsx`:

```typescript
const { startUpload } = useUploadThing("customUploader", {
  onClientUploadComplete: (res) => {
    // Custom completion handler
  }
})
```

## 🐛 Troubleshooting

### Common Issues:

1. **OAuth not working:** Check redirect URIs match exactly
2. **File uploads failing:** Verify UploadThing credentials
3. **Real-time sync issues:** Check Pusher configuration
4. **Mobile layout issues:** Clear browser cache and test

### Development Tips:

- Use browser dev tools to test mobile layouts
- Check browser console for authentication errors
- Monitor network tab for API call issues
- Test notifications in different browsers

## 📝 Next Steps

Consider implementing:
- Database integration (PostgreSQL/MongoDB)
- Advanced study scheduling
- Collaborative study groups
- Mobile app (React Native)
- AI-powered study recommendations
- Integration with calendar apps

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.
