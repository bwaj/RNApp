# Music Tracker App Development Plan

## Project Overview
Build a web app to track music listening habits and provide stats on top artists and songs using Spotify integration and Google OAuth authentication.

## Tech Stack
- **Frontend**: Next.js, React, Tailwind CSS V4, shadcn/ui, ESLint 9
- **Backend**: Postgres, Drizzle ORM
- **Infrastructure**: GitHub, Vercel, Sentry
- **Package Manager**: pnpm
- **Version Control**: Git with descriptive commits

## Phase 1: Project Foundation & Setup
- [ ] Initialize Next.js project with TypeScript
- [ ] Configure pnpm workspace and package.json
- [ ] Set up Tailwind CSS V4 configuration
- [ ] Configure ESLint 9 with appropriate rules
- [ ] Set up project folder structure (components, lib, app, etc.)
- [ ] Initialize Git repository with proper .gitignore
- [ ] Create initial README with setup instructions
- [ ] Set up basic environment variables structure (.env.example)
- [ ] Set up testing framework (Jest, React Testing Library)
- [ ] Configure test scripts and CI/CD pipeline basics
- [ ] Create initial test structure and utilities

### Phase 1 Deliverables
- ✅ Working Next.js application running on localhost:3000
- ✅ TypeScript configuration with strict type checking
- ✅ Tailwind CSS V4 with custom configuration and hot reloading
- ✅ ESLint 9 configuration with zero linting errors
- ✅ Organized folder structure: `/app`, `/components`, `/lib`, `/types`, `/tests`
- ✅ Git repository with initial commit and proper .gitignore
- ✅ Package.json with all dependencies and scripts configured
- ✅ Environment variables template (.env.example) ready for secrets
- ✅ README.md with clear setup and development instructions
- ✅ Testing framework (Jest, React Testing Library) configured
- ✅ Basic CI/CD pipeline setup with GitHub Actions
- ✅ Test utilities and helpers ready for use

### Phase 1 Success Criteria
- ✅ `npm run dev` starts the application without errors
- ✅ `npm run test` executes and passes initial tests
- ✅ `npm run build` compiles without errors
- ✅ `npm run lint` shows zero linting issues
- ✅ All team members can clone and run the project locally

## Phase 2: Database Design & Infrastructure
- [ ] Design database schema for:
  - [ ] Users (Google OAuth data)
  - [ ] Spotify connections/tokens
  - [ ] Listening history/tracks
  - [ ] Artists and songs metadata
  - [ ] User stats/analytics
- [ ] Set up Postgres database (local development)
- [ ] Configure Drizzle ORM with TypeScript
- [ ] Create initial database migrations
- [ ] Set up database seeding for development
- [ ] Test database connections and basic CRUD operations

### Phase 2 Deliverables
- ✅ Complete database schema diagram with relationships
- ✅ Drizzle ORM configuration with TypeScript types
- ✅ Database migration files for all tables
- ✅ Local Postgres database running and accessible
- ✅ Seed data for development and testing
- ✅ Working CRUD operations for all entities
- ✅ Database connection utilities and error handling
- ✅ Type-safe database queries and mutations
- ✅ Database schema validation and constraints
- ✅ Unit tests for all database operations
- ✅ Integration tests for schema validation

### Phase 2 Success Criteria
- ✅ Database migrations run successfully without errors
- ✅ All CRUD operations tested and working
- ✅ Seed data populates correctly in development
- ✅ Database tests pass in CI/CD pipeline
- ✅ Type safety verified for all database operations

## Phase 3: Authentication System
- [ ] Set up Google OAuth 2.0 integration
  - [ ] **USER INPUT NEEDED**: Google OAuth credentials (Client ID, Client Secret)
- [ ] Create authentication API routes
- [ ] Implement session management (NextAuth.js or custom)
- [ ] Create login/logout UI components
- [ ] Set up protected route middleware
- [ ] Test authentication flow end-to-end

