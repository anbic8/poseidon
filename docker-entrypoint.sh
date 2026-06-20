#!/bin/sh
set -e

# Datenbankmigrationen werden ab Phase 2 aktiviert (sobald Schema + Models definiert sind)
# echo "==> Running database migrations..."
# npx prisma migrate deploy

echo "==> Starting Next.js server..."
exec npm start
