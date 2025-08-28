# StudyPlanner - Complete Project Structure

## 📁 Root Directory Structure

```
study-planner/
├── 📁 app/                          # Next.js App Router (Main Application)
├── 📁 components/                    # Reusable UI Components
├── 📁 hooks/                        # Custom React Hooks
├── 📁 lib/                          # Core Libraries and Utilities
├── 📁 prisma/                       # Database Schema and Migrations
├── 📁 types/                        # TypeScript type definitions
├── 📁 utils/                        # Utility functions
├── 📁 styles/                       # Global styles and CSS
├── 📁 public/                       # Static assets
├── 📁 tests/                        # Test files
├── 📁 e2e/                          # End-to-end tests (Playwright)
├── 📁 __tests__/                    # Jest unit tests
├── 📁 coverage/                     # Test coverage reports
├── 📁 scripts/                      # Build and deployment scripts
├── 📁 .github/                      # GitHub Actions and workflows
├── 📁 database/                     # Database utilities
├── 📁 study-planner-clean/          # Clean version backup
├── 📄 Configuration Files
├── 📄 Documentation Files
└── 📄 Test Files
```

## 📁 app/ - Next.js App Router (Main Application)

### 📁 app/api/ - Backend API Routes
```
app/api/
├── 📁 auth/                         # Authentication endpoints
│   └── 📁 [...nextauth]/            # NextAuth.js route handler
│       └── 📄 route.ts              # NextAuth configuration route
├── 📁 subjects/                     # Subject CRUD operations
│   ├── 📄 route.ts                  # GET/POST subjects (list/create)
│   └── 📁 [id]/                     # Dynamic route for specific subject
│       └── 📄 route.ts              # PUT/DELETE subject (update/delete)
├── 📁 tasks/                        # Task management
│   ├── 📄 route.ts                  # GET/POST tasks (list/create)
│   └── 📁 [id]/                     # Dynamic route for specific task
│       └── 📄 route.ts              # PUT/DELETE task (update/delete)
├── 📁 study-sessions/               # Study session tracking
│   ├── 📄 route.ts                  # GET/POST study sessions
│   └── 📁 [id]/                     # Dynamic route for specific session
│       └── 📄 route.ts              # PUT/DELETE study session
├── 📁 test-marks/                   # Test score management
│   ├── 📄 route.ts                  # GET/POST test marks
│   └── 📁 [id]/                     # Dynamic route for specific test mark
│       └── 📄 route.ts              # PUT/DELETE test mark
├── 📁 migration/                    # Data migration utilities
│   └── 📄 route.ts                  # Migration status and execution
├── 📁 recommendations/               # AI-powered recommendations
│   └── 📄 route.ts                  # Study recommendations API
├── 📁 pusher/                       # Real-time communication
│   └── 📄 route.ts                  # Pusher authentication
└── 📁 uploadthing/                  # File upload handling
    └── 📄 route.ts                  # File upload configuration
```

### 📁 app/auth/ - Authentication Pages
```
app/auth/
├── 📁 login/                        # User login page
│   └── 📄 page.tsx                  # Login form and authentication
├── 📁 signup/                       # User registration page
│   └── 📄 page.tsx                  # Signup form and user creation
└── 📁 forgot-password/              # Password recovery
    └── 📄 page.tsx                  # Password reset functionality
```

