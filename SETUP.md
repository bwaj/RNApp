# 🎵 Music Tracker - Local Development Setup

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js 18+** - [Download here](https://nodejs.org/)
- **pnpm** - Install with: `npm install -g pnpm`
- **Docker & Docker Compose** - [Download Docker Desktop](https://www.docker.com/products/docker-desktop/)
- **Git** - [Download here](https://git-scm.com/)

## 🚀 Quick Start (5 minutes)

### 1. Clone & Install Dependencies

```bash
# Clone the repository
git clone <your-repo-url>
cd RNApp

# Install dependencies
pnpm install
```

### 2. Environment Setup

```bash
# Copy environment template
cp .env.example .env.local

# Edit .env.local with your credentials (see below)
```

### 3. Database Setup

```bash
# Start PostgreSQL database
docker compose up -d

# Generate and run database migrations
pnpm db:generate
pnpm db:push

# Optional: Seed with test data
pnpm db:seed
```

### 4. Start Development Server

```bash
# Start the Next.js development server
pnpm dev
```

🎉 **That's it!** Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📋 Detailed Setup Guide

### Environment Variables (.env.local)

You need to configure these environment variables:

```bash
# Authentication (Required for Google OAuth)
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=http://localhost:3000

# Database (Already configured for local Docker)
DATABASE_URL=postgresql://music_tracker_user:music_tracker_password@localhost:5432/music_tracker

# Spotify API (Required for Spotify integration)
SPOTIFY_CLIENT_ID=your_spotify_client_id_here
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret_here

# Environment
NODE_ENV=development

# Monitoring (Optional)
SENTRY_DSN=your_sentry_dsn_here
```

### Getting API Credentials

#### 🔐 Google OAuth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth client ID"
5. Set authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
6. Copy Client ID and Client Secret to `.env.local`

#### 🎵 Spotify API Setup
1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new app
3. Set redirect URI: `http://localhost:3000/api/spotify/callback`
4. Copy Client ID and Client Secret to `.env.local`

#### 🔑 NextAuth Secret
Generate a secure secret:
```bash
openssl rand -base64 32
```

### Database Management

```bash
# View database in browser (Drizzle Studio)
pnpm db:studio

# Reset database (if needed)
docker compose down -v
docker compose up -d
pnpm db:push

# Check database connection
docker exec -it music-tracker-db psql -U music_tracker_user -d music_tracker
```

---

## 🧪 Testing

```bash
# Run unit tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage

# Run E2E tests (requires app to be running)
pnpm test:e2e

# Run E2E tests with UI
pnpm test:e2e:ui
```

---

## 🛠️ Development Commands

```bash
# Development
pnpm dev              # Start development server
pnpm build            # Build for production
pnpm start            # Start production server
pnpm lint             # Run ESLint

# Database
pnpm db:generate      # Generate migrations
pnpm db:migrate       # Run migrations  
pnpm db:push          # Push schema to database
pnpm db:studio        # Open Drizzle Studio
pnpm db:seed          # Seed test data

# Testing
pnpm test             # Unit tests
pnpm test:e2e         # E2E tests
pnpm test:coverage    # Coverage report
```

---

## 📱 Accessing the Application

Once running, you can access:

- **Main App**: [http://localhost:3000](http://localhost:3000)
- **Database Studio**: [http://localhost:4983](http://localhost:4983) (when running `pnpm db:studio`)
- **API Docs**: [http://localhost:3000/api](http://localhost:3000/api)

### Test User Flow

1. Go to [http://localhost:3000](http://localhost:3000)
2. Click "Get Started" 
3. Sign in with Google OAuth
4. Connect your Spotify account
5. Sync your music data
6. Explore your dashboard and analytics!

---

## 🐛 Troubleshooting

### Common Issues

**Database Connection Error**
```bash
# Check if Docker is running
docker ps

# Restart database
docker compose restart postgres
```

**Port Already in Use**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
pnpm dev -- -p 3001
```

**Environment Variables Not Loading**
```bash
# Ensure .env.local exists and has correct values
cat .env.local

# Restart development server
```

**OAuth Redirect Errors**
- Check that your Google OAuth redirect URI matches exactly
- Ensure NEXTAUTH_URL is set correctly
- Verify Spotify redirect URI is configured

**Database Schema Issues**
```bash
# Reset and regenerate schema
pnpm db:push --force
```

### Performance Issues

If the app feels slow:
```bash
# Clear Next.js cache
rm -rf .next

# Restart development server
pnpm dev
```

---

## 🎯 What's Included

✅ **Full-Stack Music Tracking App**
- Google OAuth authentication
- Spotify API integration  
- Real-time dashboard with music stats
- Beautiful data visualizations
- Mobile-responsive design

✅ **Production-Ready Features**
- Advanced caching system
- Error boundaries and handling
- Comprehensive test suite
- Performance monitoring
- SEO optimization
- Accessibility compliance

✅ **Developer Experience**
- TypeScript throughout
- Hot reload development
- Database migrations
- Code splitting and lazy loading
- Professional error handling

---

## 🆘 Need Help?

If you encounter any issues:

1. Check this guide first
2. Look at the error logs in terminal
3. Check browser console for frontend errors
4. Verify all environment variables are set
5. Make sure Docker is running for database

**Happy coding!** 🎵✨
