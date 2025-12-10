# Llama Bot Remastered

Discord bot monorepo with client, API, and bot services.

## Quick Start

### Development (Local Docker + Dev Bot)

```bash
# Start development environment
./start-dev.sh

# Or manually:
export $(cat infra/.env.local | grep -v '^#' | grep -v '^$' | xargs)
docker compose -f infra/docker-compose.yml -f infra/docker-compose.dev.yml up
```

### Production (Railway)

Deployed automatically when you push to GitHub. Services run on Railway.

## Structure

- `packages/llama-client/` - Vite + React + TypeScript frontend
- `packages/llama-api/` - Fastify + Prisma + Bun backend API
- `packages/llama-bot/` - Discord.js + Bun bot service
- `infra/` - Docker Compose and infrastructure configuration

## Prerequisites

- Bun
- Docker & Docker Compose
- Railway account (for production deployment)

## Services

- **Client**: http://localhost:5173 (dev)
- **API**: http://localhost:3000
- **Bot**: Health endpoint at http://localhost:8080/health

## Documentation

See `docs/` directory for detailed guides (currently being organized).

