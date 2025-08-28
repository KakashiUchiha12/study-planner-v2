# 🧪 Study Planner - Testing Implementation Guide

This document provides a comprehensive guide to the testing infrastructure implemented for the Study Planner application.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Git

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd study-planner

# Install dependencies
npm install

# Install Playwright browsers
npm run test:e2e:install
```

### Running Tests
```bash
# Unit tests (Jest)
npm test                    # Watch mode
npm run test:coverage      # With coverage
npm run test:ci           # CI mode

# E2E tests (Playwright)
npm run test:e2e          # Run all E2E tests
npm run test:e2e:ui       # Interactive UI mode
npm run test:e2e:debug    # Debug mode

# All tests
npm run test:all          # Unit + E2E tests
```

## 🛠️ Testing Scripts

### Available Scripts
```bash
# Core testing
npm test                   # Jest in watch mode
npm run test:watch        # Jest watch mode
npm run test:coverage     # Jest with coverage
npm run test:ci          # Jest CI mode

# E2E testing
npm run test:e2e         # Playwright tests
npm run test:e2e:ui      # Playwright UI mode
npm run test:e2e:debug   # Playwright debug mode
npm run test:e2e:install # Install browsers

# Utility scripts
npm run test:runner      # Custom test runner
npm run test:performance # Performance testing
npm run test:accessibility # Accessibility testing
npm run test:coverage-report # Coverage analysis
npm run test:all         # All tests
npm run test:quick       # Quick test run
npm run test:debug       # Debug mode
```

### Custom Test Runner
```bash
# Use the custom test runner
node scripts/test-runner.js unit      # Run unit tests
node scripts/test-runner.js coverage  # Run coverage
node scripts/test-runner.js e2e       # Run E2E tests
node scripts/test-runner.js all       # Run all tests
node scripts/test-runner.js help      # Show help
```

## 📁 Test Structure

```
study-planner/
├── __tests__/                    # Unit & Integration Tests
│   ├── components/              # Component tests
│   │   ├── tasks/              # Task-related components
│   │   │   ├── task-item.test.tsx
│   │   │   └── task-manager.test.tsx
│   │   └── expandable-section.test.tsx
│   └── utils/                  # Test utilities
│       ├── test-utils.tsx      # Custom render function
│       ├── msw-handlers.ts     # API mock handlers
│       └── msw-server.ts       # MSW server setup
├── e2e/                        # End-to-End Tests
│   └── dashboard.spec.ts       # Dashboard E2E tests
├── scripts/                    # Testing scripts
│   ├── test-runner.js         # Test runner utility
│   ├── performance-test.js    # Performance testing
│   ├── accessibility-test.js  # Accessibility testing
│   └── coverage-report.js     # Coverage analysis
├── jest.config.js              # Jest configuration
├── jest.setup.js               # Jest setup and mocks
├── playwright.config.ts        # Playwright configuration
└── .github/workflows/          # CI/CD Pipeline
    └── test.yml               # Automated testing workflow
```

## 🧩 Component Testing

### TaskItem Component
Tests cover:
- ✅ Rendering of task information
- ✅ Task completion toggle
- ✅ Edit mode functionality
- ✅ Delete confirmation dialog
- ✅ Drag and drop events
- ✅ Visual states during drag
- ✅ Priority and category display
- ✅ Due date and time handling
- ✅ Accessibility features

### TaskManager Component
Tests cover:
- ✅ Task list rendering
- ✅ Task creation flow
- ✅ Filtering and sorting
- ✅ Search functionality
- ✅ Empty states
- ✅ Statistics display
- ✅ Mobile responsiveness

### ExpandableSection Component
Tests cover:
- ✅ Expand/collapse functionality
- ✅ Icon rendering
- ✅ Visual indicators
- ✅ Keyboard navigation
- ✅ Responsive design
- ✅ Theme handling

## 🔌 API Mocking

### MSW (Mock Service Worker)
- **Purpose**: Mock API endpoints during testing
- **Configuration**: `__tests__/utils/msw-server.ts`
- **Handlers**: `__tests__/utils/msw-handlers.ts`

### Mock Endpoints
```typescript
// Available mock endpoints
GET    /api/tasks              # Get all tasks
POST   /api/tasks              # Create new task
PUT    /api/tasks/:id          # Update task
DELETE /api/tasks/:id          # Delete task

GET    /api/subjects           # Get all subjects
POST   /api/subjects           # Create new subject

GET    /api/study-sessions     # Get study sessions
POST   /api/study-sessions     # Create study session