### 📁 app/ - Main Application Pages
```
app/
├── 📄 layout.tsx                    # Root layout with providers (1.2KB)
├── 📄 page.tsx                      # Landing page (7.4KB - 160 lines)
├── 📄 globals.css                   # Global CSS styles (12KB - 471 lines)
├── 📁 dashboard/                    # Main dashboard
│   ├── 📄 page.tsx                  # Dashboard component (71KB - 1776 lines)
│   └── 📄 loading.tsx               # Loading state (52B - 4 lines)
├── 📁 subjects/                     # Subject management
│   ├── 📄 page.tsx                  # Subjects page (16KB - 414 lines)
│   └── 📄 loading.tsx               # Loading state (52B - 4 lines)
├── 📁 study-sessions/               # Study session tracking
│   ├── 📄 page.tsx                  # Study sessions page (25KB - 644 lines)
│   └── 📄 loading.tsx               # Loading state (52B - 4 lines)
├── 📁 test-marks/                   # Test performance tracking
│   ├── 📄 page.tsx                  # Test marks page (21KB - 548 lines)
│   └── 📄 loading.tsx               # Loading state (52B - 4 lines)
├── 📁 syllabus/                     # Course content management
│   ├── 📄 page.tsx                  # Syllabus page (19KB - 517 lines)
│   └── 📄 loading.tsx               # Loading state (52B - 4 lines)
├── 📁 analytics/                    # Data visualization
│   ├── 📄 page.tsx                  # Analytics page (39KB - 990 lines)
│   └── 📄 loading.tsx               # Loading state (2.0KB - 62 lines)
├── 📁 timetable/                    # Calendar and scheduling
│   └── 📄 page.tsx                  # Timetable page (1.6KB - 50 lines)
├── 📁 profile/                      # User profile management
│   └── 📄 page.tsx                  # Profile settings page
├── 📁 settings/                     # Application settings
│   └── 📄 page.tsx                  # App configuration page
├── 📁 documents/                    # File management system
│   └── 📄 page.tsx                  # Document organization page
├── 📁 (lib)/                        # Library routes (grouped)
├── 📁 debug-thumbnails/             # Thumbnail debugging
├── 📁 test-simple/                  # Simple test pages
├── 📁 test-thumbnails/              # Thumbnail testing
└── 📁 thumbnail-demo/               # Thumbnail demonstration
```

## 📁 components/ - Reusable UI Components

### 📁 components/ui/ - shadcn/ui Component Library
```
components/ui/
├── 📄 accordion.tsx                 # Collapsible content (2.0KB - 67 lines)
├── 📄 alert-dialog.tsx              # Confirmation dialogs (3.8KB - 158 lines)
├── 📄 alert.tsx                     # Alert notifications (1.6KB - 67 lines)
├── 📄 aspect-ratio.tsx              # Aspect ratio container (280B - 12 lines)
├── 📄 avatar.tsx                    # User avatar component (1.1KB - 54 lines)
├── 📄 badge.tsx                     # Status badges (1.6KB - 47 lines)
├── 📄 breadcrumb.tsx                # Navigation breadcrumbs (2.3KB - 110 lines)
├── 📄 button.tsx                    # Button components (2.1KB - 60 lines)
├── 📄 calendar.tsx                  # Date picker (7.5KB - 214 lines)
├── 📄 card.tsx                      # Card containers (1.9KB - 93 lines)
├── 📄 carousel.tsx                  # Image carousel (5.4KB - 242 lines)
├── 📄 chart.tsx                     # Data visualization (9.6KB - 357 lines)
├── 📄 checkbox.tsx                  # Checkbox inputs (1.2KB - 33 lines)
├── 📄 collapsible.tsx               # Collapsible sections (800B - 34 lines)
├── 📄 command.tsx                   # Command palette (4.7KB - 185 lines)
├── 📄 context-menu.tsx              # Right-click menus (8.0KB - 253 lines)
├── 📄 dialog.tsx                    # Modal dialogs (3.9KB - 144 lines)
├── 📄 drawer.tsx                    # Slide-out panels (4.2KB - 136 lines)
├── 📄 dropdown-menu.tsx             # Dropdown menus (8.1KB - 258 lines)
├── 📄 form.tsx                      # Form components (3.7KB - 168 lines)
├── 📄 hover-card.tsx                # Hover tooltips (1.5KB - 45 lines)
├── 📄 input-otp.tsx                 # OTP input fields (2.2KB - 78 lines)
├── 📄 input.tsx                     # Text inputs (967B - 22 lines)
├── 📄 label.tsx                     # Form labels (611B - 25 lines)
├── 📄 menubar.tsx                   # Menu bars (8.2KB - 277 lines)
├── 📄 navigation-menu.tsx           # Navigation menus (6.5KB - 169 lines)
├── 📄 pagination.tsx                # Page navigation (2.6KB - 128 lines)
├── 📄 popover.tsx                   # Popover content (1.6KB - 49 lines)
├── 📄 progress.tsx                  # Progress bars (740B - 32 lines)
├── 📄 radio-group.tsx               # Radio button groups (1.4KB - 46 lines)
├── 📄 resizable.tsx                 # Resizable panels (2.0KB - 57 lines)
├── 📄 scroll-area.tsx               # Custom scrollbars (1.6KB - 59 lines)
├── 📄 select.tsx                    # Select dropdowns (6.1KB - 186 lines)
├── 📄 separator.tsx                 # Visual separators (699B - 29 lines)
├── 📄 sheet.tsx                     # Slide-out sheets (4.0KB - 140 lines)
├── 📄 sidebar.tsx                   # Navigation sidebar (21KB - 727 lines)
├── 📄 skeleton.tsx                  # Loading skeletons (276B - 14 lines)
├── 📄 slider.tsx                    # Range sliders (2.0KB - 64 lines)
├── 📄 sonner.tsx                    # Toast notifications (564B - 26 lines)
├── 📄 switch.tsx                    # Toggle switches (1.1KB - 32 lines)
├── 📄 table.tsx                     # Data tables (2.4KB - 117 lines)
├── 📄 tabs.tsx                      # Tab navigation (1.9KB - 67 lines)
├── 📄 textarea.tsx                  # Multi-line inputs (759B - 19 lines)
├── 📄 toast.tsx                     # Toast notifications (4.7KB - 130 lines)
├── 📄 toaster.tsx                   # Toast container (786B - 36 lines)
├── 📄 toggle-group.tsx              # Toggle button groups (1.9KB - 74 lines)
├── 📄 toggle.tsx                    # Toggle buttons (1.5KB - 48 lines)
├── 📄 tooltip.tsx                   # Tooltips (1.8KB - 62 lines)
├── 📄 use-mobile.tsx                # Mobile detection hook (565B - 20 lines)
└── 📄 use-toast.ts                  # Toast hook (3.9KB - 195 lines)
```

