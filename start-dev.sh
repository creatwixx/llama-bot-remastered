#!/bin/bash
# Start development environment with dev bot
# This script sources .env.local and starts Docker Compose

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo "🚀 Starting development environment..."

# Source .env.local to load dev bot credentials
if [ -f "infra/.env.local" ]; then
    echo "📋 Loading dev bot credentials from infra/.env.local"
    export $(cat infra/.env.local | grep -v '^#' | grep -v '^$' | xargs)
    echo "✅ Loaded environment variables"
else
    echo "❌ Error: infra/.env.local not found!"
    echo "   Create it from infra/.env.local.example"
    exit 1
fi

# Start Docker Compose with dev override
echo "🐳 Starting Docker Compose..."
docker compose -f infra/docker-compose.yml -f infra/docker-compose.dev.yml up "$@"

