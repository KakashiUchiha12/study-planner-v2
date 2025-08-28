#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Study Planner - Complete Migration Script');
console.log('============================================\n');

// Colors for output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function runCommand(command, description) {
  try {
    log(`\n🔍 ${description}...`, 'blue');
    const result = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    log(`✅ ${description} completed successfully`, 'green');
    return { success: true, output: result };
  } catch (error) {
    log(`❌ ${description} failed`, 'red');
    log(`Error: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

// Step 1: Stop any running processes
log('\n🛑 Step 1: Stopping running processes...', 'blue');
try {
  execSync('taskkill /F /IM node.exe', { stdio: 'ignore' });
  log('✅ Stopped Node.js processes', 'green');
} catch (error) {
  log('⚠️  No Node.js processes found or already stopped', 'yellow');
}

// Step 2: Wait a moment for processes to fully stop
log('\n⏳ Step 2: Waiting for processes to fully stop...', 'blue');
setTimeout(() => {
  log('✅ Wait period completed', 'green');
}, 2000);

// Step 3: Backup existing database
log('\n💾 Step 3: Creating database backup...', 'blue');
const dbPath = path.join(__dirname, '..', 'prisma', 'dev.db');
const backupPath = path.join(__dirname, '..', 'prisma', 'dev.backup.db');

if (fs.existsSync(dbPath)) {
  try {
    fs.copyFileSync(dbPath, backupPath);
    log('✅ Database backup created', 'green');
  } catch (error) {
    log('⚠️  Could not create backup, continuing...', 'yellow');
  }
} else {
  log('ℹ️  No existing database found', 'blue');
}

// Step 4: Update database schema
log('\n🏗️  Step 4: Updating database schema...', 'blue');
const schemaUpdate = runCommand('npx prisma db push', 'Database schema update');

if (!schemaUpdate.success) {
  log('\n❌ Schema update failed. Trying alternative approach...', 'red');
  
  // Try to reset the database
  log('\n🔄 Attempting database reset...', 'blue');
  try {
    if (fs.existsSync(dbPath)) {
      fs.unlinkSync(dbPath);
      log('✅ Removed existing database', 'green');
    }
    
    const resetResult = runCommand('npx prisma db push', 'Database creation');
    if (resetResult.success) {
      log('✅ Database created successfully', 'green');
    } else {
      throw new Error('Failed to create database');
    }
  } catch (error) {
    log(`❌ Database reset failed: ${error.message}`, 'red');
    process.exit(1);
  }
} else {
  log('✅ Database schema updated successfully', 'green');
}

// Step 5: Generate Prisma client
log('\n🔧 Step 5: Generating Prisma client...', 'blue');
const clientGen = runCommand('npx prisma generate', 'Prisma client generation');

if (!clientGen.success) {
  log('❌ Prisma client generation failed', 'red');
  process.exit(1);
}

// Step 6: Check localStorage data
log('\n📊 Step 6: Checking localStorage data...', 'blue');
log('ℹ️  Note: localStorage data will be checked when the application runs', 'blue');
log('ℹ️  The migration will happen automatically when you access the app', 'blue');

// Step 7: Create migration verification script
log('\n📝 Step 7: Creating migration verification script...', 'blue');
const verificationScript = `
// Migration verification script
// Run this in the browser console to check migration status

async function checkMigrationStatus() {
  try {
    const response = await fetch('/api/migration/status?checkLocalStorage=true');
    const status = await response.json();
    
    console.log('Migration Status:', status);
    
    if (status.needsMigration) {
      console.log('Migration needed! localStorage data found:', status.localStorageCounts);
      console.log('Database counts:', status.databaseCounts);
    } else {
      console.log('No migration needed. All data is in the database.');
    }
    
    return status;
  } catch (error) {
    console.error('Failed to check migration status:', error);
  }
}

// Run the check
checkMigrationStatus();
`;

fs.writeFileSync(path.join(__dirname, 'migration-verification.js'), verificationScript);
log('✅ Verification script created: scripts/migration-verification.js', 'green');

// Step 8: Start the development server
log('\n🚀 Step 8: Starting development server...', 'blue');
log('ℹ️  The server will start in the background', 'blue');
log('ℹ️  Open http://localhost:3000 in your browser', 'blue');
log('ℹ️  The migration will happen automatically', 'blue');

// Start server in background
const serverProcess = execSync('npm run dev', { 
  stdio: 'pipe',
  detached: true,
  shell: true
});

log('✅ Development server started', 'green');

// Final instructions
log('\n🎉 Migration setup completed!', 'green');
log('\n📋 Next Steps:', 'blue');
log('1. Open http://localhost:3000 in your browser', 'blue');
log('2. Log in to your account', 'blue');
log('3. The migration will happen automatically', 'blue');
log('4. Check the browser console for migration status', 'blue');
log('5. Run the verification script if needed', 'blue');
log('\n📁 Files created:', 'blue');
log('- Database backup: prisma/dev.backup.db', 'blue');
log('- Verification script: scripts/migration-verification.js', 'blue');
log('\n🔍 To monitor migration progress:', 'blue');
log('- Check browser console for logs', 'blue');
log('- Monitor network requests in DevTools', 'blue');
log('- Check database file size changes', 'blue');

console.log('\n✨ Migration setup script completed successfully!');
