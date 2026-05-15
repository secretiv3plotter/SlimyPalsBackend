# SlimyPalsBackend

Backend API for SlimyPals, built with Express, PostgreSQL, JWT auth, cron jobs, and WebSockets.

## Requirements

- Node.js
- npm
- PostgreSQL

## Setup

Install dependencies:

```bash
npm install
```

Create a `.env` file:

```env
PORT=3000
DATABASE_URL=postgres://user:password@localhost:5432/slimypals
JWT_SECRET=your-secret
JWT_EXPIRES_IN=15m
CORS_ORIGIN=http://localhost:5173
```

Apply the database schema:

```bash
psql "$DATABASE_URL" -f schema.sql
```

Start the server:

```bash
npm start
```

Start in development mode:

```bash
npm run dev
```

## Scripts

```text
npm start    Start the API server
npm run dev  Start with nodemon
npm test     Placeholder test script
```

## Project Structure

```text
src/
  app.js                 Express app setup, middleware, routes, and error handling
  server.js              HTTP and WebSocket server bootstrap
  features/              Feature modules grouped by game/API domain
    auth/                Registration, login, logout, and token refresh
    domain/              Current user domain, timers, slimes, friends, and food state
    foodFactory/         Food stock lookup and daily food production
    friends/             Friend requests, friend domains, and friend slime interactions
    interactions/        Interaction persistence for feed and poke events
    notifications/       Notification listing and read state updates
    slimes/              Slime listing, summoning, feeding, deletion, and generation logic
    sync/                Offline/client action sync and realtime sync event handling
    users/               User lookup and user persistence
  infrastructure/        External infrastructure adapters
    db.js                PostgreSQL connection pool and query helper
  jobs/                  Scheduled background work
    index.js             Daily summon reset and weekly soft-delete cleanup jobs
  realtime/              WebSocket and presence logic
    presenceManager.js   Online user tracking and realtime event delivery
  shared/                Cross-feature shared code
    middleware/          Auth and rate-limit middleware
```

## API Areas

Auth routes are mounted under `/api/auth`:

```text
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh
POST /api/auth/logout
```

Authenticated routes are mounted under `/api`:

```text
GET    /api/me
GET    /api/me/domain
GET    /api/me/timers
GET    /api/me/slimes
POST   /api/me/slimes/summon
POST   /api/me/slimes/:id/feed
DELETE /api/me/slimes/:id
GET    /api/me/food-factory
POST   /api/me/food-factory/produce
GET    /api/me/friends
POST   /api/me/friends
POST   /api/me/friends/:id/accept
DELETE /api/me/friends/:id
GET    /api/friends/:friendUserId/domain
POST   /api/friends/:friendUserId/slimes/:slimeId/feed
POST   /api/friends/:friendUserId/slimes/:slimeId/poke
GET    /api/me/notifications
POST   /api/me/notifications/:id/read
POST   /api/sync/actions
GET    /api/users/search
```

Health check:

```text
GET /health
```

## Realtime

WebSocket connections attach to the same HTTP server. Clients connect with a JWT token query parameter:

```text
ws://localhost:3000?token=<access-token>
```

Realtime events include friend presence, friend-list changes, domain updates, food updates, slime updates, and interaction notifications.

## Background Jobs

`src/jobs/index.js` registers cron jobs for:

- Daily summon reset
- Weekly cleanup of soft-deleted records older than seven days
