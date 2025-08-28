#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Study Planner Performance Testing');
console.log('=====================================\n');

// Check if app is running
async function checkAppRunning() {
  return new Promise((resolve) => {
    const http = require('http');
    const req = http.request('http://localhost:3000', { method: 'HEAD' }, (res) => {
      resolve(true);
    });
    
    req.on('error', () => {
      resolve(false);
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      resolve(false);
    });
    
    req.end();
  });
}

// Run Lighthouse CI
async function runLighthouse() {
  console.log('📊 Running Lighthouse CI performance tests...');
  
  return new Promise((resolve, reject) => {
    const child = spawn('npx', ['lhci', 'autorun'], {
      stdio: 'inherit',
      shell: true,
      cwd: path.resolve(__dirname, '..')
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Lighthouse CI failed with exit code ${code}`));
      }
    });
    
    child.on('error', (error) => {
      reject(error);
    });
  });
}

// Run Playwright performance tests
async function runPlaywrightPerformance() {
  console.log('🎭 Running Playwright performance tests...');
  
  return new Promise((resolve, reject) => {
    const child = spawn('npx', ['playwright', 'test', '--grep', 'performance'], {
      stdio: 'inherit',
      shell: true,
      cwd: path.resolve(__dirname, '..')
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Playwright performance tests failed with exit code ${code}`));
      }
    });
    
    child.on('error', (error) => {
      reject(error);
    });
  });
}

// Generate performance report
function generateReport() {
  console.log('\n📋 Performance Test Report');
  console.log('============================');
  
  const lighthouseDir = path.resolve(__dirname, '..', '.lighthouseci');
  const playwrightDir = path.resolve(__dirname, '..', 'playwright-report');
  
  if (fs.existsSync(lighthouseDir)) {
    console.log('✅ Lighthouse CI results available in .lighthouseci/');
  } else {
    console.log('❌ Lighthouse CI results not found');
  }
  
  if (fs.existsSync(playwrightDir)) {
    console.log('✅ Playwright results available in playwright-report/');
  } else {
    console.log('❌ Playwright results not found');
  }
  
  console.log('\n📁 Check the following directories for detailed results:');
  console.log('   - .lighthouseci/ (Lighthouse CI results)');
  console.log('   - playwright-report/ (Playwright test results)');
  console.log('   - coverage/ (Test coverage reports)');
}

// Main execution
async function main() {
  try {
    console.log('🔍 Checking if application is running...');
    const isRunning = await checkAppRunning();
    
    if (!isRunning) {
      console.log('❌ Application is not running on http://localhost:3000');
      console.log('💡 Please start the application with: npm run dev');
      process.exit(1);
    }
    
    console.log('✅ Application is running on http://localhost:3000\n');
    
    // Run performance tests
    await runLighthouse();
    console.log('');
    await runPlaywrightPerformance();
    
    // Generate report
    generateReport();
    
    console.log('\n🎉 Performance testing completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Performance testing failed:', error.message);
    process.exit(1);
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Performance testing interrupted');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Performance testing terminated');
  process.exit(0);
});

// Run main function
main();