GET    /api/analytics/*        # Analytics data
POST   /api/auth/signin        # Authentication
```

## 🎭 E2E Testing

### Playwright Configuration
- **Browsers**: Chrome, Firefox, Safari
- **Mobile Testing**: Responsive design validation
- **Screenshots**: On failure
- **Video**: Retained on failure
- **Trace**: On first retry

### Test Structure
```typescript
// Example E2E test
test('should create a new task', async ({ page }) => {
  await page.goto('/dashboard');
  
  // Expand tasks section
  await page.getByText(/tasks/i).first().click();
  
  // Click add task button
  await page.getByRole('button', { name: /add task/i }).click();
  
  // Fill form and submit
  await page.getByLabel(/title/i).fill('New Task');
  await page.getByRole('button', { name: /create task/i }).click();
  
  // Verify task appears
  await expect(page.getByText('New Task')).toBeVisible();
});
```

## 📊 Coverage & Quality

### Coverage Targets
- **Global**: 80% minimum
- **Components**: 85% minimum
- **Utilities**: 90% minimum
- **Hooks**: 85% minimum
- **API Integration**: 75% minimum

### Quality Gates
- ✅ All tests must pass
- ✅ Coverage above thresholds
- ✅ No linting errors
- ✅ Type checking passes
- ✅ Build succeeds

## 🚦 CI/CD Pipeline

### GitHub Actions Workflow
The `.github/workflows/test.yml` file defines:

1. **Unit Tests**: Jest with coverage
2. **E2E Tests**: Playwright cross-browser
3. **Security Audit**: Dependency scanning
4. **Performance Testing**: Lighthouse CI
5. **Accessibility Testing**: Automated compliance

### Pipeline Stages
```yaml
jobs:
  test:          # Unit tests + coverage
  e2e:           # E2E tests
  security:      # Security audit
  performance:   # Performance testing
  accessibility: # Accessibility testing
```

## 🎯 Testing Best Practices

### Writing Tests
1. **Test Behavior, Not Implementation**
   ```typescript
   // ✅ Good: Test what user sees
   expect(screen.getByText('Task Created')).toBeInTheDocument();
   
   // ❌ Bad: Test implementation details
   expect(mockFunction).toHaveBeenCalledWith('specific-arg');
   ```

2. **Use Descriptive Test Names**
   ```typescript
   // ✅ Good
   test('should show error message when form is submitted without title', () => {});
   
   // ❌ Bad
   test('form validation', () => {});
   ```

3. **Test Edge Cases**
   ```typescript
   test('should handle empty task list gracefully', () => {});
   test('should handle network errors', () => {});
   test('should validate required fields', () => {});
   ```

### Test Data Management
```typescript
// Use factory functions for consistent data
const task = createMockTask({
  title: 'Custom Task',
  priority: 'high'
});

// Clean up between tests
beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
});
```

## 🔍 Debugging Tests

### Unit Test Debugging
```bash
# Run specific test file
npm test __tests__/components/tasks/task-item.test.tsx

# Run with verbose output
npm test -- --verbose

# Run in debug mode
npm run test:debug
```

### E2E Test Debugging
```bash
# Run with UI mode
npm run test:e2e:ui

# Run in debug mode
npm run test:e2e:debug

# Run specific test
npx playwright test e2e/dashboard.spec.ts --debug
```

### Common Issues
1. **Tests Failing in CI but Passing Locally**
   - Check environment differences
   - Verify Node.js version
   - Check for timezone/locale issues

2. **MSW Not Working**
   - Ensure MSW is configured in setup
   - Check handler definitions
   - Verify server lifecycle

3. **Playwright Tests Failing**
   - Check if app is running
   - Verify browser installation
   - Check for flaky selectors

## 📈 Performance Testing

### Lighthouse CI
```bash
# Run performance tests
npm run test:performance

# Manual Lighthouse run
npx lhci autorun
```

### Performance Metrics
- **First Contentful Paint (FCP)**: < 1.5s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **Cumulative Layout Shift (CLS)**: < 0.1
- **First Input Delay (FID)**: < 100ms

## ♿ Accessibility Testing

### Automated Testing
```bash
# Run accessibility tests
npm run test:accessibility

# Run with Playwright
npx playwright test --grep accessibility
```

### Manual Testing Checklist
- [ ] Color contrast ratios (4.5:1 minimum)
- [ ] Keyboard navigation
- [ ] Screen reader compatibility
- [ ] ARIA labels and roles
- [ ] Focus management
- [ ] Alternative text for images

## 🧹 Maintenance

### Regular Tasks
1. **Update Test Data**: Keep mock data current
2. **Review Coverage**: Identify untested code
3. **Update Dependencies**: Keep testing tools current
4. **Performance Monitoring**: Track test execution time
5. **User Feedback**: Incorporate real-world testing

### Continuous Improvement
- Regular test quality reviews
- Performance optimization
- Coverage gap analysis
- User experience testing

## 📚 Additional Resources

### Documentation
- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/)
- [Playwright Documentation](https://playwright.dev/)
- [MSW Documentation](https://mswjs.io/)

### Best Practices
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Accessibility Testing](https://www.w3.org/WAI/WCAG21/quickref/)
- [Performance Testing](https://web.dev/performance/)

## 🤝 Contributing

### Adding New Tests
1. **Write Tests First**: Follow TDD approach
2. **Ensure Coverage**: Aim for >80% coverage
3. **Update Documentation**: Keep this guide current
4. **Run Full Suite**: Before submitting PRs

### Test Review Checklist
- [ ] Tests are descriptive and clear
- [ ] Edge cases are covered
- [ ] Mock data is realistic
- [ ] Tests are isolated
- [ ] Performance is acceptable
- [ ] Accessibility is considered

## 🎉 Conclusion

This comprehensive testing infrastructure ensures the Study Planner application maintains high quality, reliability, and user satisfaction. The multi-layered approach catches issues early, maintains code quality, and delivers a robust user experience.

Remember: **Good tests are documentation that never gets out of date!**

---

For questions or issues with testing, please refer to the troubleshooting section or create an issue in the repository.
