#!/bin/sh
set -e
if [ "${RUN_MIGRATIONS_ON_STARTUP}" = "true" ] || [ "${RUN_MIGRATIONS_ON_STARTUP}" = "1" ]; then
  echo "Running database migrations (prisma migrate deploy)..."
  npx prisma migrate deploy
fi
exec node dist/server.js
