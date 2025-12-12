#!/bin/bash
# Setup script for Llama Bot Remastered
# Automates initial setup for new contributors

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo "🚀 Llama Bot Remastered - Setup"
echo "================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
echo "📋 Checking prerequisites..."

# Check Bun
if command -v bun &> /dev/null; then
    BUN_VERSION=$(bun --version)
    echo -e "${GREEN}✅ Bun installed${NC} (version: $BUN_VERSION)"
else
    echo -e "${RED}❌ Bun not found!${NC}"
    echo "   Install from: https://bun.sh"
    exit 1
fi

# Check Docker
if command -v docker &> /dev/null; then
    if docker ps &> /dev/null; then
        DOCKER_VERSION=$(docker --version | cut -d' ' -f3 | cut -d',' -f1)
        echo -e "${GREEN}✅ Docker installed and running${NC} (version: $DOCKER_VERSION)"
    else
        echo -e "${YELLOW}⚠️  Docker installed but not running${NC}"
        echo "   Please start Docker Desktop and run this script again"
        exit 1
    fi
else
    echo -e "${RED}❌ Docker not found!${NC}"
    echo "   Install from: https://www.docker.com"
    exit 1
fi

# Check Docker Compose
if command -v docker compose &> /dev/null || command -v docker-compose &> /dev/null; then
    echo -e "${GREEN}✅ Docker Compose available${NC}"
else
    echo -e "${RED}❌ Docker Compose not found!${NC}"
    exit 1
fi

echo ""
echo "✅ All prerequisites met!"
echo ""

# Setup environment file
echo "📝 Setting up environment variables..."

if [ -f "infra/.env.local" ]; then
    echo -e "${YELLOW}⚠️  infra/.env.local already exists${NC}"
    echo "   Skipping environment file creation"
    echo "   If you need to recreate it, delete it first and run this script again"
else
    if [ -f "infra/.env.local.example" ]; then
        cp infra/.env.local.example infra/.env.local
        echo -e "${GREEN}✅ Created infra/.env.local from example${NC}"
        echo ""
        echo -e "${YELLOW}⚠️  IMPORTANT: Edit infra/.env.local and add your values:${NC}"
        echo "   - DATABASE_URL: Get from Railway dashboard → PostgreSQL service → Variables tab"
        echo "   - DISCORD_TOKEN: Get from discord.com/developers → Your App → Bot → Token"
        echo "   - DISCORD_APP_ID: Get from discord.com/developers → Your App → General Information"
        echo "   - DISCORD_GUILD_ID: (Optional) Right-click your server → Server Settings → Widget → Server ID"
        echo ""
        read -p "Press Enter after you've edited infra/.env.local, or Ctrl+C to exit..."
    else
        echo -e "${RED}❌ infra/.env.local.example not found!${NC}"
        exit 1
    fi
fi

echo ""

# Install dependencies
echo "📦 Installing dependencies..."
if bun install; then
    echo -e "${GREEN}✅ Dependencies installed${NC}"
else
    echo -e "${RED}❌ Failed to install dependencies${NC}"
    exit 1
fi

echo ""

# Check if DATABASE_URL is set before running migrations
echo "🗄️  Database setup..."

# Load environment variables
if [ -f "infra/.env.local" ]; then
    export $(cat infra/.env.local | grep -v '^#' | grep -v '^$' | xargs)
fi

if [ -z "$DATABASE_URL" ] || [ "$DATABASE_URL" = "postgresql://user:password@hostname.railway.app:5432/railway" ] || [ "$DATABASE_URL" = "postgresql://user:password@localhost:5432/llamabot" ]; then
    echo -e "${YELLOW}⚠️  DATABASE_URL not configured or still has example value${NC}"
    echo "   Skipping database migrations"
    echo "   Run 'npm run db:migrate' after configuring DATABASE_URL in infra/.env.local"
else
    echo "   Running database migrations..."
    if npm run db:migrate; then
        echo -e "${GREEN}✅ Database migrations completed${NC}"
    else
        echo -e "${YELLOW}⚠️  Database migrations failed${NC}"
        echo "   Make sure DATABASE_URL is correct in infra/.env.local"
        echo "   You can run migrations later with: npm run db:migrate"
    fi
fi

echo ""
echo "================================"
echo -e "${GREEN}🎉 Setup complete!${NC}"
echo ""
echo "Next steps:"
echo "  1. Make sure infra/.env.local has all required values"
echo "  2. Start development: ./start-dev.sh (or npm run dev)"
echo "  3. Check API health: http://localhost:3000/health"
echo "  4. Check Bot health: http://localhost:8080/health"
echo ""
echo "Need help? Check README.md for detailed instructions!"