### Phase 3 Deliverables
- ✅ Working Google OAuth login flow
- ✅ Secure session management with proper token handling
- ✅ Protected API routes that require authentication
- ✅ Login/logout UI components with loading states
- ✅ User profile creation and management
- ✅ Middleware for route protection
- ✅ Error handling for authentication failures
- ✅ Session persistence across browser refreshes
- ✅ Proper logout with session cleanup
- ✅ Unit tests for authentication helpers
- ✅ Integration tests for auth flow
- ✅ E2E tests for login/logout journey

### Phase 3 Success Criteria
- ✅ **Users can authenticate with Google OAuth**
- ✅ Protected routes redirect unauthenticated users
- ✅ Session persists across browser refreshes
- ✅ All authentication tests pass
- ✅ Auth flow works smoothly in development and staging

## Phase 4: Spotify Integration
- [ ] Set up Spotify Web API integration
  - [ ] **USER INPUT NEEDED**: Spotify App credentials (Client ID, Client Secret)
- [ ] Implement Spotify OAuth flow
- [ ] Create Spotify token management system
- [ ] Build data fetching services for:
  - [ ] User's recently played tracks
  - [ ] User's top artists/tracks
  - [ ] Track/artist metadata
- [ ] Implement data synchronization jobs
- [ ] Create error handling for API rate limits

### Phase 4 Deliverables
- ✅ Working Spotify OAuth connection flow
- ✅ Secure token storage and automatic refresh
- ✅ API services for fetching user listening data
- ✅ Data synchronization system with scheduling
- ✅ Rate limiting and error handling for Spotify API
- ✅ Database storage of listening history and metadata
- ✅ User interface for connecting/disconnecting Spotify
- ✅ Background jobs for periodic data updates
- ✅ API endpoints for accessing synchronized data
- ✅ Unit tests for Spotify API integration
- ✅ Mock tests for API rate limiting scenarios
- ✅ E2E tests for Spotify connection flow

### Phase 4 Success Criteria
- ✅ **Users can connect their Spotify account**
- ✅ **App successfully fetches and displays listening data**
- ✅ Data synchronization works without manual intervention
- ✅ Rate limiting handled gracefully
- ✅ All Spotify integration tests pass

## Phase 5: Core Features Development
- [ ] Build main dashboard layout
- [ ] Implement listening stats calculations:
  - [ ] Top artists (multiple time periods)
  - [ ] Top songs (multiple time periods)
  - [ ] Listening time analytics
  - [ ] Genre breakdowns
- [ ] Create data visualization components
- [ ] Build user profile management
- [ ] Implement data refresh/sync functionality

### Phase 5 Deliverables
- ✅ Functional dashboard displaying user stats
- ✅ Top artists and songs calculations with time periods
- ✅ Listening time analytics and genre breakdowns
- ✅ Data visualization components (charts, graphs)
- ✅ User profile management interface
- ✅ Manual and automatic data refresh functionality
- ✅ Performance-optimized queries for large datasets
- ✅ Export functionality for user data
- ✅ Real-time updates when new data is synced
- ✅ Unit tests for stats calculations and business logic
- ✅ Component tests for data visualization
- ✅ Performance tests for large datasets

### Phase 5 Success Criteria
- ✅ **Stats are accurate and updating properly**
- ✅ Dashboard loads quickly with large datasets
- ✅ Data calculations match expected results in tests
- ✅ Real-time updates work without page refresh
- ✅ All business logic tests pass

## Phase 6: UI/UX Implementation
- [ ] Set up shadcn/ui component library
- [ ] Create design system with warmer color palette
- [ ] Design and implement:
  - [ ] Landing page
  - [ ] Dashboard layout
  - [ ] Stats visualization cards
  - [ ] Navigation components
  - [ ] Mobile-responsive layouts
- [ ] Apply social app-inspired design patterns
- [ ] Implement loading states and error boundaries

### Phase 6 Deliverables
- ✅ Complete design system with warmer color palette
- ✅ Responsive layouts working on mobile and desktop
- ✅ Polished landing page with clear value proposition
- ✅ Intuitive dashboard navigation and user experience
- ✅ Beautiful data visualization cards and components
- ✅ Social app-inspired design patterns implemented
- ✅ shadcn/ui components customized with brand colors
- ✅ Loading states and error boundaries throughout app
- ✅ Accessibility compliance and keyboard navigation
- ✅ Component tests for all UI elements
- ✅ Visual regression tests for design consistency
- ✅ Accessibility tests and screen reader compatibility

