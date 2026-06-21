#!/bin/bash
# Poseidon — Restore Script
# Stellt Datenbank und Medien aus einem Backup wieder her.
#
# Verwendung:
#   bash restore.sh 2026-06-21
#
# ACHTUNG: Überschreibt alle aktuellen Daten!

set -e

DATE="${1:-}"
BACKUP_ROOT="/data/backups/poseidon"
MEDIA_DIR="/data/swim/media"

if [ -z "$DATE" ]; then
  echo "Verfügbare Backups:"
  ls -1 "$BACKUP_ROOT" 2>/dev/null | sort -r || echo "  (keine gefunden)"
  echo ""
  echo "Verwendung: bash restore.sh YYYY-MM-DD"
  exit 1
fi

BACKUP_DIR="$BACKUP_ROOT/$DATE"

if [ ! -d "$BACKUP_DIR" ]; then
  echo "ERROR: Kein Backup für $DATE gefunden in $BACKUP_DIR"
  exit 1
fi

echo "==> Poseidon Restore — $DATE"
echo "    ACHTUNG: Alle aktuellen Daten werden überschrieben!"
read -r -p "    Fortfahren? [j/N] " confirm
if [ "$confirm" != "j" ] && [ "$confirm" != "J" ]; then
  echo "    Abgebrochen."
  exit 0
fi

# Datenbank wiederherstellen
if [ -f "$BACKUP_DIR/db.sql.gz" ]; then
  echo "==> Datenbank wiederherstellen..."
  docker exec -i poseidon-db-1 psql -U swim -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;" swimdb
  gunzip -c "$BACKUP_DIR/db.sql.gz" | docker exec -i poseidon-db-1 psql -U swim swimdb
  echo "    Datenbank wiederhergestellt."
else
  echo "    Kein Datenbank-Backup gefunden — übersprungen."
fi

# Medien wiederherstellen
if [ -d "$BACKUP_DIR/media" ]; then
  echo "==> Medien wiederherstellen..."
  rsync -a --delete "$BACKUP_DIR/media/" "$MEDIA_DIR/"
  echo "    Medien wiederhergestellt."
else
  echo "    Kein Medien-Backup gefunden — übersprungen."
fi

echo "==> Restore abgeschlossen."
echo "    App-Container neu starten: docker compose -f /opt/poseidon/docker-compose.prod.yml restart app"
