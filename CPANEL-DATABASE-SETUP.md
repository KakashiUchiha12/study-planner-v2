# 🗄️ cPanel Database Setup Guide

## 📋 **Prerequisites:**
- cPanel access
- phpMyAdmin access
- Basic understanding of databases

## 🚀 **Step-by-Step Database Creation:**

### **Step 1: Access phpMyAdmin**
1. **Login to your cPanel**
2. **Find "Databases" section**
3. **Click "phpMyAdmin"**
4. **Wait for phpMyAdmin to load**

### **Step 2: Create New Database**
1. **Click "New" in the left sidebar**
2. **Enter database name**: `study_planner_db`
3. **Choose collation**: `utf8mb4_unicode_ci`
4. **Click "Create"**

### **Step 3: Create Database User**
1. **Go to "User accounts" tab**
2. **Click "Add user account"**
3. **Fill in the details:**
   - **User name**: `study_planner_user`
   - **Host name**: `localhost`
   - **Password**: Create a strong password (save this!)
   - **Re-type password**: Confirm your password
4. **Click "Go"**

### **Step 4: Grant Permissions**
1. **Go back to "Databases" tab**
2. **Find your database** `study_planner_db`
3. **Click "Check All"** for all privileges
4. **Click "Go"** to save

### **Step 5: Import Database Schema**
1. **Select your database** from the left sidebar
2. **Click "Import" tab**
3. **Click "Choose File"** and select `database/schema.sql`
4. **Click "Go"** to import

## 🔑 **Database Connection Details:**

After setup, you'll have:
- **Database Name**: `study_planner_db`
- **Username**: `study_planner_user`
- **Password**: `[your_password]`
- **Host**: `localhost`
- **Port**: `3306` (default)

## ⚠️ **Important Notes:**

1. **Save your password** - you'll need it for the app
2. **Use strong password** - this is production data
3. **Test connection** before proceeding
4. **Backup regularly** - cPanel usually has auto-backup

## 🧪 **Test Your Database:**

After import, you should see:
- ✅ **5 tables created** (users, subjects, tasks, study_sessions, study_goals)
- ✅ **Sample data inserted** (demo user, subjects, tasks)
- ✅ **Indexes created** for performance

## 🚨 **Troubleshooting:**

### **If you get "Access denied":**
- Check user permissions
- Verify database name
- Confirm password

### **If import fails:**
- Check file size (should be small)
- Verify SQL syntax
- Try copying/pasting SQL manually

## 📞 **Need Help?**

If you encounter issues:
1. **Check cPanel error logs**
2. **Verify database user permissions**
3. **Test with simple SQL commands first**

---

**Next Step**: After database setup, we'll connect your Next.js app to it! 🚀
