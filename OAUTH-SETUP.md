# 🔐 OAuth Authentication Setup Guide

## 🚀 **Google OAuth Setup**

### 1. **Google Cloud Console Setup**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google+ API** and **Google OAuth2 API**

### 2. **Create OAuth 2.0 Credentials**
1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth 2.0 Client IDs**
3. Choose **Web application**
4. Set **Authorized redirect URIs**:
   - `http://localhost:3000/api/auth/callback/google` (Development)
   - `https://yourdomain.com/api/auth/callback/google` (Production)

### 3. **Get Your Credentials**
- **Client ID**: Copy from the credentials page
- **Client Secret**: Copy from the credentials page

---

## 🐙 **GitHub OAuth Setup**

### 1. **GitHub Developer Settings**
1. Go to [GitHub Settings](https://github.com/settings/developers)
2. Click **OAuth Apps** → **New OAuth App**

### 2. **Configure OAuth App**
1. **Application name**: `StudyPlanner`
2. **Homepage URL**: `http://localhost:3000` (Development)
3. **Authorization callback URL**: `http://localhost:3000/api/auth/callback/github`

### 3. **Get Your Credentials**
- **Client ID**: Copy from the OAuth app page
- **Client Secret**: Click **Generate a new client secret**

---

## ⚙️ **Environment Configuration**

### 1. **Create `.env.local` File**
Create this file in your project root:

```env
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-super-secret-key-change-this-in-production-12345

# Google OAuth Provider
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here

# GitHub OAuth Provider
GITHUB_CLIENT_ID=your-github-client-id-here
GITHUB_CLIENT_SECRET=your-github-client-secret-here
```

### 2. **Generate NEXTAUTH_SECRET**
Run this command to generate a secure secret:
```bash
openssl rand -base64 32
```

---

## 🧪 **Testing Authentication**

### 1. **Start Development Server**
```bash
npm run dev
```

### 2. **Test OAuth Flow**
1. Go to `http://localhost:3000/auth/signup`
2. Click **Google** or **GitHub** button
3. Complete OAuth flow
4. Should redirect to `/dashboard` after successful authentication

### 3. **Test Login Flow**
1. Go to `http://localhost:3000/auth/login`
2. Click **Google** or **GitHub** button
3. Complete OAuth flow
4. Should redirect to `/dashboard` after successful authentication

---

## 🚨 **Common Issues & Solutions**

### **Issue: "Invalid OAuth client"**
- **Solution**: Check your Client ID and Client Secret are correct
- **Solution**: Ensure redirect URIs match exactly

### **Issue: "Redirect URI mismatch"**
- **Solution**: Add both development and production URLs to authorized redirects
- **Solution**: Check for trailing slashes in URLs

### **Issue: "OAuth sign-in failed"**
- **Solution**: Verify environment variables are loaded
- **Solution**: Check browser console for detailed error messages

### **Issue: "Callback URL not found"**
- **Solution**: Ensure NextAuth API route is working
- **Solution**: Check `/api/auth/[...nextauth]/route.ts` exists

---

## 🔒 **Security Best Practices**

### 1. **Environment Variables**
- Never commit `.env.local` to version control
- Use different secrets for development and production
- Rotate secrets regularly

### 2. **OAuth Scopes**
- Request minimal scopes needed
- Google: `email profile`
- GitHub: `read:user user:email`

### 3. **Production Deployment**
- Update `NEXTAUTH_URL` to production domain
- Update redirect URIs in OAuth provider settings
- Use HTTPS in production

---

## 📱 **Mobile OAuth Support**

### 1. **Deep Linking**
- Configure deep links for mobile apps
- Handle OAuth callbacks on mobile devices

### 2. **Responsive Design**
- OAuth buttons are mobile-optimized
- Touch-friendly button sizes
- Proper spacing for mobile screens

---

## 🎯 **Next Steps After Setup**

1. **Test all authentication flows**
2. **Implement user profile management**
3. **Add role-based access control**
4. **Set up user data persistence**
5. **Configure email verification (optional)**
6. **Add password reset functionality**

---

## 📞 **Need Help?**

If you encounter issues:
1. Check browser console for errors
2. Verify environment variables are loaded
3. Test OAuth provider settings
4. Check NextAuth.js documentation
5. Review this setup guide again

**Happy coding! 🚀**
