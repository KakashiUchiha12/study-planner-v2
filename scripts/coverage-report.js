#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('📊 Study Planner Test Coverage Report');
console.log('=====================================\n');

// Run coverage tests
async function runCoverage() {
  console.log('🔍 Running tests with coverage...');
  
  return new Promise((resolve, reject) => {
    const child = spawn('npm', ['run', 'test:coverage'], {
      stdio: 'inherit',
      shell: true,
      cwd: path.resolve(__dirname, '..')
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Coverage tests failed with exit code ${code}`));
      }
    });
    
    child.on('error', (error) => {
      reject(error);
    });
  });
}

// Analyze coverage results
function analyzeCoverage() {
  console.log('\n📈 Coverage Analysis');
  console.log('====================');
  
  const coverageDir = path.resolve(__dirname, '..', 'coverage');
  const lcovFile = path.resolve(coverageDir, 'lcov.info');
  
  if (!fs.existsSync(coverageDir)) {
    console.log('❌ Coverage directory not found');
    return;
  }
  
  if (fs.existsSync(lcovFile)) {
    console.log('✅ Coverage data available');
    
    // Read and parse lcov.info for basic stats
    try {
      const lcovContent = fs.readFileSync(lcovFile, 'utf8');
      const lines = lcovContent.split('\n');
      
      let totalLines = 0;
      let coveredLines = 0;
      let totalFunctions = 0;
      let coveredFunctions = 0;
      let totalBranches = 0;
      let coveredBranches = 0;
      
      lines.forEach(line => {
        if (line.startsWith('LF:')) {
          totalLines = parseInt(line.split(':')[1]);
        } else if (line.startsWith('LH:')) {
          coveredLines = parseInt(line.split(':')[1]);
        } else if (line.startsWith('FNF:')) {
          totalFunctions = parseInt(line.split(':')[1]);
        } else if (line.startsWith('FNH:')) {
          coveredFunctions = parseInt(line.split(':')[1]);
        } else if (line.startsWith('BRF:')) {
          totalBranches = parseInt(line.split(':')[1]);
        } else if (line.startsWith('BRH:')) {
          coveredBranches = parseInt(line.split(':')[1]);
        }
      });
      
      if (totalLines > 0) {
        const lineCoverage = ((coveredLines / totalLines) * 100).toFixed(1);
        console.log(`📊 Line Coverage: ${lineCoverage}% (${coveredLines}/${totalLines})`);
      }
      
      if (totalFunctions > 0) {
        const functionCoverage = ((coveredFunctions / totalFunctions) * 100).toFixed(1);
        console.log(`🔧 Function Coverage: ${functionCoverage}% (${coveredFunctions}/${totalFunctions})`);
      }
      
      if (totalBranches > 0) {
        const branchCoverage = ((coveredBranches / totalBranches) * 100).toFixed(1);
        console.log(`🌿 Branch Coverage: ${branchCoverage}% (${coveredBranches}/${totalBranches})`);
      }
      
    } catch (error) {
      console.log('⚠️  Could not parse coverage data:', error.message);
    }
  }
  
  // Check for HTML coverage report
  const htmlReport = path.resolve(coverageDir, 'lcov-report', 'index.html');
  if (fs.existsSync(htmlReport)) {
    console.log('🌐 HTML coverage report available');
    console.log(`   📁 Open: ${htmlReport}`);
  }
}

// Generate coverage recommendations
function generateRecommendations() {
  console.log('\n💡 Coverage Recommendations');
  console.log('============================');
  
  const recommendations = [
    'Aim for at least 80% line coverage',
    'Focus on critical business logic paths',
    'Test error handling and edge cases',
    'Cover all user interaction flows',
    'Test component integration points',
    'Include accessibility testing coverage',
    'Test mobile responsive behavior',
    'Cover API integration scenarios'
  ];
  
  recommendations.forEach((rec, index) => {
    console.log(`  ${index + 1}. ${rec}`);
  });
}

// Check coverage thresholds
function checkThresholds() {
  console.log('\n🎯 Coverage Thresholds');
  console.log('=======================');
  
  const thresholds = {
    'Global': '80%',
    'Components': '85%',
    'Utilities': '90%',
    'Hooks': '85%',
    'API Integration': '75%'
  };
  
  Object.entries(thresholds).forEach(([area, threshold]) => {
    console.log(`  ${area}: ${threshold}`);
  });
  
  console.log('\n⚠️  Coverage below thresholds will fail CI pipeline');
}

// Main execution
async function main() {
  try {
    // Run coverage tests
    await runCoverage();
    
    // Analyze results
    analyzeCoverage();
    
    // Generate recommendations
    generateRecommendations();
    
    // Check thresholds
    checkThresholds();
    
    console.log('\n📁 Coverage files available in:');
    console.log('   - coverage/lcov.info (Raw coverage data)');
    console.log('   - coverage/lcov-report/ (HTML report)');
    console.log('   - coverage/ (All coverage artifacts)');
    
    console.log('\n🎉 Coverage report generated successfully!');
    
  } catch (error) {
    console.error('\n❌ Coverage report generation failed:', error.message);
    process.exit(1);
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Coverage report generation interrupted');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Coverage report generation terminated');
  process.exit(0);
});

// Run main function
main();
