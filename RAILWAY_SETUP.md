# Railway Setup Guide

This guide covers setting up your services on Railway.

## Step 1: Add PostgreSQL Database

1. Go to your Railway project: https://railway.app
2. Click **"+ New"** → **"Database"** → **"Add PostgreSQL"**
3. Railway will automatically create a PostgreSQL instance
4. Once created, click on the PostgreSQL service
5. Go to the **"Variables"** tab
6. Find **`DATABASE_URL`** - this is your connection string
7. Copy this value - you'll need it for:
   - Your local `.env` file
   - Your API service on Railway

## Step 2: Configure Database URL for Local Development

If you want to run migrations locally against Railway's database:

1. In `infra/.env`, update `DATABASE_URL` with the Railway value:

   ```env
   DATABASE_URL=postgresql://postgres:password@containers-us-west-xxx.railway.app:5432/railway
   ```

   (Your actual URL will look different - copy from Railway)

2. Now you can run migrations locally:
   ```bash
   cd packages/llama-api
   DATABASE_URL="your-railway-database-url" bunx prisma migrate dev --name init
   ```

## Step 3: Deploy Services to Railway

### Option A: Deploy All Services

1. **Create New Service** for each:

   - API service
   - Bot service
   - Client service (optional, or use Vercel/Netlify)

2. **Connect GitHub Repository** (recommended) or upload code

3. **Add Environment Variables** for each service:

   **For API Service:**

   - `DATABASE_URL` - from your Railway PostgreSQL service
   - `API_PORT=3000`
   - `NODE_ENV=production`
   - `JWT_SECRET=your-secret-here`
   - Other API vars as needed

   **For Bot Service:**

   - `DATABASE_URL` - same as API (or separate if preferred)
   - `DISCORD_TOKEN` - your bot token
   - `DISCORD_APP_ID` - your app ID
   - `DISCORD_GUILD_ID` - your guild ID
   - `NODE_ENV=production`
   - `REDIS_URL` - if you add Redis to Railway

### Option B: Use Docker Compose (Single Service)

Railway supports Docker Compose deployments:

1. Create a new service
2. Select "Docker Compose" as the deployment method
3. Point to your `infra/docker-compose.yml`
4. Railway will deploy all services together

## Step 4: Run Migrations in Railway

After deploying your API service:

1. Go to your API service in Railway
2. Open the **"Deployments"** tab
3. Click on the latest deployment
4. Open the **"Shell"** or use Railway CLI:
   ```bash
   railway run --service api bunx prisma migrate deploy
   ```

Or add a startup script that runs migrations automatically.

## Step 5: Configure Railway Service Settings

### API Service:

- **Start Command**: `bun run start`
- **Build Command**: (Docker handles this, or add `bun install && bunx prisma generate`)

### Bot Service:

- **Start Command**: `bun run start`
- **Build Command**: `bun install`

## Railway-Specific Environment Variables

Railway automatically provides:

- `PORT` - the port your service should listen on (Railway assigns this)
- `RAILWAY_ENVIRONMENT` - the environment name

Update your services to use Railway's PORT:

**For API (`packages/llama-api/src/server.ts`):**

```typescript
const port = parseInt(process.env.PORT || process.env.API_PORT || "3000", 10);
```

**For Bot health server:**

```typescript
const port = parseInt(process.env.PORT || process.env.BOT_PORT || "8080", 10);
```

## Quick Deploy Checklist

- [ ] PostgreSQL database created in Railway
- [ ] `DATABASE_URL` copied from Railway
- [ ] API service created and connected to repo
- [ ] Bot service created and connected to repo
- [ ] Environment variables set for each service
- [ ] Migrations run (`prisma migrate deploy`)
- [ ] Discord commands registered (`bun run register` locally or in Railway)
- [ ] Services are running and healthy

## Connecting Services Together

If deploying as separate services:

- They'll be on the same Railway network
- Use service names or `localhost` to communicate
- Or use Railway's public URLs for external access

## Tips

- Use Railway's **"Generate Domain"** to get HTTPS URLs for your services
- Set up **custom domains** for production
- Use Railway's **secrets** for sensitive values
- Monitor logs in Railway dashboard
- Use Railway's **metrics** to track resource usage
