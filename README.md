# Llama Bot Remastered

Discord bot with API backend for managing custom emotes. Built with Discord.js, Fastify, Prisma, and Bun.

## 🚀 Quick Setup (5 minutes)

### Option 1: Automated Setup (Recommended)

```bash
# Clone the repo
git clone <repository-url>
cd llama-bot-remastered

# Run automated setup (checks prerequisites, installs deps, sets up env file)
npm run setup
# or: ./setup.sh

# Edit infra/.env.local and add your values (script will prompt you)
# Then start development:
npm run dev
```

### Option 2: Manual Setup

**1. Prerequisites**

- **Bun**: Install from [bun.sh](https://bun.sh)
- **Docker**: Install from [docker.com](https://www.docker.com)
- **Railway account**: For database (free tier works)

**2. Clone and Configure**

```bash
# Clone the repo
git clone <repository-url>
cd llama-bot-remastered

# Copy environment file
cp infra/.env.local.example infra/.env.local

# Edit infra/.env.local and add your values:
# - DATABASE_URL: Get from Railway dashboard → PostgreSQL service → Variables tab
# - DISCORD_TOKEN: Get from discord.com/developers → Your App → Bot → Token
# - DISCORD_APP_ID: Get from discord.com/developers → Your App → General Information
# - DISCORD_GUILD_ID: (Optional) Right-click your server → Server Settings → Widget → Server ID
```

**3. Install and Setup**

```bash
# Install dependencies
bun install

# Run database migrations
npm run db:migrate
```

**4. Start Development**

```bash
# Start everything (API + Bot in Docker)
./start-dev.sh

# Or use npm script
npm run dev
```

**That's it!** Your bot should be running. Check:

- API: http://localhost:3000/health
- Bot health: http://localhost:8080/health

---

## 📁 Project Structure

```
llama-bot-remastered/
├── packages/
│   ├── llama-api/          # Backend API (Fastify + Prisma)
│   │   ├── src/
│   │   │   ├── routes/      # API endpoints (emotes.ts, commands.ts)
│   │   │   ├── server.ts    # API server entry point
│   │   │   └── prisma.ts    # Database client
│   │   └── prisma/
│   │       └── schema.prisma # Database schema
│   │
│   └── llama-bot/           # Discord bot (Discord.js)
│       └── src/
│           ├── commands/    # Discord slash commands
│           ├── listeners/   # Event listeners (message handlers)
│           └── utils/       # Utilities (API client)
│
└── infra/                   # Docker configuration
    ├── docker-compose.yml
    └── .env.local          # Your local config (not in git)
```

---

## 🛠️ Common Tasks

### Add a New Discord Command

1. Create a new file in `packages/llama-bot/src/commands/my-command.ts`:

```typescript
import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("mycommand")
    .setDescription("Does something cool"),
  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.reply("Hello from my command!");
  },
};
```

2. The command is automatically loaded! Restart the bot to see it.

3. Register commands with Discord:

```bash
npm run bot:register
```

### Add a New API Endpoint

1. Edit `packages/llama-api/src/routes/` or create a new route file
2. Example in `packages/llama-api/src/routes/emotes.ts` shows the pattern
3. Register the route in `packages/llama-api/src/server.ts`

### Database Tasks

```bash
# Run migrations
npm run db:migrate

# Open Prisma Studio (database GUI)
npm run db:studio

# Create a new migration (after changing schema.prisma)
cd packages/llama-api
bunx prisma migrate dev --name your_migration_name
```

### View Logs

```bash
# Docker logs
docker compose -f infra/docker-compose.yml -f infra/docker-compose.dev.yml logs -f

# Or view specific service
docker compose logs -f api
docker compose logs -f bot
```

---

## 🔧 Available Scripts

### Setup & Development

| Command           | Description                            |
| ----------------- | -------------------------------------- |
| `npm run setup`   | Automated setup (first time only)      |
| `npm run dev`     | Start development environment (Docker) |
| `npm run build`   | Build Docker images                    |
| `npm run start`   | Start production Docker containers     |
| `npm run stop`    | Stop Docker containers                 |
| `npm run restart` | Restart development environment        |

### Docker Management

| Command            | Description                            |
| ------------------ | -------------------------------------- |
| `npm run logs`     | View all service logs (follow)         |
| `npm run logs:api` | View API logs only                     |
| `npm run logs:bot` | View bot logs only                     |
| `npm run clean`    | Stop and remove all containers/volumes |

### Code Quality

| Command             | Description                             |
| ------------------- | --------------------------------------- |
| `npm run typecheck` | Check TypeScript in both packages       |
| `npm run verify`    | Full verification (TypeScript + Prisma) |

### Database

| Command                     | Description                        |
| --------------------------- | ---------------------------------- |
| `npm run db:migrate`        | Run database migrations            |
| `npm run db:migrate:docker` | Run migrations in Docker container |
| `npm run db:studio`         | Open Prisma Studio (database GUI)  |

### Bot

| Command                | Description                                |
| ---------------------- | ------------------------------------------ |
| `npm run bot:register` | Register Discord commands with Discord API |

---

## 🐛 Troubleshooting

### Bot not responding to commands

- Check if bot is online in Discord
- Verify `DISCORD_TOKEN` is correct in `.env.local`
- Run `npm run bot:register` to register commands
- Commands can take up to 1 hour to update globally (use `DISCORD_GUILD_ID` for instant updates)

### Database connection errors

- Verify `DATABASE_URL` in `.env.local` is correct
- Check Railway dashboard to ensure database is running
- Run `npm run db:migrate` to ensure migrations are up to date

### Docker issues

- Make sure Docker is running: `docker ps`
- Try rebuilding: `npm run build`
- Check logs: `docker compose logs`

### Port already in use

- Change ports in `infra/.env.local`: `API_PORT=3001` or `BOT_PORT=8081`
- Or stop other services using those ports

---

## 🔐 Environment Variables

All environment variables are documented in `infra/.env.local.example`. Here's a quick reference:

### Required Variables

| Variable         | Description                  | Where to Get                                            |
| ---------------- | ---------------------------- | ------------------------------------------------------- |
| `DATABASE_URL`   | PostgreSQL connection string | Railway dashboard → PostgreSQL service → Variables tab  |
| `DISCORD_TOKEN`  | Your Discord bot token       | discord.com/developers → Your App → Bot → Token         |
| `DISCORD_APP_ID` | Your Discord application ID  | discord.com/developers → Your App → General Information |

### Optional Variables

| Variable           | Description                           | Default                                               |
| ------------------ | ------------------------------------- | ----------------------------------------------------- |
| `DISCORD_GUILD_ID` | Server ID for faster command updates  | None (global commands)                                |
| `API_URL`          | API URL for bot to communicate        | `http://api:3000` (Docker) or `http://localhost:3000` |
| `API_PORT`         | API service port                      | `3000`                                                |
| `BOT_PORT`         | Bot health check port                 | `8080`                                                |
| `NODE_ENV`         | Environment mode                      | `production`                                          |
| `LOG_LEVEL`        | Logging level (debug/info/warn/error) | `info`                                                |

**Note**: For local development, copy `infra/.env.local.example` to `infra/.env.local` and fill in your values.

---

## 📡 API Endpoints

Base URL: `http://localhost:3000` (local) or your Railway API URL (production)

### Health Check

- `GET /health` - Check if API is running

### Emotes

- `GET /emotes` - Get all emotes (query: `?guildId=...&enabled=true`)
- `GET /emotes/:id` - Get emote by ID
- `POST /emotes` - Create new emote
  ```json
  {
    "trigger": "hello",
    "imageUrl": "https://example.com/image.png",
    "exactMatch": false,
    "enabled": true,
    "author": "username",
    "guildId": "optional-guild-id"
  }
  ```
- `PATCH /emotes/:id` - Update emote
- `DELETE /emotes/:id` - Delete emote
- `POST /emotes/check` - Check if message matches triggers
  ```json
  {
    "message": "hello world",
    "guildId": "optional-guild-id"
  }
  ```

### Commands

- `GET /commands` - Get all commands (query: `?guildId=...&enabled=true`)
- `GET /commands/:id` - Get command by ID
- `GET /commands/name/:name` - Get command by name (query: `?guildId=...`)
- `POST /commands` - Create new command
- `PATCH /commands/:id` - Update command
- `DELETE /commands/:id` - Delete command
- `POST /commands/:id/execute` - Execute command (increments use count)

---

## 🚢 Deployment (Railway)

### Quick Deploy

1. **Connect Repository**: Link your GitHub repo to Railway
2. **Add Services**: Create two services from your repo:
   - `llama-api` (uses `packages/llama-api/railway.json`)
   - `llama-bot` (uses `packages/llama-bot/railway.json`)
3. **Add PostgreSQL**: Add a PostgreSQL service in Railway
4. **Set Environment Variables**:

   **API Service:**

   - `DATABASE_URL` - Copy from PostgreSQL service variables
   - `NODE_ENV=production`
   - `LOG_LEVEL=info`

   **Bot Service:**

   - `DISCORD_TOKEN` - Your production bot token
   - `DISCORD_APP_ID` - Your production app ID
   - `DISCORD_GUILD_ID` - (Optional) For faster command updates
   - `DATABASE_URL` - Same as API service
   - `API_URL` - Use Railway's internal URL: `http://llama-api.railway.internal:3000`
   - `NODE_ENV=production`
   - `LOG_LEVEL=info`

5. **Deploy**: Push to `main` branch - Railway auto-deploys!

### Switching Deployment Providers

To deploy elsewhere (AWS, Render, Fly.io, etc.):

1. Update `railway.json` files or remove them
2. Update Dockerfiles if needed (`infra/Dockerfile.api`, `infra/Dockerfile.bot`)
3. Set environment variables in your provider's dashboard
4. Configure build/deploy commands in your provider

The code is provider-agnostic - only environment variables and build configs need changes.

---

## 💡 Tips for New Developers

- **Commands auto-load**: Just create a file in `commands/` folder
- **Hot reload**: Changes to code reload automatically in dev mode
- **Database changes**: Always create migrations, never edit the database directly
- **API communication**: Bot uses `packages/llama-bot/src/utils/api.ts` to talk to API
- **Type safety**: This project uses TypeScript - use types!

---

## 📚 Tech Stack

- **Runtime**: Bun
- **Bot**: Discord.js v14
- **API**: Fastify
- **Database**: PostgreSQL + Prisma ORM
- **Deployment**: Railway
- **Containers**: Docker

---

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test locally with `npm run dev`
4. Submit a pull request

Need help? Check the code examples in `packages/llama-bot/src/commands/` and `packages/llama-api/src/routes/`!
