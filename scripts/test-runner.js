#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

const args = process.argv.slice(2);
const command = args[0];

const commands = {
  'unit': 'npm run test',
  'coverage': 'npm run test:coverage',
  'ci': 'npm run test:ci',
  'e2e': 'npm run test:e2e',
  'e2e:ui': 'npm run test:e2e:ui',
  'e2e:debug': 'npm run test:e2e:debug',
  'all': 'npm run test:ci && npm run test:e2e',
  'help': () => {
    console.log(`
Study Planner Test Runner

Usage: node scripts/test-runner.js <command>

Commands:
  unit        Run unit tests in watch mode
  coverage    Run tests with coverage report
  ci          Run tests in CI mode
  e2e         Run end-to-end tests
  e2e:ui      Run E2E tests with UI
  e2e:debug   Run E2E tests in debug mode
  all         Run all tests (unit + E2E)
  help        Show this help message

Examples:
  node scripts/test-runner.js unit
  node scripts/test-runner.js coverage
  node scripts/test-runner.js e2e
  node scripts/test-runner.js all
    `);
  }
};

if (!command || !commands[command]) {
  console.log('❌ Invalid command. Use "help" to see available commands.');
  process.exit(1);
}

if (command === 'help') {
  commands.help();
  process.exit(0);
}

console.log(`🚀 Running: ${commands[command]}`);
console.log('⏳ Please wait...\n');

const child = spawn(commands[command], [], {
  stdio: 'inherit',
  shell: true,
  cwd: path.resolve(__dirname, '..')
});

child.on('close', (code) => {
  if (code === 0) {
    console.log('\n✅ Tests completed successfully!');
  } else {
    console.log(`\n❌ Tests failed with exit code ${code}`);
    process.exit(code);
  }
});

child.on('error', (error) => {
  console.error('❌ Failed to start test process:', error.message);
  process.exit(1);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping tests...');
  child.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Stopping tests...');
  child.kill('SIGTERM');
  process.exit(0);
});
