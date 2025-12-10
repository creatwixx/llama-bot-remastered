#!/bin/sh
# Startup script for Railway deployment
# Runs migrations and starts the server

echo "🚀 Starting API service..."
echo "Running database migrations..."

# Run migrations
bunx prisma migrate deploy

echo "✅ Migrations complete"
echo "Starting server..."

# Start the server
exec bun run start

