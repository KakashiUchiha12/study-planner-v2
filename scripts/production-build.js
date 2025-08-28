#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Study Planner - Production Build Script');
console.log('==========================================\n');

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

// Check environment file
if (!checkFileExists('.env.local')) {
  log('⚠️  .env.local not found - you may need to create this for production', 'yellow');
  log('   Copy env.example to .env.local and fill in your values', 'yellow');
} else {
  log('✅ Environment file found', 'green');
}

// Run type checking
const typeCheck = runCommand('npm run type-check', 'Type checking');
if (!typeCheck.success) {
  log('\n⚠️  TypeScript errors found. These should be fixed before production deployment.', 'yellow');
  log('   Consider running: npm run lint:fix', 'yellow');
}

// Run linting
const lint = runCommand('npm run lint', 'Linting');
if (!lint.success) {
  log('\n⚠️  Linting issues found. These should be fixed before production deployment.', 'yellow');
  log('   Consider running: npm run lint:fix', 'yellow');
}

// Run tests
const tests = runCommand('npm run test:quick', 'Quick tests');
if (!tests.success) {
  log('\n⚠️  Tests failed. These should be fixed before production deployment.', 'yellow');
}

// Clean build directory
log('\n🧹 Cleaning build directory...', 'blue');
if (fs.existsSync('.next')) {
  fs.rmSync('.next', { recursive: true, force: true });
  log('✅ Build directory cleaned', 'green');
}

// Production build
log('\n🏗️  Building for production...', 'blue');
const build = runCommand('npm run build:production', 'Production build');

if (build.success) {
  log('\n🎉 Production build completed successfully!', 'green');
  
  // Check build output
  if (checkFileExists('.next')) {
    const stats = fs.statSync('.next');
    const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
    log(`📊 Build size: ${sizeInMB} MB`, 'blue');
    
    // Check for common production issues
    log('\n🔍 Checking for common production issues...', 'blue');
    
    if (checkFileExists('.next/standalone')) {
      log('✅ Standalone build detected (good for Docker)', 'green');
    }
    
    if (checkFileExists('.next/static')) {
      log('✅ Static assets generated', 'green');
    }
    
    // Check bundle size
    try {
      const bundleAnalyzer = execSync('npm run build:analyze', { encoding: 'utf8', stdio: 'pipe' });
      log('✅ Bundle analysis available', 'green');
    } catch {
      log('⚠️  Bundle analysis not available (optional)', 'yellow');
    }
  }
  
  log('\n🚀 Ready for deployment!', 'green');
  log('\nNext steps:', 'blue');
  log('1. Set up your production environment variables', 'blue');
  log('2. Choose your deployment platform (Vercel, Netlify, Docker, etc.)', 'blue');
  log('3. Run: npm run start:production (for self-hosted)', 'blue');
  log('4. Check PRODUCTION.md for detailed deployment instructions', 'blue');
  
} else {
  log('\n❌ Production build failed!', 'red');
  log('Please fix the errors above before proceeding to production.', 'red');
  process.exit(1);
}

console.log('\n✨ Production build script completed!');
