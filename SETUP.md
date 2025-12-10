# Setup Guide

This guide will help you get the Llama Bot monorepo up and running.

## Prerequisites

Install the following tools:

- **Bun**: https://bun.sh
- **Docker & Docker Compose**: https://docs.docker.com/get-docker/
- **Node.js** (optional, for Vite tooling): https://nodejs.org/

## Initial Setup

1. **Clone and navigate to the repository**:
   ```bash
   cd llama-bot-remastered
   ```

2. **Set up environment variables**:
   ```bash
   cp infra/.env.example infra/.env
   ```
   Edit `infra/.env` and fill in your secrets:
   - `DISCORD_TOKEN`: Your Discord bot token
   - `DISCORD_APP_ID`: Your Discord application ID
   - `DISCORD_GUILD_ID`: Your Discord guild/server ID (for dev commands)
   - `JWT_SECRET`: A random secret for JWT tokens
   - Update database credentials if needed

3. **Start the database**:
   ```bash
   docker compose -f infra/docker-compose.yml up -d db
   ```

4. **Run database migrations**:
   ```bash
   cd packages/llama-api
   bun install
   bunx prisma migrate dev --name init
   ```

5. **Register Discord slash commands**:
   ```bash
   cd packages/llama-bot
   bun install
   bun run register
   ```

## Development

### Start all services with hot reload:
```bash
docker compose -f infra/docker-compose.yml -f infra/docker-compose.override.yml up
```

Or use the npm script:
```bash
bun install  # Install root dependencies if using workspaces
bun run dev
```

### Start services individually:

**API only:**
```bash
cd packages/llama-api
bun run dev
```

**Bot only:**
```bash
cd packages/llama-bot
bun run dev
```

**Client only:**
```bash
cd packages/llama-client
bun install
bun run dev
```

## Production Build

1. **Build all Docker images**:
   ```bash
   docker compose -f infra/docker-compose.yml build
   ```

2. **Start all services**:
   ```bash
   docker compose -f infra/docker-compose.yml up -d
   ```

3. **Run database migrations in production**:
   ```bash
   docker compose -f infra/docker-compose.yml exec api bunx prisma migrate deploy
   ```

## Service URLs

- **Client**: http://localhost:5173 (dev) / http://localhost:4173 (prod)
- **API**: http://localhost:3000
- **Bot Health**: http://localhost:8080/health
- **Database**: localhost:5432 (postgres/postgres)
- **Redis**: localhost:6379

## Troubleshooting

### Database connection issues
- Ensure the database container is running: `docker compose -f infra/docker-compose.yml ps db`
- Check DATABASE_URL in `infra/.env` matches docker-compose settings

### Bot not responding
- Verify DISCORD_TOKEN is correct in `infra/.env`
- Ensure commands are registered: `cd packages/llama-bot && bun run register`
- Check bot logs: `docker compose -f infra/docker-compose.yml logs bot`

### Port conflicts
- Update port mappings in `infra/docker-compose.yml` if ports are already in use

## Next Steps

- Add more slash commands in `packages/llama-bot/src/commands/`
- Create API routes in `packages/llama-api/src/routes/`
- Extend Prisma schema in `packages/llama-api/prisma/schema.prisma`
- Build out the React client in `packages/llama-client/src/`

