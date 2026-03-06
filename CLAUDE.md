# CLAUDE.md — Makteb Project Instructions

## Project Overview

Makteb is a community-based online learning platform (courses, discussions, gamification, payments). It's a monorepo with two independent apps communicating via REST API and WebSocket.

## Architecture

```
client/   → React 19 + Vite 7 (port 5173)
server/   → Express 5 + Prisma 7 + PostgreSQL 16 + Redis 7 (port 4000)
```

Vite proxies `/api`, `/auth`, and `/socket.io` to the server.

## Tech Stack

- **Frontend:** React 19, React Router v7, TanStack Query v5, Zustand v5, Tailwind CSS v4, Tiptap v3, Axios, Lucide icons, Socket.IO client
- **Backend:** Express 5, Prisma 7 (PostgreSQL), Redis/BullMQ, Passport.js (JWT + OAuth), Zod v4, Socket.IO, Multer + Cloudinary
- **Testing:** Vitest + Supertest (server only)
- **Infra:** Docker Compose for PostgreSQL + Redis

## Project Structure

```
server/src/
  app.js              # Express app setup
  index.js            # Server entry point
  config/             # App configuration
  lib/                # Shared utilities
  middleware/          # Express middleware
  modules/            # Feature modules (auth, community, courses, gamification, payments)
  scripts/            # Seed scripts
  types/              # Type definitions

client/src/
  main.jsx            # App entry point
  App.jsx             # Root component with routing
  assets/             # Static assets
  components/         # Shared UI components
  features/           # Feature-specific components
  hooks/              # Custom React hooks
  layouts/            # Layout components
  lib/                # Utilities (api.js, etc.)
  pages/              # Page components
  store/              # Zustand stores
```

## Common Commands

### Infrastructure
```bash
docker compose up -d          # Start PostgreSQL + Redis
```

### Server (run from server/)
```bash
npm run dev                   # Start dev server (node --watch)
npm run start                 # Start production server
npm run db:push               # Push Prisma schema to DB
npm run db:generate           # Generate Prisma client
npm run db:seed               # Seed fake platform data
npm run db:studio             # Open Prisma Studio
npm test                      # Run tests (vitest run)
npm run test:watch            # Run tests in watch mode
npm run test:coverage         # Run tests with coverage
```

### Client (run from client/)
```bash
npm run dev                   # Start Vite dev server
npm run build                 # Build for production
npm run lint                  # Run ESLint
npm run preview               # Preview production build
```

## Environment

- Copy `.env.example` to `.env` at the project root
- Server also has its own `server/.env`
- Key vars: `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `PORT`, `CLIENT_URL`
- Never commit `.env` files

## Database

- ORM: Prisma 7 with PostgreSQL adapter (`@prisma/adapter-pg`)
- Schema: `server/prisma/schema.prisma`
- Config: `server/prisma.config.js`
- After schema changes: `npm run db:push` then `npm run db:generate`

## Testing

- Server tests use Vitest with `NODE_ENV=test`
- Test files: `server/src/**/*.test.js`
- Tests are isolated per file
- Run from `server/`: `npm test`

## Code Conventions

- ES Modules throughout (`"type": "module"` in both package.json files)
- Server modules follow feature-based structure (auth, community, courses, etc.)
- Frontend uses feature-based organization with shared components
- Language: project documentation is in French, code is in English
- Styling: Tailwind CSS v4 utility classes
- State management: Zustand for client state, TanStack Query for server state
