# Poseidon – Schwimmtagebuch

Schwimmtagebuch für Wettkämpfe und Training. Läuft als Docker-App im Heimnetz.

---

## Voraussetzungen

- Docker + Docker Compose (auf der VM)
- Git (auf der VM)
- Proxmox-VM mit Ubuntu/Debian

---

## Ersteinrichtung (einmalig auf der VM)

```bash
# Docker installieren
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
# Danach neu einloggen!

# Repo klonen
sudo mkdir -p /opt/poseidon
sudo chown $USER:$USER /opt/poseidon
git clone git@github.com:anbic8/poseidon.git /opt/poseidon
cd /opt/poseidon

# Datenverzeichnisse anlegen (nur für docker-compose.prod.yml)
sudo mkdir -p /data/swim/media /data/swim/postgres
sudo chown -R $USER:$USER /data/swim

# Starten
docker compose up --build -d
```

App läuft auf: `http://<VM-IP>:4000`
Adminer (DB): `http://<VM-IP>:9000`

---

## Update deployen

```bash
cd /opt/poseidon
bash update.sh
```

Das Script macht: `git pull` → `docker compose up --build -d`

Datenbankschema und Seed laufen automatisch beim Container-Start.

---

## Backup einrichten

```bash
# Backup-Script testen
bash /opt/poseidon/backup.sh

# Cron einrichten (täglich 3:00 Uhr)
crontab -e
# Folgendes einfügen:
0 3 * * * /opt/poseidon/backup.sh >> /var/log/poseidon-backup.log 2>&1
```

Backups landen in: `/data/backups/poseidon/YYYY-MM-DD/`
- `db.sql.gz` — PostgreSQL Dump
- `media/` — alle hochgeladenen Fotos und Videos

Alte Backups (> 30 Tage) werden automatisch gelöscht.

---

## Restore

```bash
# Verfügbare Backups anzeigen
bash /opt/poseidon/restore.sh

# Bestimmtes Backup wiederherstellen
bash /opt/poseidon/restore.sh 2026-06-21
```

---

## Ports

| Service | Host-Port | Beschreibung |
|---|---|---|
| App (Next.js) | **4000** | Poseidon Web-App |
| Adminer (DB) | **9000** | Datenbank-Verwaltung |

Ports können in `docker-compose.yml` geändert werden.

---

## Health Check

```bash
curl http://localhost:4000/api/health
# → {"status":"ok","db":"ok","dbLatency":"3ms","timestamp":"..."}
```

---

## Troubleshooting

**App startet nicht:**
```bash
docker compose logs app --tail=50
```

**Datenbank nicht erreichbar:**
```bash
docker compose ps        # Status aller Container
docker compose restart db
```

**Upload schlägt fehl:**
```bash
docker compose logs app --tail=20   # Fehlermeldung mit [upload]-Prefix
ls /data/swim/media                 # Prüfen ob Media-Verzeichnis beschreibbar ist
```

**Alles neu starten:**
```bash
docker compose down && docker compose up -d
```

**Container-Logs live beobachten:**
```bash
docker compose logs -f app
```

---

## Umgebungsvariablen

Alle in `docker-compose.yml` konfiguriert:

| Variable | Standard | Beschreibung |
|---|---|---|
| `DATABASE_URL` | — | PostgreSQL Verbindungs-URL (Pflicht) |
| `TZ` | `Europe/Berlin` | Zeitzone |
| `MEDIA_DIR` | `/app/media` | Pfad für Fotos/Videos im Container |
| `MAX_PHOTO_SIZE_MB` | `20` | Max. Foto-Größe |
| `MAX_VIDEO_SIZE_MB` | `2048` | Max. Video-Größe (2 GB) |
