# 🚀 StudyPlanner cPanel Deployment Checklist

## **✅ Pre-Deployment (Completed)**
- [x] Application built successfully (`npm run build`)
- [x] Production files generated in `.next/` folder
- [x] Passenger configuration created (`passenger_wsgi.py`)
- [x] Environment template created (`env-production-template.txt`)

## **📋 Step-by-Step Deployment Guide**

### **Step 1: Prepare Your Files**
1. **Create deployment folder**: `studyplanner-deploy/`
2. **Copy these files/folders**:
   - `.next/` (built application)
   - `public/` (static assets)
   - `package.json`
   - `package-lock.json`
   - `next.config.js`
   - `passenger_wsgi.py`
   - `prisma/` (database schema)
   - `lib/` (utilities)
   - `components/` (UI components)
   - `app/` (pages and API routes)

### **Step 2: cPanel Database Setup**
1. **Login to cPanel**
2. **Go to MySQL Databases**
3. **Create new database**:
   - Database name: `studyplanner_db`
   - Database user: `studyplanner_user`
   - Password: `[strong-password]`
   - Host: `localhost`
4. **Note down**: database name, username, password, host

### **Step 3: Environment Configuration**
1. **Create `.env.local`** in your project root
2. **Copy content** from `env-production-template.txt`
3. **Update with real values**:
   ```env
   DATABASE_URL="mysql://studyplanner_user:password@localhost/studyplanner_db"
   NEXTAUTH_URL="https://studyplanner.freemdcat.com"
   NEXTAUTH_SECRET="generate-random-secret-key"
   UPLOAD_DIR="/public_html/studyplanner/uploads"
   ```

### **Step 4: Upload to cPanel**
1. **Use cPanel File Manager** or FTP
2. **Navigate to**: `/public_html/studyplanner/`
3. **Upload all files** from your deployment folder
4. **Ensure structure**:
   ```
   /public_html/studyplanner/
   ├── .next/
   ├── public/
   ├── package.json
   ├── passenger_wsgi.py
   ├── .env.local
   └── [other files]
   ```

### **Step 5: cPanel Application Manager**
1. **Go to Application Manager**
2. **Click "Register New Application"**
3. **Fill in details**:
   - **Application Name**: `studyplanner`
   - **Application Root**: `/public_html/studyplanner`
   - **Application URL**: `https://studyplanner.freemdcat.com`
   - **Application Type**: `Node.js`
   - **Node.js Version**: `18` or `20`
4. **Environment Variables**:
   ```
   NODE_ENV=production
   PORT=3000
   ```

### **Step 6: Install Dependencies & Setup Database**
1. **SSH into your server** (if available)
2. **Navigate to project**:
   ```bash
   cd /public_html/studyplanner
   ```
3. **Install dependencies**:
   ```bash
   npm ci --only=production
   ```
4. **Generate Prisma client**:
   ```bash
   npx prisma generate
   ```
5. **Run database migrations**:
   ```bash
   npx prisma db push
   ```

### **Step 7: Start Application**
1. **In Application Manager**, click "Start Application"
2. **Check logs** for any errors
3. **Visit**: `https://studyplanner.freemdcat.com`

## **🔧 Troubleshooting**

### **Common Issues:**
- **Port conflicts**: Ensure port 3000 is available
- **Database connection**: Verify DATABASE_URL format
- **File permissions**: Set proper permissions (755 for folders, 644 for files)
- **Node.js version**: Ensure compatibility with your hosting

### **File Permissions:**
```bash
chmod 755 /public_html/studyplanner
chmod 644 /public_html/studyplanner/.env.local
chmod -R 755 /public_html/studyplanner/.next
chmod -R 755 /public_html/studyplanner/public
```

## **📞 Need Help?**
- Check cPanel error logs
- Verify all environment variables
- Ensure database is accessible
- Confirm Node.js version compatibility

## **🎯 Next Steps After Deployment**
1. **Test all features** (login, database operations, file uploads)
2. **Set up SSL certificate** (if not auto-configured)
3. **Configure backups** for database and files
4. **Monitor performance** and logs
5. **Set up monitoring** and alerts

---
**Good luck with your deployment! 🚀**
