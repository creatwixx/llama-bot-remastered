#!/bin/bash
# Run migrations inside Docker container
# Usage: ./migrate-docker.sh [migration-name]

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR/../.."

echo "🐳 Running Prisma migrations inside Docker container..."

docker compose -f infra/docker-compose.yml exec api bunx prisma migrate dev "$@"

