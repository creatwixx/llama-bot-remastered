#!/bin/bash
# Migration script that loads DATABASE_URL from env files or environment

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Check if DATABASE_URL is already set (e.g., Railway, Docker, or manually exported)
if [ -z "$DATABASE_URL" ]; then
    echo "📋 DATABASE_URL not found in environment, checking for .env files..."
    
    # Try to load from .env.local first (for dev), then .env (for prod)
    if [ -f "../../infra/.env.local" ]; then
        echo "📋 Loading environment from infra/.env.local"
        export $(cat ../../infra/.env.local | grep -v '^#' | grep -v '^$' | xargs)
    elif [ -f "../../infra/.env" ]; then
        echo "📋 Loading environment from infra/.env"
        export $(cat ../../infra/.env | grep -v '^#' | grep -v '^$' | xargs)
    else
        echo "❌ Error: DATABASE_URL is not set and no .env files found!"
        echo ""
        echo "   Options:"
        echo "   1. Set DATABASE_URL environment variable:"
        echo "      export DATABASE_URL='postgresql://...'"
        echo ""
        echo "   2. Create infra/.env.local or infra/.env with:"
        echo "      DATABASE_URL='postgresql://...'"
        echo ""
        echo "   3. For Railway/production, DATABASE_URL should be set automatically"
        exit 1
    fi
else
    echo "✅ DATABASE_URL found in environment"
fi

# Check if DATABASE_URL is set after loading
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL is still not set after loading .env files!"
    echo "   Please ensure DATABASE_URL is set in your .env file or environment"
    exit 1
fi

echo "✅ DATABASE_URL loaded"
echo "🚀 Running Prisma migrations..."

# If first argument is "deploy", use migrate deploy, otherwise use migrate dev
if [ "$1" = "deploy" ]; then
    shift  # Remove "deploy" from arguments
    bunx prisma migrate deploy "$@"
else
    bunx prisma migrate dev "$@"
fi