### 📁 components/ - Feature-Specific Components
```
components/
├── 📁 dashboard/                    # Dashboard-specific components
├── 📁 subjects/                     # Subject management components
├── 📁 tasks/                        # Task management components
├── 📁 analytics/                    # Chart and visualization components
├── 📁 study-sessions/               # Study session components
├── 📁 test-marks/                   # Test tracking components
├── 📁 syllabus/                     # Syllabus management components
├── 📁 notifications/                # Notification system
├── 📁 calendar/                     # Calendar and scheduling
├── 📁 providers/                    # Context providers
│   ├── 📄 session-provider.tsx      # NextAuth session management (1.5KB - 15 lines)
│   └── 📄 theme-provider.tsx        # Theme management (1.7KB - 75 lines)
├── 📁 file-management/              # File handling components
├── 📄 progressive-task-manager.tsx  # Advanced task management (8.6KB - 244 lines)
├── 📄 expandable-section.tsx        # Collapsible content (2.5KB - 73 lines)
├── 📄 client-only.tsx               # Client-side only wrapper (435B - 23 lines)
├── 📄 file-thumbnail.tsx            # File preview thumbnails (9.7KB - 335 lines)
├── 📄 file-upload.tsx               # File upload interface (11KB - 322 lines)
├── 📄 file-preview.tsx              # File preview system (28KB - 813 lines)
├── 📄 file-preview-button.tsx       # Preview button (1003B - 46 lines)
├── 📄 group-details.tsx             # Group information display (10KB - 243 lines)
├── 📄 global-search.tsx             # Unified search interface (16KB - 409 lines)
└── 📄 theme-toggle.tsx              # Theme switching (1.1KB - 45 lines)
```

## 📁 hooks/ - Custom React Hooks

```
hooks/
├── 📄 useSubjects.ts                # Subject data management (6.2KB - 207 lines)
├── 📄 useTasks.ts                   # Task data management (9.7KB - 341 lines)
├── 📄 useStudySessions.ts           # Study session management (10KB - 321 lines)
├── 📄 useTestMarks.ts               # Test mark management (10KB - 341 lines)
├── 📄 useMigration.ts               # Data migration utilities (7.9KB - 227 lines)
├── 📄 useRecommendations.ts         # AI-powered recommendations (4.9KB - 182 lines)
├── 📄 useCalendarEvents.ts          # Calendar event management (3.3KB - 100 lines)
├── 📄 useNotifications.ts           # Notification management (1.8KB - 53 lines)
├── 📄 useLocalStorage.ts            # Local storage utilities (983B - 31 lines)
├── 📄 use-file-preview.ts           # File preview management (736B - 38 lines)
├── 📄 use-realtime-sync.ts          # Real-time synchronization (2.4KB - 90 lines)
├── 📄 use-mobile.ts                 # Mobile detection (565B - 20 lines)
├── 📄 use-toast.ts                  # Toast notifications (3.9KB - 195 lines)
└── 📄 index.ts                      # Hook exports (729B - 17 lines)
```

