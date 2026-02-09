#!/bin/sh
set -e

echo "Running Prisma migrations..."
cd /app/apps/api-server && npx prisma migrate deploy

echo "Starting API server..."
exec node /app/apps/api-server/dist/src/main.js
