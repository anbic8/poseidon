#!/bin/sh
set -e

# ── ENV-Validierung ───────────────────────────────────────────────────────────
echo "==> Checking environment..."

if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL ist nicht gesetzt!"
  echo "       Bitte in docker-compose.yml oder .env konfigurieren."
  exit 1
fi

MEDIA_DIR="${MEDIA_DIR:-/app/media}"
if ! mkdir -p "$MEDIA_DIR" 2>/dev/null; then
  echo "ERROR: Media-Verzeichnis $MEDIA_DIR ist nicht beschreibbar!"
  exit 1
fi

echo "  DATABASE_URL: gesetzt"
echo "  MEDIA_DIR:    $MEDIA_DIR"
echo "  TZ:           ${TZ:-nicht gesetzt}"

# ── Datenbankschema synchronisieren ──────────────────────────────────────────
echo "==> Syncing database schema..."
npx prisma db push

# ── Stammdaten befüllen ───────────────────────────────────────────────────────
echo "==> Seeding database..."
npx prisma db seed

# ── Server starten ────────────────────────────────────────────────────────────
echo "==> Starting Next.js server..."
exec npm start
