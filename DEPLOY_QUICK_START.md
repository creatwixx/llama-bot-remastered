# Quick Railway Deployment Steps

## ✅ Prerequisites Done
- [x] PostgreSQL database in Railway (you already have this!)
- [x] Discord bot tokens configured
- [x] Code is Railway-ready

## 🚀 Deploy to Railway (3 Services)

### 1. Deploy API Service

1. Go to Railway Dashboard → **"+ New"** → **"GitHub Repo"**
2. Select your `llama-bot-remastered` repository
3. Service Settings:
   - **Name**: `llama-api`
   - **Root Directory**: Leave empty (or `packages/llama-api` if using Nixpacks)
   - **Build Command**: (leave empty - Docker handles it)
   - **Start Command**: `bun run start`
   
   **OR Use Docker:**
   - Click **"Settings"** → **"Deploy"** → Enable **"Docker"**
   - **Dockerfile Path**: `infra/Dockerfile.api`
   - **Docker Build Context**: `/` (root)

4. Environment Variables (in "Variables" tab):
   ```
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   NODE_ENV=production
   LOG_LEVEL=info
   JWT_SECRET=your-jwt-secret-here
   ```

### 2. Deploy Bot Service

1. **"+ New"** → **"GitHub Repo"** → Same repository
2. Service Settings:
   - **Name**: `llama-bot`
   - **Root Directory**: `packages/llama-bot` (if using Nixpacks)
   - **Start Command**: `bun run start`
   
   **OR Use Docker:**
   - Enable **"Docker"**
   - **Dockerfile Path**: `infra/Dockerfile.bot`

3. Environment Variables:
   ```
   DISCORD_TOKEN=your-discord-bot-token
   DISCORD_APP_ID=your-discord-app-id
   DISCORD_GUILD_ID=your-discord-guild-id
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   NODE_ENV=production
   LOG_LEVEL=info
   ```

### 3. Link Database to Services

1. Click on **PostgreSQL** service → **"Variables"** tab
2. Copy `DATABASE_URL` or use `${{Postgres.DATABASE_URL}}` in other services
3. Add `DATABASE_URL` to both API and Bot services

### 4. Run Database Migrations

After API service deploys, run migrations:

**Option A: Railway Dashboard**
- Go to API service → **"Deployments"** → Latest deployment → **"View Logs"** or **"Run Command"**
- Run: `bunx prisma migrate deploy`

**Option B: Railway CLI**
```bash
railway login
railway link
cd packages/llama-api
railway run bunx prisma migrate deploy
```

### 5. Register Discord Commands

After bot deploys, register commands locally (one time):
```bash
cd packages/llama-bot
DISCORD_TOKEN="your-token" DISCORD_APP_ID="your-app-id" DISCORD_GUILD_ID="your-guild-id" bun run register
```

### 6. Verify Deployment

- API Health: `https://your-api.railway.app/health`
- Bot Health: `https://your-bot.railway.app/health`
- Test Discord: Type `/ping` in your server

## 📝 Notes

- Railway automatically provides `PORT` env var - your code handles this ✅
- Services will get HTTPS URLs automatically
- Check logs in Railway dashboard if something fails
- Migrations only need to run once

## 🎯 Next Steps After Deployment

1. Test all endpoints
2. Verify Discord bot responds to `/ping`
3. Set up custom domains (optional)
4. Configure monitoring

