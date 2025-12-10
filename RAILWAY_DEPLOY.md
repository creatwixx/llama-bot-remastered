# Railway Deployment Guide

This guide will help you deploy all services (API, Bot, Client) to Railway.

## Prerequisites

1. Railway account: https://railway.app
2. GitHub repository with your code
3. PostgreSQL database already created in Railway (you have this!)

## Step 1: Prepare Your Repository

Make sure your code is pushed to GitHub:
```bash
git add .
git commit -m "Prepare for Railway deployment"
git push origin main
```

## Step 2: Create Railway Project

1. Go to https://railway.app/dashboard
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your `llama-bot-remastered` repository
5. Railway will create a new project

## Step 3: Deploy API Service

1. In your Railway project, click **"+ New"** → **"GitHub Repo"**
2. Select the same repository
3. Railway will detect the service
4. Click on the service to configure it

### API Service Configuration:

**Settings:**
- **Name**: `llama-api` (or your preferred name)
- **Root Directory**: `packages/llama-api`
- **Build Command**: (leave empty, Docker handles this)
- **Start Command**: `bun run start`

**Environment Variables** (Add in Variables tab):
```
DATABASE_URL=${{Postgres.DATABASE_URL}}
API_PORT=3000
NODE_ENV=production
LOG_LEVEL=info
JWT_SECRET=your-jwt-secret-here
```

**Or use Docker:**
- In the service settings, enable **"Use Dockerfile"**
- Set **Dockerfile Path**: `infra/Dockerfile.api`
- Set **Docker Build Context**: `/` (root of repo)

## Step 4: Deploy Bot Service

1. Click **"+ New"** → **"GitHub Repo"**
2. Select the same repository again
3. Configure the service

### Bot Service Configuration:

**Settings:**
- **Name**: `llama-bot`
- **Root Directory**: `packages/llama-bot`
- **Start Command**: `bun run start`

**Environment Variables:**
```
DISCORD_TOKEN=your-discord-bot-token
DISCORD_APP_ID=your-discord-app-id
DISCORD_GUILD_ID=your-discord-guild-id
DATABASE_URL=${{Postgres.DATABASE_URL}}
NODE_ENV=production
LOG_LEVEL=info
BOT_PORT=8080
REDIS_URL=  # Optional, if you add Redis
```

**Or use Docker:**
- Enable **"Use Dockerfile"**
- Set **Dockerfile Path**: `infra/Dockerfile.bot`

## Step 5: Link PostgreSQL Database

1. In your Railway project, click on the **PostgreSQL** service
2. Go to **"Variables"** tab
3. Copy the `DATABASE_URL`
4. In your API and Bot services, add this as an environment variable:
   - Or use Railway's variable reference: `${{Postgres.DATABASE_URL}}`

## Step 6: Run Database Migrations

After deploying the API service:

### Option A: Via Railway CLI
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Run migrations
cd packages/llama-api
railway run bunx prisma migrate deploy
```

### Option B: Via Railway Dashboard
1. Go to your API service
2. Open **"Deployments"** tab
3. Click on the latest deployment
4. Open **"Shell"** or **"View Logs"**
5. Or use the **"Run Command"** feature to run: `bunx prisma migrate deploy`

### Option C: Add to Startup Script
Create a startup script that runs migrations automatically (recommended for production).

## Step 7: Register Discord Commands

After the bot is deployed, register slash commands:

### Option A: Run Locally (pointing to production)
```bash
cd packages/llama-bot
DATABASE_URL="your-railway-db-url" DISCORD_TOKEN="your-token" DISCORD_APP_ID="your-app-id" DISCORD_GUILD_ID="your-guild-id" bun run register
```

### Option B: Via Railway Shell
```bash
railway run --service llama-bot bun run register
```

## Step 8: Configure Service URLs

Railway will provide URLs for each service:
- API: `https://your-api.railway.app`
- Bot: `https://your-bot.railway.app` (health endpoint)

Update your client's `VITE_API_URL` if needed, or deploy the client separately.

## Step 9: Deploy Client (Optional)

### Option A: Deploy to Railway
1. Create a new service from the same repo
2. Root Directory: `packages/llama-client`
3. Build Command: `bun run build`
4. Start Command: Use a simple HTTP server or deploy as static files

### Option B: Deploy to Vercel/Netlify (Recommended for frontend)
- Vercel and Netlify are optimized for static sites
- Connect your GitHub repo
- Set root directory to `packages/llama-client`
- Build command: `bun run build` (or `npm run build`)
- Output directory: `dist`

## Step 10: Environment Variables Summary

### API Service:
```
DATABASE_URL=${{Postgres.DATABASE_URL}}
API_PORT=3000
NODE_ENV=production
LOG_LEVEL=info
JWT_SECRET=your-secret-key
```

### Bot Service:
```
DISCORD_TOKEN=your-discord-bot-token
DISCORD_APP_ID=your-discord-app-id
DISCORD_GUILD_ID=your-discord-guild-id
DATABASE_URL=${{Postgres.DATABASE_URL}}
NODE_ENV=production
LOG_LEVEL=info
BOT_PORT=8080
```

## Step 11: Verify Deployment

1. **Check API Health:**
   ```bash
   curl https://your-api.railway.app/health
   ```

2. **Check Bot Health:**
   ```bash
   curl https://your-bot.railway.app/health
   ```

3. **Test Discord Bot:**
   - Go to your Discord server
   - Type `/ping`
   - Bot should respond

## Troubleshooting

### Service won't start:
- Check logs in Railway dashboard
- Verify all environment variables are set
- Ensure DATABASE_URL is correct

### Database connection issues:
- Verify PostgreSQL service is running
- Check DATABASE_URL format
- Ensure migrations have run

### Bot not responding:
- Check bot logs in Railway
- Verify DISCORD_TOKEN is correct
- Ensure commands are registered

### Port issues:
- Railway provides PORT env var automatically
- Your code already handles this (PORT || API_PORT || 3000)
- No action needed

## Next Steps

After deployment:
1. ✅ Run database migrations
2. ✅ Register Discord commands
3. ✅ Test all endpoints
4. ✅ Set up custom domains (optional)
5. ✅ Configure monitoring/alerts

## Railway CLI Commands (Optional)

```bash
# Install CLI
npm i -g @railway/cli

# Login
railway login

# Link project
railway link

# View logs
railway logs

# Run command
railway run --service llama-api bunx prisma migrate deploy

# Open shell
railway shell
```

