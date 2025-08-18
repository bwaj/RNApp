# Music Tracker App

A web application to track music listening habits and provide detailed statistics on your top artists and songs using Spotify integration.

## Features

- 🎵 **Spotify Integration** - Connect your Spotify account to automatically track listening habits
- 📊 **Detailed Analytics** - View your top artists, songs, genres, and listening patterns
- 🔐 **Google OAuth** - Secure authentication without passwords
- 📱 **Responsive Design** - Beautiful, social app-inspired UI that works on all devices
- 🎨 **Warm Color Palette** - Intentional design with warmer tones

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS V4, shadcn/ui
- **Backend**: Postgres, Drizzle ORM
- **Authentication**: Google OAuth, NextAuth.js
- **Infrastructure**: Vercel, Sentry
- **Package Manager**: pnpm
- **Testing**: Jest, React Testing Library

## Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm
- Postgres database

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd music-tracker
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
# Fill in your environment variables
```

4. Run the development server:
```bash
pnpm dev
```

5. Open [http://localhost:3000](http://localhost:3000) to view the app.

### Available Scripts

- `pnpm dev` - Start development server with Turbopack
- `pnpm build` - Build the application for production
- `pnpm start` - Start the production server
- `pnpm lint` - Run ESLint
- `pnpm test` - Run tests
- `pnpm test:watch` - Run tests in watch mode
- `pnpm test:coverage` - Run tests with coverage report

## Development

### Project Structure

```
src/
├── app/          # Next.js App Router pages
├── components/   # Reusable UI components
├── lib/          # Utility functions and configurations
├── types/        # TypeScript type definitions
└── tests/        # Test utilities and setup
```

### Testing

The project uses Jest and React Testing Library for testing. Tests are located alongside components and pages in `__tests__` directories.

Run tests:
```bash
pnpm test
```

### Contributing

1. Create a feature branch
2. Make your changes
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## Environment Variables

See `.env.example` for required environment variables. You'll need:

- Google OAuth credentials
- Spotify API credentials
- Database connection string
- NextAuth configuration

## License

This project is private and proprietary.