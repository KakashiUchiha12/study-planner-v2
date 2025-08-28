# 🚀 Quick Setup Instructions

## Step 1: Install Node.js
1. Go to https://nodejs.org/
2. Download the **LTS version** (recommended)
3. Run the installer
4. Restart your terminal/PowerShell

## Step 2: Verify Installation
```powershell
node --version
npm --version
```

## Step 3: Install Dependencies
```powershell
npm install
```

## Step 4: Create Environment File
Create a file named `.env.local` in your project root with:

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# Optional: Add these if you want OAuth login
# GOOGLE_CLIENT_ID=your-google-client-id
# GOOGLE_CLIENT_SECRET=your-google-client-secret
# GITHUB_CLIENT_ID=your-github-client-id
# GITHUB_CLIENT_SECRET=your-github-client-secret
```

## Step 5: Run the App
```powershell
npm run dev
```

## Step 6: Open in Browser
Go to: http://localhost:3000

## Demo Login
- Email: demo@studyplanner.com
- Password: demo123

## Troubleshooting
- If npm is not recognized: Node.js isn't installed properly
- If port 3000 is busy: Try `npm run dev -- --port 3001`
- If build errors: Delete node_modules and run `npm install` again
