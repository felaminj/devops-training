# Earthquake Monitoring Dashboard

Production-ready monorepo for monitoring live seismic activity from the USGS Earthquake GeoJSON feed.

## Project Overview

This project provides a full-stack earthquake monitoring platform with:

- A TypeScript Express API that proxies and caches USGS earthquake data
- A Vue 3 dashboard with map visualization, filtering, and real-time refresh
- Shared TypeScript packages for types and utilities across frontend and backend

## Architecture

```mermaid
flowchart TB
  subgraph Client
    FE[Vue 3 Frontend]
  end

  subgraph Monorepo
    ST[@earthquake/shared-types]
    SU[@earthquake/shared-utils]
    BE[Express Backend]
  end

  subgraph External
    USGS[USGS GeoJSON Feed]
  end

  FE -->|Axios REST| BE
  FE --> ST
  FE --> SU
  BE --> ST
  BE --> SU
  BE -->|Axios + 60s cache| USGS
```

### Backend Clean Architecture

```
routes -> controllers -> services -> repositories
                |
         middleware / validators
```

- **Routes**: HTTP endpoint definitions
- **Controllers**: Request/response orchestration
- **Services**: Business logic, filtering, pagination, stats
- **Repositories**: USGS API integration and in-memory caching
- **Middleware**: Logging, validation, error handling, rate limiting
- **Validators**: Zod schemas for query and path params

### Frontend Architecture

```
pages -> components -> composables -> stores -> services
```

- **Pages**: Dashboard, Map, Details, Not Found
- **Components**: Reusable UI building blocks
- **Composables**: Map logic, filters, auto-refresh
- **Stores**: Pinia state for earthquakes and theme
- **Services**: Axios API client

## Monorepo Structure

```
earthquake-monitoring-dashboard/
├── apps/
│   ├── backend/
│   └── frontend/
├── packages/
│   ├── shared-types/
│   └── shared-utils/
├── docker-compose.yml
└── package.json
```

## Installation

```bash
git clone <repository-url>
cd earthquake-monitoring-dashboard
npm install
cp .env.example .env
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env
```

## Development

Start both apps concurrently:

```bash
npm run dev
```

- Frontend: http://localhost:5174
- Backend: http://localhost:3005

Run individually:

```bash
npm run dev -w @earthquake/backend
npm run dev -w @earthquake/frontend
```

## Build Process

```bash
npm run build
```

Build order:

1. `@earthquake/shared-types`
2. `@earthquake/shared-utils`
3. `@earthquake/backend`
4. `@earthquake/frontend`

## Testing and Linting

```bash
npm run lint
npm run test
```

Husky + lint-staged run on pre-commit.

## Deployment

### Docker Compose

```bash
docker compose up --build
```

- Backend: http://localhost:3005
- Frontend: http://localhost:5174

### Cloud Run (Backend)

Build and deploy the backend image:

```bash
docker build -f apps/backend/Dockerfile -t earthquake-backend .
gcloud run deploy earthquake-backend --image earthquake-backend --port 3005
```

Set environment variables:

- `PORT=3005`
- `USGS_API_URL=https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary`
- `CACHE_TTL=60`

### Vercel (Frontend)

Deploy `apps/frontend` with:

- Build command: `npm run build -w @earthquake/frontend`
- Output directory: `apps/frontend/dist`
- Environment variable: `VITE_API_URL=https://<your-backend-url>/api`

## Environment Variables

### Backend

| Variable | Description | Default |
|---|---|---|
| `PORT` | API port | `3005` |
| `USGS_API_URL` | USGS summary feed base URL | USGS summary endpoint |
| `CACHE_TTL` | Cache TTL in seconds | `60` |
| `RATE_LIMIT_ENABLED` | Enable API rate limiting | `false` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | `60000` |
| `RATE_LIMIT_MAX` | Max requests per window | `100` |
| `NODE_ENV` | Runtime environment | `development` |
| `LOG_LEVEL` | Pino log level | `info` |

### Frontend

| Variable | Description | Default |
|---|---|---|
| `VITE_API_URL` | Backend API base URL | `http://localhost:3005/api` |

## API Documentation

All successful responses use:

```json
{
  "success": true,
  "data": {},
  "timestamp": "2026-06-09T00:00:00.000Z"
}
```

### Endpoints

#### `GET /api/health`

Health check with uptime and environment.

#### `GET /api/earthquakes/stats`

Dashboard metrics:

- total earthquakes
- largest magnitude
- average magnitude
- significant events
- latest earthquake

#### `GET /api/earthquakes/latest`

Latest earthquakes (last 24 hours).

Query params:

- `search`
- `minMagnitude`
- `maxMagnitude`
- `sortBy` (`time` | `magnitude`)
- `sortOrder` (`asc` | `desc`)
- `page`
- `pageSize`

#### `GET /api/earthquakes/significant`

Significant earthquakes from USGS significant feed.

#### `GET /api/earthquakes/magnitude/:min`

Earthquakes with magnitude greater than or equal to `:min`.

#### `GET /api/earthquakes/:id`

Single earthquake by event ID.

## Architectural Decisions

1. **npm workspaces**: Keeps frontend, backend, and shared packages versioned together while allowing independent builds.
2. **Shared packages**: Prevents type drift between API responses and UI models.
3. **Repository pattern**: Isolates USGS API and caching from business logic for easier testing and replacement.
4. **In-memory cache**: Simple 60-second TTL reduces USGS load and improves API latency for Cloud Run deployments.
5. **Zod validation**: Runtime validation at API boundaries with typed outputs.
6. **Pinia + composables**: Separates state from presentation and keeps Vue components lean.
7. **Leaflet marker clustering**: Handles dense earthquake regions on the map without performance degradation.
8. **60-second client polling**: USGS feeds update roughly every minute, so simple polling is sufficient and keeps the stack simple.

## License

MIT
