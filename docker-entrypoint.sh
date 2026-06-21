#!/bin/sh
set -e

echo "==> Syncing database schema..."
npx prisma db push

echo "==> Seeding database..."
npx prisma db seed

echo "==> Starting Next.js server..."
exec npm start
