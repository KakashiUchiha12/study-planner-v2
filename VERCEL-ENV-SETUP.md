# 🔑 Vercel Environment Variables Setup

## 🎯 **Required Environment Variables:**

### **1. NEXTAUTH_URL**
- **Key**: `NEXTAUTH_URL`
- **Value**: `https://your-app-name.vercel.app`
- **Replace**: `your-app-name` with your actual Vercel app name

### **2. NEXTAUTH_SECRET**
- **Key**: `NEXTAUTH_SECRET`
- **Value**: `1ada9279bf32f3e0a95111c88f26de46da2435b20fb13d5ea6fb4d0958bca208`
- **This is**: A secure random key for NextAuth.js

## 🚀 **How to Set in Vercel:**

1. **Go to your Vercel project dashboard**
2. **Click "Settings" tab**
3. **Click "Environment Variables"**
4. **Add each variable:**

### **Variable 1:**
- **Name**: `NEXTAUTH_URL`
- **Value**: `https://your-app-name.vercel.app`
- **Environment**: Production, Preview, Development

### **Variable 2:**
- **Name**: `NEXTAUTH_SECRET`
- **Value**: `1ada9279bf32f3e0a95111c88f26de46da2435b20fb13d5ea6fb4d0958bca208`
- **Environment**: Production, Preview, Development

## ⚠️ **Important Notes:**

- **NEXTAUTH_URL** must match your actual Vercel domain
- **NEXTAUTH_SECRET** should be kept secure and private
- **Set for all environments** (Production, Preview, Development)
- **Redeploy** after adding environment variables

## 🔍 **After Setting Variables:**

1. **Redeploy your app** in Vercel
2. **Test authentication** on your live site
3. **Verify** login/signup works correctly

**Your app will work perfectly once these are set!** 🎉
