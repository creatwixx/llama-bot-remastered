# Llama Bot Remastered

Discord bot monorepo with client, API, and bot services.

## Structure

- `packages/llama-client/` - Vite + React + TypeScript frontend
- `packages/llama-api/` - Fastify + Prisma + Bun backend API
- `packages/llama-bot/` - Discord.js + Bun bot service
- `infra/` - Docker Compose and infrastructure configuration

## Prerequisites

- Bun
- Node.js (for Vite tooling)
- Docker & Docker Compose

## Quick Start

### Using Railway Database (Recommended)

1. Create a PostgreSQL database in Railway (see `RAILWAY_SETUP.md`)
2. Copy environment template:
   ```bash
   cp infra/.env.example infra/.env
   # Edit infra/.env with your Railway DATABASE_URL and secrets
   ```

3. Run database migrations:
   ```bash
   cd packages/llama-api
   DATABASE_URL="your-railway-database-url" bunx prisma migrate dev --name init
   ```

4. Start services (without DB - using Railway's DB):
   ```bash
   docker compose -f infra/docker-compose.yml -f infra/docker-compose.override.yml up
   ```

### Using Local Docker Database (Alternative)

1. Copy environment template:
   ```bash
   cp infra/.env.example infra/.env
   # Edit infra/.env with your secrets
   ```

2. Start the database:
   ```bash
   docker compose -f infra/docker-compose.yml -f infra/docker-compose.local.yml up -d db
   ```

3. Run database migrations:
   ```bash
   cd packages/llama-api
   bunx prisma migrate dev --name init
   ```

4. Start all services:
   ```bash
   docker compose -f infra/docker-compose.yml up --build
   ```

## Development

For local development with hot reload, use the override file:
```bash
docker compose -f infra/docker-compose.yml -f infra/docker-compose.override.yml up
```

## Services

- **Client**: http://localhost:5173 (dev) / http://localhost:4173 (prod)
- **API**: http://localhost:3000
- **Bot**: Runs in background, exposes health at http://localhost:8080 (optional)

