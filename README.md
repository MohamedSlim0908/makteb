# Makteb

A Skool-style community + courses + gamification platform built for Tunisia and North Africa.

## Tech Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS v4, TanStack Query, Zustand, React Router v6, Socket.IO
- **Backend**: Express.js (v5), TypeScript, Prisma ORM, Passport.js, Socket.IO, BullMQ
- **Database**: PostgreSQL 16, Redis 7
- **Payments**: Flouci (Tunisian local gateway)

## Getting Started

### Prerequisites

- Node.js 20+
- Docker & Docker Compose (for PostgreSQL and Redis)

### 1. Start the database

```bash
docker compose up -d
```

This starts PostgreSQL on port 5432 and Redis on port 6379.

### 2. Set up the server

```bash
cd server
cp ../.env.example .env   # Edit with your credentials
npm install
npx prisma db push        # Push schema to database
npm run dev               # Starts on http://localhost:4000
```

### 3. Set up the client

```bash
cd client
npm install
npm run dev   # Starts on http://localhost:5173
```

### 4. Open the app

Visit [http://localhost:5173](http://localhost:5173)

## Project Structure

```
makteb/
├── client/                  React frontend (Vite + TypeScript)
│   └── src/
│       ├── components/      Shared UI components
│       ├── hooks/           Custom React hooks
│       ├── lib/             API client, socket, utilities
│       ├── pages/           Route pages
│       └── store/           Zustand state stores
├── server/                  Express backend (TypeScript)
│   ├── prisma/              Database schema
│   └── src/
│       ├── config/          Environment config
│       ├── lib/             Prisma, Redis, Socket.IO
│       ├── middleware/      Auth middleware
│       └── modules/         Feature modules
│           ├── auth/        Authentication (local + OAuth)
│           ├── community/   Communities, posts, comments
│           ├── courses/     Courses, modules, lessons
│           ├── gamification/ Points, levels, leaderboards
│           └── payments/    Flouci integration
└── docker-compose.yml       PostgreSQL + Redis
```

## Features

- **Communities**: Create and join communities, post discussions, comments, likes
- **Courses**: Create courses with modules and lessons (video, text, quiz), track progress
- **Gamification**: Points for actions, levels, leaderboards per community
- **Payments**: Flouci integration for paid courses and communities (TND)
- **Real-time**: Socket.IO for live post updates and notifications
- **Auth**: Email/password + Google + Facebook OAuth

## API Endpoints

### Auth
- `POST /auth/register` - Register with email/password
- `POST /auth/login` - Login
- `POST /auth/refresh` - Refresh access token
- `GET /auth/me` - Get current user
- `PUT /auth/me` - Update profile
- `GET /auth/google` - Google OAuth
- `GET /auth/facebook` - Facebook OAuth

### Communities
- `GET /api/communities` - List communities
- `POST /api/communities` - Create community
- `GET /api/communities/:slug` - Get community
- `POST /api/communities/:id/join` - Join
- `DELETE /api/communities/:id/leave` - Leave

### Posts
- `GET /api/posts/community/:id` - List posts
- `POST /api/posts` - Create post
- `POST /api/posts/:id/like` - Like/unlike
- `POST /api/posts/:id/comments` - Add comment

### Courses
- `GET /api/courses/community/:id` - List courses
- `POST /api/courses` - Create course
- `POST /api/courses/:id/enroll` - Enroll
- `POST /api/lessons/:id/complete` - Complete lesson

### Gamification
- `GET /api/gamification/leaderboard/:communityId` - Leaderboard
- `GET /api/gamification/points/:communityId` - My points

### Payments
- `POST /api/payments/initiate` - Start payment
- `POST /api/payments/verify/:id` - Verify payment
- `GET /api/payments/earnings/:communityId` - Creator earnings
