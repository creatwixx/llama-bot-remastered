#!/bin/sh
# Applies any pending Prisma migrations, then hands off to the API server.
#
# This exists because the ZimaOS deployment has no repo checked out on the box —
# there is nowhere to run migrate.sh from. The API image migrates itself on boot.
# `migrate deploy` is the production-safe command: it only applies committed
# migrations and never prompts or resets.
set -e

if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL is not set — cannot migrate or start." >&2
  exit 1
fi

if [ "${SKIP_MIGRATIONS:-false}" = "true" ]; then
  echo "⏭️  SKIP_MIGRATIONS=true — not applying migrations."
else
  echo "🗄️  Applying database migrations..."
  bunx prisma migrate deploy
  echo "✅ Migrations up to date."
fi

echo "🚀 Starting API..."
exec "$@"
