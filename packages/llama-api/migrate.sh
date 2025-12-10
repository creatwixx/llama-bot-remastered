#!/bin/bash
# Migration script that loads DATABASE_URL from env files

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Try to load from .env.local first (for dev), then .env (for prod)
if [ -f "../../infra/.env.local" ]; then
    echo "📋 Loading environment from infra/.env.local"
    export $(cat ../../infra/.env.local | grep -v '^#' | grep -v '^$' | xargs)
elif [ -f "../../infra/.env" ]; then
    echo "📋 Loading environment from infra/.env"
    export $(cat ../../infra/.env | grep -v '^#' | grep -v '^$' | xargs)
else
    echo "❌ Error: No .env.local or .env file found in infra/"
    echo "   Please create infra/.env.local or infra/.env with DATABASE_URL"
    exit 1
fi

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL is not set!"
    exit 1
fi

echo "✅ DATABASE_URL loaded"
echo "🚀 Running Prisma migrations..."

# Run the migration
bunx prisma migrate dev "$@"

