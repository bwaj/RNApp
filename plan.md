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

## Phase 3: Authentication System
- [ ] Set up Google OAuth 2.0 integration
  - [ ] **USER INPUT NEEDED**: Google OAuth credentials (Client ID, Client Secret)
- [ ] Create authentication API routes
- [ ] Implement session management (NextAuth.js or custom)
- [ ] Create login/logout UI components
- [ ] Set up protected route middleware
- [ ] Test authentication flow end-to-end

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

## Phase 7: Testing Implementation
- [ ] Set up testing framework (Jest, React Testing Library)
- [ ] Write unit tests for:
  - [ ] Database operations
  - [ ] API utilities
  - [ ] Business logic functions
  - [ ] Authentication helpers
- [ ] Set up end-to-end testing (Playwright/Cypress)
- [ ] Create e2e tests for:
  - [ ] User registration/login flow
  - [ ] Spotify connection flow
  - [ ] Dashboard navigation
  - [ ] Data visualization accuracy

## Phase 8: Deployment & Monitoring
- [ ] Set up Vercel deployment configuration
- [ ] Configure production environment variables
- [ ] Set up production database (Vercel Postgres or similar)
- [ ] Implement Sentry error monitoring
- [ ] Set up CI/CD pipeline with GitHub Actions
- [ ] Configure domain and SSL
- [ ] Performance optimization and monitoring

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

## Success Criteria
- [ ] Users can authenticate with Google OAuth
- [ ] Users can connect their Spotify account
- [ ] App successfully fetches and displays listening data
- [ ] Stats are accurate and updating properly
- [ ] Responsive design works on mobile and desktop
- [ ] All tests passing
- [ ] Successfully deployed to production

---
*This plan will be updated as we progress through development and gather more requirements.*
