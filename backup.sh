#!/bin/bash
# Poseidon — Backup Script
# Sichert Datenbank und Medien-Dateien.
# Cron-Empfehlung: täglich um 3:00 Uhr
#   0 3 * * * /opt/poseidon/backup.sh >> /var/log/poseidon-backup.log 2>&1

set -e

BACKUP_ROOT="/data/backups/poseidon"
DATE=$(date +%Y-%m-%d)
BACKUP_DIR="$BACKUP_ROOT/$DATE"
COMPOSE_DIR="/opt/poseidon"
MEDIA_DIR="/data/swim/media"

echo "==> Poseidon Backup — $DATE"

# Backup-Verzeichnis anlegen
mkdir -p "$BACKUP_DIR"

# Datenbank sichern
echo "==> Datenbank-Backup..."
docker exec poseidon-db-1 pg_dump -U swim swimdb | gzip > "$BACKUP_DIR/db.sql.gz"
echo "    Gespeichert: $BACKUP_DIR/db.sql.gz ($(du -sh "$BACKUP_DIR/db.sql.gz" | cut -f1))"

# Medien sichern (falls Verzeichnis existiert)
if [ -d "$MEDIA_DIR" ]; then
  echo "==> Medien-Backup..."
  rsync -a --delete "$MEDIA_DIR/" "$BACKUP_DIR/media/"
  echo "    Gespeichert: $BACKUP_DIR/media/ ($(du -sh "$BACKUP_DIR/media/" | cut -f1))"
else
  echo "    Medien-Verzeichnis $MEDIA_DIR nicht gefunden — übersprungen."
fi

# Backups älter als 30 Tage löschen
echo "==> Alte Backups aufräumen (älter als 30 Tage)..."
find "$BACKUP_ROOT" -maxdepth 1 -type d -mtime +30 -exec rm -rf {} \; 2>/dev/null || true

echo "==> Backup abgeschlossen: $BACKUP_DIR"
echo ""