## 📁 lib/ - Core Libraries and Utilities

### 📁 lib/database/ - Database Layer
```
lib/database/
├── 📄 database-service.ts           # Prisma client singleton (Main service)
├── 📄 subject-service.ts            # Subject business logic
├── 📄 task-service.ts               # Task business logic
├── 📄 study-session-service.ts      # Study session logic
├── 📄 test-mark-service.ts          # Test mark logic
└── 📄 migration-utility.ts          # Data migration tools
```

### 📁 lib/ - Core Libraries
```
lib/
├── 📄 auth.ts                       # NextAuth configuration (2.6KB - 92 lines)
├── 📄 notifications.ts              # Notification system (6.3KB - 221 lines)
├── 📄 mock-upload.ts                # Mock file upload (3.8KB - 139 lines)
├── 📄 pusher.ts                     # Real-time communication (735B - 21 lines)
├── 📄 uploadthing.ts                # File upload configuration (216B - 6 lines)
└── 📄 utils.ts                      # Utility functions (166B - 7 lines)
```

## 📁 prisma/ - Database Schema and Migrations

```
prisma/
├── 📄 schema.prisma                 # Database schema definition (8.2KB - 216 lines)
└── 📄 dev.db                        # SQLite development database (112KB)
```

## 📁 Configuration and Build Files

```
📄 package.json                      # Dependencies and scripts (4.9KB - 141 lines)
📄 package-lock.json                 # Locked dependency versions (641KB)
📄 tsconfig.json                     # TypeScript configuration (595B - 28 lines)
📄 next.config.mjs                   # Next.js configuration (1.5KB - 66 lines)
📄 tailwind.config.js                # Tailwind CSS configuration (4.9KB - 143 lines)
📄 postcss.config.mjs                # PostCSS configuration (155B - 10 lines)
📄 .eslintrc.json                    # ESLint configuration (377B - 16 lines)
📄 jest.config.js                    # Jest testing configuration (46 lines)
📄 vitest.config.ts                  # Vitest configuration (895B - 43 lines)
📄 playwright.config.ts              # Playwright configuration (1.0KB - 45 lines)
📄 components.json                   # shadcn/ui configuration (426B - 21 lines)
📄 docker-compose.yml                # Docker configuration (1.7KB - 77 lines)
📄 Dockerfile                        # Docker container definition (1.1KB - 50 lines)
```

## 📁 Documentation Files

```
📄 README.md                         # Main project documentation
📄 PHASE-2-COMPLETION.md             # Phase 2 completion notes (5.9KB - 161 lines)
📄 PHASE-3-COMPLETION.md             # Phase 3 completion notes (7.3KB - 174 lines)
📄 CPANEL-DATABASE-SETUP.md          # cPanel database setup guide (2.5KB - 89 lines)
📄 VERCEL-ENV-SETUP.md               # Vercel environment setup (1.4KB - 46 lines)
📄 SIMPLE-AUTH-SETUP.md              # Authentication setup guide (2.8KB - 106 lines)
📄 OAUTH-SETUP.md                    # OAuth configuration guide (4.5KB - 162 lines)
📄 DEPLOYMENT-GUIDE.md               # Deployment instructions (5.0KB - 227 lines)
📄 PRODUCTION-CHECKLIST.md           # Production deployment checklist (4.9KB - 188 lines)
📄 PRODUCTION.md                     # Production configuration (5.0KB - 253 lines)
📄 SETUP.md                          # Setup instructions (6.8KB - 256 lines)
📄 TESTING.md                        # Testing guide (9.0KB - 263 lines)
📄 README-TESTING.md                 # Testing documentation (11KB - 404 lines)
📄 THUMBNAIL_README.md               # Thumbnail system documentation (4.6KB - 151 lines)
📄 quick-setup.md                    # Quick setup guide (1.1KB - 50 lines)
```

## 📁 Test Files and Scripts

```
📄 test-hooks.js                     # Hook testing script (2.3KB - 77 lines)
📄 test-database-services.js         # Database service testing (2.0KB - 65 lines)
📄 check-database-structure.js       # Database structure validation (1.5KB - 50 lines)
📄 update-env.js                     # Environment update script (930B - 22 lines)
📄 test-local-db.js                  # Local database testing (1.3KB - 48 lines)
📄 test-ports.js                     # Port availability testing (1.7KB - 55 lines)
📄 test-remote-db.js                 # Remote database testing (1.6KB - 45 lines)
📄 install-nodejs.bat                # Node.js installation script (1.6KB - 57 lines)
```