### Phase 6 Success Criteria
- ✅ **Responsive design works on mobile and desktop**
- ✅ Design system is consistent across all components
- ✅ Accessibility scores 95+ on Lighthouse
- ✅ Visual tests pass for all screen sizes
- ✅ UI components render correctly in isolation

## Phase 7: Comprehensive Testing & QA
- [ ] Expand test coverage to >90% for critical paths
- [ ] Set up end-to-end testing (Playwright/Cypress)
- [ ] Create comprehensive e2e test suites:
  - [ ] Complete user registration/login flow
  - [ ] End-to-end Spotify connection and data sync
  - [ ] Dashboard navigation and interaction
  - [ ] Data visualization accuracy and interactions
- [ ] Performance testing and optimization
- [ ] Security testing and vulnerability scanning
- [ ] Cross-browser compatibility testing
- [ ] Load testing for concurrent users

### Phase 7 Deliverables
- ✅ Comprehensive test suite with >90% code coverage
- ✅ End-to-end test suite covering all critical user journeys
- ✅ Performance benchmarks and load testing results
- ✅ Security scan reports with all issues resolved
- ✅ Cross-browser compatibility verified
- ✅ Mobile device testing completed
- ✅ API stress testing with rate limiting validation
- ✅ Test documentation and maintenance guides
- ✅ Automated test reporting and monitoring

### Phase 7 Success Criteria
- ✅ **All tests passing** with >90% coverage
- ✅ E2E tests run successfully in CI/CD
- ✅ Performance meets benchmarks under load
- ✅ Security vulnerabilities resolved
- ✅ App works consistently across browsers and devices

## Phase 8: Deployment & Monitoring
- [ ] Set up Vercel deployment configuration
- [ ] Configure production environment variables
- [ ] Set up production database (Vercel Postgres or similar)
- [ ] Implement Sentry error monitoring
- [ ] Set up CI/CD pipeline with GitHub Actions
- [ ] Configure domain and SSL
- [ ] Performance optimization and monitoring

### Phase 8 Deliverables
- ✅ Live production application accessible via custom domain
- ✅ Vercel deployment with automatic deployments from main branch
- ✅ Production database with proper backup strategies
- ✅ Sentry error monitoring with alerting configured
- ✅ CI/CD pipeline with automated testing and deployment
- ✅ SSL certificate and security headers configured
- ✅ Performance monitoring and optimization implemented
- ✅ Environment variables and secrets properly managed
- ✅ Production-ready logging and debugging capabilities
- ✅ Production smoke tests and health checks
- ✅ Rollback procedures and disaster recovery plan

### Phase 8 Success Criteria
- ✅ **Successfully deployed to production**
- ✅ Production app handles real user traffic smoothly
- ✅ Monitoring alerts work and respond appropriately
- ✅ Deployment pipeline runs without manual intervention
- ✅ Production performance meets or exceeds staging benchmarks
- ✅ All production smoke tests pass after each deployment

## Open Questions Requiring User Input

### 1. Spotify API Setup
- Do you have a Spotify Developer account, or do you need help setting one up?
- What should be the app name and description for Spotify registration?

### 2. Google OAuth Setup
- Do you have a Google Cloud Console project, or should we create a new one?
- What domains should be authorized for OAuth redirects?

### 3. Database Hosting
- Should we use Vercel Postgres, or do you prefer another hosting solution?
- Any specific data retention policies or privacy considerations?

### 4. Design Preferences
- Any specific social apps that inspire the design direction?
- Preferred warm color palette (earth tones, sunset colors, etc.)?

### 5. Analytics & Features
- Which listening statistics are most important to you?
- Any specific time periods for "top" calculations (weekly, monthly, yearly)?
- Should we include social features (sharing stats, comparing with friends)?

### 6. Deployment
- Custom domain name preferences?
- Any specific performance or security requirements?

---
*This plan will be updated as we progress through development and gather more requirements.*
