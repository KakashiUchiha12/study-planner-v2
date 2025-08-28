#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Study Planner - Production Deployment Script');
console.log('=============================================\n');

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

function checkFileExists(filePath) {
  return fs.existsSync(filePath);
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

// Check prerequisites
log('\n📋 Checking Prerequisites...', 'blue');

if (!checkFileExists('package.json')) {
  log('❌ package.json not found!', 'red');
  process.exit(1);
}

if (!checkFileExists('next.config.mjs')) {
  log('❌ next.config.mjs not found!', 'red');
  process.exit(1);
}

log('✅ Basic project structure verified', 'green');

// Check if build exists
if (!checkFileExists('.next')) {
  log('❌ Build directory (.next) not found!', 'red');
  log('Please run: npm run build:production', 'yellow');
  process.exit(1);
}

log('✅ Build directory found', 'green');

// Check environment file
if (!checkFileExists('.env.local')) {
  log('⚠️  .env.local not found - you may need to create this for production', 'yellow');
  log('   Copy env.example to .env.local and fill in your values', 'yellow');
} else {
  log('✅ Environment file found', 'green');
}

// Check build output
log('\n🔍 Checking Build Output...', 'blue');

if (checkFileExists('.next/standalone')) {
  log('✅ Standalone build detected (good for Docker)', 'green');
}

if (checkFileExists('.next/static')) {
  log('✅ Static assets generated', 'green');
}

// Get build size
const stats = fs.statSync('.next');
const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
log(`📊 Build size: ${sizeInMB} MB`, 'blue');

// Deployment options
log('\n🚀 Deployment Options Available:', 'blue');
log('1. Vercel (Recommended for Next.js)', 'blue');
log('2. Netlify', 'blue');
log('3. Docker (Self-hosted)', 'blue');
log('4. Manual deployment', 'blue');

log('\n📋 Next Steps for Production Deployment:', 'blue');
log('1. Set up your production environment variables', 'blue');
log('2. Choose your deployment platform:', 'blue');
log('   - Vercel: npm i -g vercel && vercel --prod', 'blue');
log('   - Netlify: Deploy .next folder', 'blue');
log('   - Docker: docker build -t study-planner .', 'blue');
log('3. Configure your domain and SSL', 'blue');
log('4. Set up monitoring and analytics', 'blue');

log('\n🔧 For detailed instructions, see PRODUCTION.md', 'blue');

// Optional: Start production server for testing
log('\n🧪 Testing Production Build Locally...', 'blue');
log('Starting production server on http://localhost:3000', 'blue');
log('Press Ctrl+C to stop the server', 'yellow');

try {
  execSync('npm run start:production', { stdio: 'inherit' });
} catch (error) {
  log('\n✅ Production server stopped', 'green');
}

log('\n✨ Production deployment script completed!', 'green');
log('Your app is ready for deployment!', 'green');
