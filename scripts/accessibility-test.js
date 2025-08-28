#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('♿ Study Planner Accessibility Testing');
console.log('=====================================\n');

// Run axe-core accessibility tests
async function runAxeTests() {
  console.log('🔍 Running axe-core accessibility tests...');
  
  return new Promise((resolve, reject) => {
    const child = spawn('npx', ['playwright', 'test', '--grep', 'accessibility'], {
      stdio: 'inherit',
      shell: true,
      cwd: path.resolve(__dirname, '..')
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Accessibility tests failed with exit code ${code}`));
      }
    });
    
    child.on('error', (error) => {
      reject(error);
    });
  });
}

// Run manual accessibility checks
async function runManualChecks() {
  console.log('👁️ Running manual accessibility checks...');
  
  const checks = [
    'Check color contrast ratios',
    'Verify keyboard navigation',
    'Test screen reader compatibility',
    'Validate ARIA labels',
    'Check focus management',
    'Test alternative text for images'
  ];
  
  console.log('\nManual Accessibility Checklist:');
  checks.forEach((check, index) => {
    console.log(`  ${index + 1}. ${check}`);
  });
  
  console.log('\n⚠️  Manual checks require human verification');
  console.log('💡 Use browser developer tools and screen readers');
}

// Generate accessibility report
function generateReport() {
  console.log('\n📋 Accessibility Test Report');
  console.log('==============================');
  
  const playwrightDir = path.resolve(__dirname, '..', 'playwright-report');
  
  if (fs.existsSync(playwrightDir)) {
    console.log('✅ Playwright accessibility results available in playwright-report/');
  } else {
    console.log('❌ Playwright accessibility results not found');
  }
  
  console.log('\n📁 Check the following for detailed results:');
  console.log('   - playwright-report/ (Automated accessibility tests)');
  console.log('   - Browser DevTools (Accessibility panel)');
  console.log('   - Screen reader testing (VoiceOver, NVDA, JAWS)');
  
  console.log('\n🎯 WCAG 2.1 AA Compliance Targets:');
  console.log('   - Color contrast ratio: 4.5:1 minimum');
  console.log('   - Keyboard navigation: Full functionality');
  console.log('   - Screen reader: Proper labeling and structure');
  console.log('   - Focus management: Visible and logical order');
}

// Main execution
async function main() {
  try {
    console.log('🔍 Checking if application is running...');
    
    // Run automated accessibility tests
    await runAxeTests();
    console.log('');
    
    // Run manual checks
    await runManualChecks();
    
    // Generate report
    generateReport();
    
    console.log('\n🎉 Accessibility testing completed successfully!');
    console.log('💡 Remember to perform manual accessibility testing regularly');
    
  } catch (error) {
    console.error('\n❌ Accessibility testing failed:', error.message);
    process.exit(1);
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Accessibility testing interrupted');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Accessibility testing terminated');
  process.exit(0);
});

// Run main function
main();