## 📁 Development and Testing Directories

```
📁 tests/                            # Test files
📁 e2e/                              # End-to-end tests (Playwright)
📁 __tests__/                        # Jest unit tests
📁 coverage/                          # Test coverage reports
📁 test-results/                      # Test execution results
📁 playwright-report/                 # Playwright test reports
```

## 📁 Utility and Script Directories

```
📁 scripts/                          # Build and deployment scripts
📁 .github/                          # GitHub Actions and workflows
📁 database/                         # Database utilities
📁 study-planner-clean/              # Clean version backup
📁 types/                            # TypeScript type definitions
📁 utils/                            # Utility functions
📁 styles/                           # Global styles and CSS
📁 public/                           # Static assets
```

## 📊 File Size Analysis

### Large Components (>10KB)
- **app/dashboard/page.tsx**: 71KB (1,776 lines) - Main dashboard
- **app/analytics/page.tsx**: 39KB (990 lines) - Analytics dashboard
- **components/file-preview.tsx**: 28KB (813 lines) - File preview system
- **components/ui/sidebar.tsx**: 21KB (727 lines) - Navigation sidebar
- **app/study-sessions/page.tsx**: 25KB (644 lines) - Study sessions
- **app/test-marks/page.tsx**: 21KB (548 lines) - Test tracking
- **app/syllabus/page.tsx**: 19KB (517 lines) - Syllabus management
- **components/global-search.tsx**: 16KB (409 lines) - Search interface
- **app/subjects/page.tsx**: 16KB (414 lines) - Subject management

### Medium Components (5-10KB)
- **components/ui/chart.tsx**: 9.6KB (357 lines) - Data visualization
- **components/progressive-task-manager.tsx**: 8.6KB (244 lines) - Task management
- **components/ui/carousel.tsx**: 5.4KB (242 lines) - Image carousel
- **components/ui/context-menu.tsx**: 8.0KB (253 lines) - Right-click menus
- **components/ui/dropdown-menu.tsx**: 8.1KB (258 lines) - Dropdown menus
- **components/ui/menubar.tsx**: 8.2KB (277 lines) - Menu bars
- **components/ui/navigation-menu.tsx**: 6.5KB (169 lines) - Navigation
- **components/ui/select.tsx**: 6.1KB (186 lines) - Select dropdowns

### Small Components (<5KB)
- **Most UI components**: 1-5KB - Standard shadcn/ui components
- **Utility components**: <2KB - Simple wrapper and utility components
- **Loading states**: <1KB - Minimal loading components

## 🔍 Key Architectural Patterns

### 1. **App Router Structure**
- **Route Groups**: Organized by feature (auth, dashboard, subjects, etc.)
- **Loading States**: Dedicated loading.tsx files for each route
- **Layout Hierarchy**: Root layout with providers, feature-specific layouts

### 2. **Component Organization**
- **UI Components**: Reusable shadcn/ui components in `/ui`
- **Feature Components**: Feature-specific components in dedicated folders
- **Provider Components**: Context providers for state management

### 3. **Hook Architecture**
- **Data Hooks**: useSubjects, useTasks, useStudySessions, etc.
- **Utility Hooks**: useMobile, useToast, useLocalStorage, etc.
- **Feature Hooks**: useMigration, useRecommendations, etc.

### 4. **API Route Structure**
- **RESTful Design**: Standard CRUD operations for each entity
- **Dynamic Routes**: [id] folders for specific resource operations
- **Authentication**: NextAuth integration in all protected routes

### 5. **Database Layer**
- **Service Pattern**: Business logic separated into service classes
- **Prisma ORM**: Type-safe database operations
- **Migration System**: Automated database schema management

## 🎯 Development Workflow

### 1. **Component Development**
- Create UI components in `/components/ui`
- Build feature components in feature-specific folders
- Implement loading states for each route

### 2. **Data Management**
- Define database schema in Prisma
- Create service classes for business logic
- Implement custom hooks for data operations

### 3. **API Development**
- Create API routes in `/app/api`
- Implement authentication and validation
- Connect to database services

### 4. **Testing Strategy**
- Unit tests for components and hooks
- Integration tests for API routes
- E2E tests for user journeys

This structure provides a comprehensive foundation for a scalable, maintainable academic management system with clear separation of concerns and modern development practices.
