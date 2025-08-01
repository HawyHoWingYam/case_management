# Case Management System - Frontend

A modern Next.js frontend application for the Case Management System, built with TypeScript, Tailwind CSS, and shadcn/ui components.

## Technology Stack

- **Framework**: Next.js 15.4+ with App Router
- **Language**: TypeScript with strict mode
- **Styling**: Tailwind CSS v4 with CSS Variables
- **UI Components**: shadcn/ui component library
- **State Management**: React Query (TanStack Query) for server state
- **Form Handling**: React Hook Form with Zod validation
- **HTTP Client**: Axios with interceptors and auto-retry
- **Testing**: Jest + React Testing Library
- **Linting**: ESLint + Prettier
- **Icons**: Lucide React

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── globals.css         # Global styles with CSS variables
│   ├── layout.tsx          # Root layout with providers
│   ├── page.tsx           # Home page (health dashboard)
│   └── health/            # Health monitoring page
├── components/
│   ├── ui/                # shadcn/ui base components
│   ├── layout/            # Layout components (Header, Sidebar, etc.)
│   ├── features/          # Feature-specific components
│   └── providers/         # Context providers
├── lib/
│   ├── utils.ts           # Utility functions
│   ├── api.ts             # API client with auth
│   ├── constants.ts       # App constants and config
│   ├── types.ts           # TypeScript type definitions
│   └── validations.ts     # Zod validation schemas
├── hooks/                 # Custom React hooks
├── styles/                # Additional CSS files
└── __tests__/             # Test files
```

## Features Implemented

### Core Infrastructure
- ✅ Next.js 15+ with App Router and TypeScript
- ✅ Tailwind CSS v4 with design system tokens
- ✅ shadcn/ui component library integration
- ✅ Responsive layout with collapsible sidebar
- ✅ Dark/light theme support with system preference
- ✅ Error boundaries and loading states

### API Integration
- ✅ Axios HTTP client with interceptors
- ✅ React Query for server state management
- ✅ Automatic token refresh and error handling
- ✅ Type-safe API responses with TypeScript

### Health Dashboard
- ✅ System health monitoring
- ✅ Database connection status
- ✅ Memory usage tracking
- ✅ Real-time updates with auto-refresh
- ✅ Integration test placeholders for n8n

### Development Tools
- ✅ ESLint + Prettier configuration
- ✅ Jest + React Testing Library setup
- ✅ TypeScript strict mode
- ✅ Bundle analyzer integration
- ✅ Environment variable management

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Backend API running on port 3001 (see `/backend` directory)

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local with your configuration
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```

4. **Open browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

### Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run start           # Start production server

# Code Quality
npm run lint            # Run ESLint
npm run lint:fix        # Fix ESLint issues
npm run type-check      # Run TypeScript checking
npm run format          # Format code with Prettier

# Testing
npm test                # Run tests
npm run test:watch      # Run tests in watch mode
npm run test:cov        # Run tests with coverage

# Analysis
npm run analyze         # Analyze bundle size
```

## Configuration

### Environment Variables
Key environment variables (see `.env.local.example`):

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_APP_NAME="Case Management System"
NEXT_PUBLIC_APP_VERSION="1.0.0"
```

### API Configuration
The API client is configured in `src/lib/api.ts` with:
- Automatic token management
- Request/response interceptors
- Error handling and retry logic
- TypeScript type safety

### Theme Configuration
Tailwind CSS v4 configuration with CSS variables in `src/app/globals.css`:
- Light/dark theme support
- Design system tokens
- Responsive breakpoints
- Custom component styles
