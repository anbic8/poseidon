# Buildplan: Schwimmtagebuch App

## Übersicht

**Stack:**
- **App:** Next.js 14 (App Router, TypeScript) — Frontend + Backend in einem Container
- **Datenbank:** PostgreSQL 16
- **ORM:** Prisma
- **Validation:** Zod (API-Eingaben und Formulare)
- **Styling:** Tailwind CSS + shadcn/ui
- **PWA:** serwist (next-pwa ist nicht mehr aktiv gepflegt)
- **File Storage:** Docker Named Volume, serviert via Next.js Streaming API
- **Deployment:** Proxmox VM → Docker Compose, Update via `git pull + docker-compose up --build`

**Warum Next.js statt getrenntem Frontend + Backend?**
Für eine Single-User-App reicht ein einziger Container für die Logik. Weniger bewegliche Teile, einfacheres Deployment, trotzdem vollständig erweiterbar.

---

## Zeitzonenstrategie

> Dieser Abschnitt ist kritisch, um subtile Datumsbugs zu vermeiden.

- **Datenbank:** Alle Timestamps in UTC (PostgreSQL-Standard)
- **Laufzeit:** `TZ=Europe/Berlin` als Docker-Umgebungsvariable gesetzt
- **Datumsfelder** (Wettkampfdatum, Trainingsdatum): `DateTime @db.Date` — nur Datum, keine Uhrzeit → kein Timezone-Problem beim Speichern
- **Saison-Grenzen:** Jahreswechsel 01.01.–31.12. wird serverseitig immer in `Europe/Berlin` berechnet
- **Frontend:** `date-fns-tz` für alle Datumsanzeigen mit expliziter Timezone `Europe/Berlin`

---

## Deployment-Strategie

```
Entwicklung (lokal) → git push → GitHub/Gitea
                                       ↓
                        VM: git pull + docker-compose up --build -d
                                       ↓
                        App-Container-Entrypoint: prisma migrate deploy → next start
```

**docker-compose.yml** auf der VM mit Services:
- `app` — Next.js (Build aus Dockerfile), startet erst wenn `db` healthy
- `db` — PostgreSQL mit HEALTHCHECK
- `adminer` — nur in dev-Compose (DB-Verwaltung im Browser)

**Kritisch:** Datenbankmigrationen laufen automatisch beim Container-Start über das Entrypoint-Script — kein manueller Schritt beim Deployment nötig.

`update.sh` auf der VM:
```bash
#!/bin/bash
git pull
docker-compose up --build -d
# Migrations laufen automatisch im Entrypoint des App-Containers
```

`docker-entrypoint.sh` (im Container):
```sh
#!/bin/sh
set -e
npx prisma migrate deploy
exec node server.js
```

---

## Datenmodell

```
EventType → definiert gültige Kombinationen (Disziplin + Distanz + Staffel)
            wird einmalig per Seed befüllt, nie durch den User angelegt

Competition → hat mehrere Events (je ein EventType + Zeit + optionale Staffelfelder)
            → hat Medien (Fotos) direkt am Wettkampf
Event       → hat Medien (Video direkt zum Lauf)
            → bei Staffel: eigene Teilzeit + Gesamtzeit + Position + eigene Lage (bei Lagen-Staffel)

TrainingEntry → EventType + Zeit + Bahntyp + Datum
             (kein Media-Upload, Trainingseinträge sind reine Zeiterfassung)
```

**Wichtig:** Kurzbahn- und Langbahnzeiten werden immer getrennt geführt — nicht vergleichbar.

---

## Phase 2 — Datenbankschema & Stammdaten (Seed)

> Dieses Schema hat gegenüber dem ursprünglichen Plan folgende kritische Änderungen:
> - `Discipline` + `Distance` zusammengeführt zu `EventType` (verhindert ungültige Kombinationen wie "800m Schmetterling")
> - `sizeBytes` als `BigInt` (Int würde bei Videos >2 GB überlaufen)
> - Staffel-Felder in `Event`
> - `@@index` für Performance-kritische Queries
> - `updatedAt` bei veränderbaren Modellen

### Prisma Schema

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Repräsentiert eine gültige Disziplin (Wettkampf oder Training).
// Wird einmalig per Seed befüllt, nicht durch den User editierbar.
model EventType {
  id           String   @id @default(cuid())
  displayName  String   // "100m Brust", "4x50m Freistil Staffel", "50m Rücken Beine (mit Brett)"
  stroke       Stroke
  distanceM    Int      // Distanz in Metern (bei Staffel: Distanz pro Schwimmer)
  isRelay      Boolean  @default(false)
  relayLegs    Int?     // 4 bei Staffeln, null bei Einzelstarts
  trainingOnly Boolean  @default(false) // true = nur im Training-Modul auswählbar, nie bei Wettkämpfen
  validKB      Boolean  @default(true)  // Gilt für Kurzbahn?
  validLB      Boolean  @default(true)  // Gilt für Langbahn?
  sortOrder    Int      @default(0)
  events       Event[]
  trainings    TrainingEntry[]

  @@unique([stroke, distanceM, isRelay])
}

model Competition {
  id        String   @id @default(cuid())
  name      String
  location  String?
  date      DateTime @db.Date
  poolType  PoolType
  notes     String?
  events    Event[]
  media     Media[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([date])
}

model Event {
  id            String      @id @default(cuid())
  competition   Competition @relation(fields: [competitionId], references: [id], onDelete: Cascade)
  competitionId String
  eventType     EventType   @relation(fields: [eventTypeId], references: [id])
  eventTypeId   String
  timeMs        Int         // Eigene Zeit in ms (bei Staffel: eigene Teilzeit)
  teamTimeMs    Int?        // Nur Staffel: Gesamtzeit des Teams in ms
  relayLeg      Int?        // Nur Staffel: eigene Position (1–4)
  relayStroke   Stroke?     // Nur Lagen-Staffel: persönlich geschwommene Lage
  heat          String?     // "Vorlauf", "Finale", "B-Finale", frei
  lane          Int?
  place         Int?        // Platzierung im Lauf
  notes         String?
  media         Media[]
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  @@index([competitionId])
  @@index([eventTypeId])
}

model TrainingEntry {
  id          String    @id @default(cuid())
  date        DateTime  @db.Date
  eventType   EventType @relation(fields: [eventTypeId], references: [id])
  eventTypeId String
  poolType    PoolType
  timeMs      Int
  notes       String?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([date])
  @@index([eventTypeId, poolType])
}

model Media {
  id            String      @id @default(cuid())
  type          MediaType
  filename      String      @unique  // UUID-basierter Dateiname auf dem Server
  originalName  String               // Ursprünglicher Dateiname des Users
  mimeType      String
  sizeBytes     BigInt               // BigInt! Int würde bei Videos >2,1 GB überlaufen
  competition   Competition? @relation(fields: [competitionId], references: [id], onDelete: Cascade)
  competitionId String?
  event         Event?       @relation(fields: [eventId], references: [id], onDelete: Cascade)
  eventId       String?
  createdAt     DateTime    @default(now())
  // App-Ebene sichert: competitionId XOR eventId gesetzt (nicht beides, nicht keins)

  @@index([competitionId])
  @@index([eventId])
}

enum PoolType {
  KURZBAHN
  LANGBAHN
}

enum Stroke {
  FREISTIL
  RUECKEN
  BRUST
  SCHMETTERLING
  LAGEN
  // Training-only Techniken (trainingOnly=true im EventType):
  RUECKEN_BEINE_OHNE_BRETT
  RUECKEN_BEINE_MIT_BRETT
  KRAUL_BEINE_MIT_BRETT
}

enum MediaType {
  PHOTO
  VIDEO
}
```

### Stammdaten-Seed: Wettkampf-Disziplinen (Standard DSV/FINA)

`trainingOnly = false` für alle Einträge in dieser Tabelle.

| displayName | stroke | distanceM | isRelay | validKB | validLB |
|---|---|---|---|---|---|
| 50m Freistil | FREISTIL | 50 | false | ✓ | ✓ |
| 100m Freistil | FREISTIL | 100 | false | ✓ | ✓ |
| 200m Freistil | FREISTIL | 200 | false | ✓ | ✓ |
| 400m Freistil | FREISTIL | 400 | false | ✓ | ✓ |
| 800m Freistil | FREISTIL | 800 | false | ✓ | ✓ |
| 1500m Freistil | FREISTIL | 1500 | false | ✓ | ✓ |
| 50m Rücken | RUECKEN | 50 | false | ✓ | ✓ |
| 100m Rücken | RUECKEN | 100 | false | ✓ | ✓ |
| 200m Rücken | RUECKEN | 200 | false | ✓ | ✓ |
| 50m Brust | BRUST | 50 | false | ✓ | ✓ |
| 100m Brust | BRUST | 100 | false | ✓ | ✓ |
| 200m Brust | BRUST | 200 | false | ✓ | ✓ |
| 50m Schmetterling | SCHMETTERLING | 50 | false | ✓ | ✓ |
| 100m Schmetterling | SCHMETTERLING | 100 | false | ✓ | ✓ |
| 200m Schmetterling | SCHMETTERLING | 200 | false | ✓ | ✓ |
| 100m Lagen | LAGEN | 100 | false | ✓ | ✗ |
| 200m Lagen | LAGEN | 200 | false | ✓ | ✓ |
| 400m Lagen | LAGEN | 400 | false | ✓ | ✓ |
| 4x50m Freistil Staffel | FREISTIL | 50 | true (4) | ✓ | ✗ |
| 4x100m Freistil Staffel | FREISTIL | 100 | true (4) | ✓ | ✓ |
| 4x200m Freistil Staffel | FREISTIL | 200 | true (4) | ✓ | ✓ |
| 4x50m Lagen Staffel | LAGEN | 50 | true (4) | ✓ | ✗ |
| 4x100m Lagen Staffel | LAGEN | 100 | true (4) | ✓ | ✓ |

### Stammdaten-Seed: Training-only Disziplinen

`trainingOnly = true`, `isRelay = false`, `validKB = ✓`, `validLB = ✓` für alle Einträge.
Diese erscheinen **nur** im Training-Modul, nie im Wettkampf-Event-Formular.

| displayName | stroke | distanceM |
|---|---|---|
| 25m Rücken Beine (ohne Brett) | RUECKEN_BEINE_OHNE_BRETT | 25 |
| 50m Rücken Beine (ohne Brett) | RUECKEN_BEINE_OHNE_BRETT | 50 |
| 100m Rücken Beine (ohne Brett) | RUECKEN_BEINE_OHNE_BRETT | 100 |
| 200m Rücken Beine (ohne Brett) | RUECKEN_BEINE_OHNE_BRETT | 200 |
| 25m Rücken Beine (mit Brett) | RUECKEN_BEINE_MIT_BRETT | 25 |
| 50m Rücken Beine (mit Brett) | RUECKEN_BEINE_MIT_BRETT | 50 |
| 100m Rücken Beine (mit Brett) | RUECKEN_BEINE_MIT_BRETT | 100 |
| 200m Rücken Beine (mit Brett) | RUECKEN_BEINE_MIT_BRETT | 200 |
| 25m Kraul Beine (mit Brett) | KRAUL_BEINE_MIT_BRETT | 25 |
| 50m Kraul Beine (mit Brett) | KRAUL_BEINE_MIT_BRETT | 50 |
| 100m Kraul Beine (mit Brett) | KRAUL_BEINE_MIT_BRETT | 100 |
| 200m Kraul Beine (mit Brett) | KRAUL_BEINE_MIT_BRETT | 200 |

> 25m ist hier bewusst aufgenommen — bei Beinschlag-Übungen in einem 25m-Becken ist eine Länge eine sinnvolle Einheit.

**Hinweis:** `validKB`/`validLB` steuert welche Optionen der Bahntyp-Filter anzeigt. `trainingOnly` steuert in welchem Kontext (Training vs. Wettkampf) eine Disziplin angeboten wird.

### Aufgaben Phase 2
- [ ] Prisma Schema wie oben anlegen
- [ ] Migration ausführen (`prisma migrate dev --name init`)
- [ ] Seed-Script mit allen Disziplinen aus obiger Tabelle
- [ ] Seed läuft idempotent (`upsert`, nicht `create`) — wichtig für Wiederholbarkeit

### Testkriterien Phase 2
- `prisma migrate dev` läuft ohne Fehler
- `prisma db seed` füllt alle 35 EventTypes korrekt (23 Wettkampf + 12 Training-only)
- Seed kann erneut ausgeführt werden ohne Fehler (idempotent)
- Tabellen in DB sichtbar via Adminer (`http://localhost:9000`)
- `trainingOnly=true` Disziplinen sind in der DB, aber nicht in Wettkampf-Dropdowns

---

## Phase 1 — Infrastruktur & Projekt-Setup

**Ziel:** App läuft lokal in Docker, Datenbank ist erreichbar, Health-Check funktioniert.

### docker-compose.yml (Entwicklung)

```yaml
services:
  app:
    build: .
    ports:
      - "4000:3000"
    environment:
      - DATABASE_URL=postgresql://swim:swim@db:5432/swimdb
      - TZ=Europe/Berlin
      - MEDIA_DIR=/app/media
      - MAX_PHOTO_SIZE_MB=20
      - MAX_VIDEO_SIZE_MB=2048
    volumes:
      - media_data:/app/media
    depends_on:
      db:
        condition: service_healthy  # Wartet bis DB wirklich bereit ist

  db:
    image: postgres:16-alpine
    environment:
      - POSTGRES_USER=swim
      - POSTGRES_PASSWORD=swim
      - POSTGRES_DB=swimdb
      - TZ=Europe/Berlin
    volumes:
      - pg_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U swim -d swimdb"]
      interval: 5s
      timeout: 5s
      retries: 10

  adminer:
    image: adminer:latest
    ports:
      - "9000:8080"
    depends_on:
      - db

volumes:
  pg_data:
  media_data:
```

> **Warum Named Volumes statt Bind-Mounts für Daten?**
> Named Volumes überleben `docker-compose down` ohne Datenverlust und brauchen kein vorher existierendes Verzeichnis auf dem Host. Für das media-Volume kann alternativ ein Bind-Mount in `docker-compose.prod.yml` verwendet werden, um den Backup-Pfad explizit zu kontrollieren.

### Dockerfile (Multi-Stage)

```dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh
ENTRYPOINT ["./docker-entrypoint.sh"]
```

> **Next.js Standalone Output** (`output: 'standalone'` in `next.config.ts`) erstellt ein minimales Production-Bundle ohne alle `node_modules` — deutlich kleineres Image.

### Aufgaben Phase 1
- [ ] Next.js 14 Projekt initialisieren (TypeScript, App Router, Tailwind)
- [ ] `next.config.ts`: `output: 'standalone'` setzen
- [ ] Prisma einrichten (nur Verbindungstest, Schema kommt in Phase 2)
- [ ] `Dockerfile` wie oben
- [ ] `docker-entrypoint.sh` mit `prisma migrate deploy && exec node server.js`
- [ ] `docker-compose.yml` (Dev, mit Adminer)
- [ ] `docker-compose.prod.yml` (ohne Adminer, mit Bind-Mount für Media-Backup)
- [ ] `.env.example` mit allen Variablen
- [ ] `update.sh` Deployment-Script
- [ ] Health-Check Route `GET /api/health` → `{ status: "ok", db: "ok" }`
- [ ] `.dockerignore` (node_modules, .next, .env)

### Testkriterien Phase 1
- `docker-compose up --build` startet ohne Fehler
- `http://localhost:4000/api/health` antwortet mit `{ status: "ok", db: "ok" }`
- Adminer unter `http://localhost:9000` erreichbar
- `docker-compose down && docker-compose up -d` — App startet wieder, keine Datenverluste

---

## Phase 3 — Training-Modul (CRUD)

**Ziel:** Trainingszeiten erfassen, anzeigen, bearbeiten, löschen.

### Hilfsfunktionen (Basis für das gesamte Projekt — zuerst implementieren)

```typescript
// lib/time.ts
// Parst "1:23,45" oder "23,45" oder "23.45" → Millisekunden
function parseTimeInput(input: string): number | null

// Formatiert Millisekunden → "1:23,45" (mit führender Minute wenn >= 60s)
function formatTime(ms: number): string

// Zod-Schema für Zeiteingabe (validiert Format und Plausibilität)
const timeInputSchema = z.string().refine(isValidTimeFormat, { message: "Format: mm:ss,hh" })
```

### Zeiteingabe-Komponente

Eine dedizierte `<TimeInput>`-Komponente die:
- `inputmode="decimal"` setzt (Numpad auf Mobile)
- Live-Validierung mit Zod
- Anzeige: `1:23,45` — Eingabe aber auch `12345` → auto-formatiert

### Backend (Next.js API Routes mit Zod-Validation)

- `GET /api/trainings?discipline=BRUST&poolType=KURZBAHN&year=2026` — gefilterte Liste
- `POST /api/trainings` — neue Trainingszeit (Zod: eventTypeId, poolType, timeMs, date, notes?)
- `GET /api/trainings/[id]`
- `PUT /api/trainings/[id]`
- `DELETE /api/trainings/[id]`

> Alle POST/PUT-Routen validieren den Body mit Zod und geben bei Fehler `400` mit strukturierter Fehlermeldung zurück.

### Frontend

- Seite `/training` — Liste aller Trainingszeiten (sortiert nach Datum, neueste zuerst)
- Schnellerfassung oben: kompaktes Formular mit Disziplin (gefiltert nach Bahntyp), Zeit, Datum
- Inline-Edit-Dialog für bestehende Einträge
- Filter: Disziplin, Bahntyp, Jahr

### Testkriterien Phase 3
- Trainingszeit kann angelegt werden
- Zeiteingabe `12345` wird zu `1:23,45` formatiert
- Liste zeigt alle Einträge mit korrektem Format
- Filter nach Disziplin + Bahntyp funktioniert
- Bearbeiten und Löschen funktioniert
- Ungültige Zeitwerte werden mit Fehlermeldung abgelehnt (Zod)
- Disziplin-Dropdown zeigt bei Kurzbahn andere Optionen als bei Langbahn (z.B. kein 4x50 bei Langbahn)
- Training-Dropdown zeigt alle 35 Disziplinen inkl. Beinschlag-Varianten
- Wettkampf-Dropdown zeigt nur die 23 Wettkampf-Disziplinen (`trainingOnly=false` Filter)

---

## Phase 4 — Wettkampf-Modul (CRUD)

**Ziel:** Wettkämpfe mit mehreren Disziplinen/Läufen erfassen, inkl. Staffeln.

### Backend

- `GET /api/competitions` — Liste aller Wettkämpfe (sortiert nach Datum desc)
- `POST /api/competitions` — Neuer Wettkampf (name, location?, date, poolType, notes?)
- `GET /api/competitions/[id]` — Wettkampf mit allen Events (eager load)
- `PUT /api/competitions/[id]`
- `DELETE /api/competitions/[id]` — Cascade löscht Events + Media (DB-Ebene)
- `POST /api/competitions/[id]/events` — Event hinzufügen
- `PUT /api/events/[id]`
- `DELETE /api/events/[id]`

### Frontend

- Seite `/competitions` — Karten-Liste, neueste zuerst, mit Datum + Ort + Event-Anzahl
- Seite `/competitions/[id]` — Detailansicht
  - Wettkampf-Header mit Name, Ort, Datum, Bahntyp
  - Event-Liste, gruppiert (Einzel- und Staffelstarts getrennt)
  - "+ Event hinzufügen" Button öffnet Dialog
- Event-Formular (Dialog):
  - Disziplin (gefiltert nach poolType des Wettkampfs)
  - Zeit (eigene Zeit, `<TimeInput>`)
  - Lauf (Vorlauf / Halbfinale / Finale / B-Finale / frei)
  - Bahn (optional)
  - Platzierung (optional)
  - **Bei Staffel zusätzlich:** Gesamtzeit des Teams, eigene Position (1–4), bei Lagen-Staffel: eigene Lage
  - Notizen

### Staffel-Logik im Formular

Wenn die gewählte Disziplin `isRelay=true` hat:
- Zusatzfelder einblenden: Gesamtzeit, Position (1–4)
- Wenn Disziplin = Lagen-Staffel: Dropdown "Eigene Lage" (Rücken/Brust/Schmetterling/Freistil)

### Testkriterien Phase 4
- Wettkampf anlegen, bearbeiten, löschen
- Einzelstart hinzufügen: Disziplin, Zeit, Lauf, Bahn, Platzierung
- Staffel hinzufügen: Teilzeit + Gesamtzeit + Position + (bei Lagen) eigene Lage
- Löschen eines Events löscht nicht den Wettkampf
- Disziplin-Dropdown zeigt nur für poolType gültige Disziplinen

---

## Phase 5 — Dashboard & Bestleistungen

**Ziel:** Übersichtsseite mit relevanten Statistiken und Bestzeiten.

### Berechnete Daten

- **Alltime-Bestzeit** pro EventType + PoolType, getrennt nach Wettkampf / Training
- **Saison-Bestzeit** (Kalender-Jahr, aktuell + wählbar per Dropdown)
- **Letzter/Nächster Wettkampf**
- **Letzte Aktivitäten** (5 neueste Einträge, Wettkampf + Training gemischt)
- **Anzahl Wettkämpfe** gesamt / aktuelle Saison

### Backend

```
GET /api/stats/bests?poolType=KURZBAHN&year=2026
  → { eventTypeId, displayName, bestCompMs, bestTrainMs, bestCompDate, bestTrainDate }[]

GET /api/stats/recent?limit=10
  → gemischte Liste aus Events + TrainingEntries, sortiert nach Datum

GET /api/competitions/upcoming
  → nächster Wettkampf (date >= heute)
```

> **Performance:** Die Bestzeiten-Query nutzt `MIN(timeMs)` mit `GROUP BY eventTypeId, poolType` — dafür sind die `@@index`-Felder im Schema entscheidend.

### Frontend

- Seite `/` (Dashboard)
- **Bestzeiten-Tabelle:**
  - Zeilen = Disziplin + Distanz (gruppiert nach Stroke)
  - Spalten = Kurzbahn / Langbahn
  - Jede Zelle: Wettkampfzeit (fett) + Trainingszeit (kleiner, grau)
  - Bestzeit markiert/hervorgehoben
- **Saison-Selector:** Jahr wählbar, Default = aktuelles Jahr
- **Letzte Aktivitäten-Karte**
- **Nächster Wettkampf-Karte**
- **Zeitverlauf-Chart** (Recharts): eine wählbare Disziplin, Punkte = Wettkampfzeiten über Zeit

### Testkriterien Phase 5
- Alltime-Bestzeiten sind korrekt (manuell prüfen gegen eingetragene Daten)
- Wettkampfzeit und Trainingszeit sind klar getrennt
- Kurzbahn / Langbahn sauber getrennt
- Saisonfiler zeigt nur Einträge des gewählten Jahres
- 100m Lagen erscheint nur in der KB-Spalte (kein LB-Wert)
- Dashboard lädt schnell (< 1s) — Index-Check

---

## Phase 6 — Medien-Upload (Fotos & Videos)

**Ziel:** Fotos und Videos zu Wettkämpfen und einzelnen Läufen hochladen und anzeigen.

### Kritisches Problem: Next.js Body-Limit

> Next.js API Routes haben ein Default-Body-Limit von **4,5 MB**. Für Videos brauchen wir eine andere Strategie.

**Lösung: Streaming-Upload mit `busboy`**

```typescript
// app/api/competitions/[id]/media/route.ts
export const config = { api: { bodyParser: false } }

// Request als ReadableStream mit busboy parsen
// Datei direkt auf Disk streamen ohne Memory-Buffering
// → auch 10 GB Videos funktionieren ohne Memory-Overflow
```

Für Fotos reicht ein normaler Multipart-Upload (< 20 MB). Nur für Videos wird Streaming benötigt.

### Storage

- Docker Named Volume: `media_data` → `/app/media` im Container
- Dateistruktur: `/app/media/{year}/{competitionId}/{uuid}.{ext}`
- Thumbnails für Fotos: via `sharp` (Node.js-native, kein System-Binary nötig)
  - Original: gespeichert wie hochgeladen
  - Thumbnail: `_thumb.webp` neben dem Original (400x300px, für Galerie-Ansicht)
- Videos: kein Thumbnail — Browser spielt nativ ab mit `preload="metadata"` (erstes Frame als Poster)

### Backend

```
POST /api/competitions/[id]/media  → Foto/Video zu Wettkampf
POST /api/events/[id]/media        → Video zu einem Lauf
GET  /api/media/[...path]          → Datei ausliefern mit HTTP Range (für Video-Seeking)
DELETE /api/media/[id]             → Datei auf Disk + DB-Eintrag
```

> **Range-Support** ist wichtig: ohne ihn können Browser im Video nicht vorspulen (kein HTTP 206 Partial Content → Safari/Chrome brechen Video-Playback ab).

### Frontend

- Upload-Zone (Drag & Drop + Datei-Browser, `react-dropzone`)
- Fortschrittsanzeige bei Upload (via `XMLHttpRequest` mit Progress-Event, nicht `fetch` — `fetch` hat keinen Upload-Progress)
- Foto-Galerie (Grid, Lightbox bei Klick)
- Video-Player direkt unter dem zugehörigen Event (nativer `<video>` Tag mit Controls)
- Fotos: Thumbnail in Galerie, Vollbild bei Klick
- Upload von Kamera direkt auf Mobile: `<input accept="image/*,video/*" capture>`

### Testkriterien Phase 6
- Foto hochladen → erscheint in Galerie (als Thumbnail)
- Video hochladen (>500 MB) → kein Memory-Fehler, Fortschrittsbalken
- Video im Browser abspielen, Seeking (vorspulen) funktioniert
- Video ist dem richtigen Event zugeordnet
- Löschen entfernt Datei vom Filesystem und DB-Eintrag (prüfen!)
- Kamera-Capture auf Mobile funktioniert (Android Chrome)

---

## Phase 7 — PWA & Mobile Optimierung

**Ziel:** App auf dem Handy installierbar, responsives Layout auf kleinen Screens.

### PWA mit serwist

> `next-pwa` wird seit 2022 nicht mehr aktiv gepflegt. `serwist` ist der empfohlene Nachfolger (aktiv maintained, gleiche API).

```
npm install @serwist/next serwist
```

- `manifest.json` / `app/manifest.ts`: Name, Icons (192px, 512px, maskable), Theme-Color
- Service Worker (via serwist): App-Shell caching
- Offline-Fallback-Seite: `"Keine Verbindung — bitte WLAN prüfen"`
- Media-Dateien werden **nicht** gecached (zu groß)

### Responsive Design

- Mobile-first Navigation: Bottom-Nav mit 4 Punkten (Dashboard, Training, Wettkämpfe, +)
- `<TimeInput>`: `inputmode="decimal"` → Zahlen-Tastatur auf Mobile
- Foto-Upload direkt von Kamera (via `capture`-Attribut)
- Touch-freundliche Formulare: min. 44px Touch-Targets (shadcn/ui erfüllt das von Haus aus)

### Testkriterien Phase 7
- Chrome auf Android zeigt "App installieren" Banner
- App als PWA auf Homescreen installierbar und startbar
- Offline: Fallback-Seite erscheint statt Fehler
- Formulare auf 375px Breite (iPhone SE) ohne horizontales Scrollen
- Zeiteingabe öffnet Numpad auf Mobile

---

## Phase 8 — Produktionsreife & Backup

**Ziel:** Stabile, wartbare Produktionsumgebung mit Backup-Strategie.

### docker-compose.prod.yml Ergänzungen

```yaml
services:
  app:
    restart: unless-stopped
    # Kein Adminer
    volumes:
      - /data/swim/media:/app/media  # Bind-Mount für einfaches Backup
  db:
    restart: unless-stopped
    volumes:
      - /data/swim/postgres:/var/lib/postgresql/data
```

### Backup-Script (`backup.sh` auf der VM)

```bash
#!/bin/bash
BACKUP_DIR="/data/backups/swim/$(date +%Y-%m-%d)"
mkdir -p "$BACKUP_DIR"
docker exec swim-db pg_dump -U swim swimdb | gzip > "$BACKUP_DIR/db.sql.gz"
rsync -a /data/swim/media/ "$BACKUP_DIR/media/"
find /data/backups/swim -maxdepth 1 -mtime +30 -exec rm -rf {} \;  # 30 Tage behalten
```

Cron auf der VM: `0 3 * * * /opt/swim/backup.sh >> /var/log/swim-backup.log 2>&1`

### Aufgaben Phase 8
- [ ] `docker-compose.prod.yml` mit Bind-Mounts + restart policies
- [ ] `backup.sh` + Cron auf VM einrichten
- [ ] Restore-Prozedur dokumentieren und einmal testen
- [ ] `.env` Validierung beim App-Start (fehlende Pflicht-Variablen → sofortiger Fehler mit klarer Meldung)
- [ ] `README.md` mit Deployment- und Restore-Anleitung
- [ ] Nginx optional vorschalten (für Custom-Domain via DynDNS, SSL via Let's Encrypt)

### Testkriterien Phase 8
- `docker-compose down && docker-compose up -d` → App startet, Daten erhalten
- VM-Neustart → App startet automatisch (restart: unless-stopped)
- Backup-Script erzeugt valide Datei (Restore einmal testen!)
- App startet mit fehlendem `DATABASE_URL` mit klarer Fehlermeldung statt kryptischem Crash

---

## Technische Entscheidungen

| Entscheidung | Gewählt | Warum |
|---|---|---|
| Full-Stack Framework | Next.js 14 | Ein Container, kein getrenntes API-Backend nötig |
| Datenbank | PostgreSQL 16 | Robuster für relationale Daten, `MIN()` Aggregat für Bestzeiten |
| ORM | Prisma | Typsicher, Migration-System, gute Next.js-Integration |
| Validation | Zod | Gleiche Schemas für API-Body und Frontend-Formulare nutzbar |
| Styling | Tailwind + shadcn/ui | Mobile-first, konsistent, kein Custom-CSS nötig |
| PWA | serwist | next-pwa seit 2022 nicht mehr gepflegt, serwist ist aktiver Fork |
| Video-Streaming | busboy (Streaming) + Range API | Next.js Body-Limit umgehen, Seeking im Browser |
| Deployment | git pull + docker-compose | Einfachste wartbare Lösung für Single-User lokal |
| Zeit-Einheit intern | Millisekunden (Int) | Exakte Vergleiche, kein Float-Problem |
| Dateigrößen | BigInt | Int (32-bit) läuft bei >2,1 GB über |
| Disziplinen/Distanzen | EventType-Tabelle | Verhindert ungültige Kombinationen (z.B. 800m Schmetterling) |
| Daten mit Timezone | `@db.Date` + `TZ=Europe/Berlin` | Saison-Grenzen korrekt, kein UTC-Offset-Bug |
| Foto-Thumbnails | sharp (Node.js) | Kein ffmpeg oder System-Binary nötig |

---

## Behobene Schwächen gegenüber dem ursprünglichen Plan

| # | Problem | Behebung |
|---|---|---|
| 1 | `sizeBytes Int` läuft bei Videos >2,1 GB über | `BigInt` |
| 2 | Next.js 4,5 MB Body-Limit für Videos nicht adressiert | busboy Streaming-Upload |
| 3 | Staffeln fehlten komplett | `isRelay`, `relayLeg`, `relayStroke`, `teamTimeMs` in `Event` |
| 4 | Ungültige Disziplin/Distanz-Kombinationen möglich | `EventType`-Tabelle ersetzt `Discipline` + `Distance` |
| 5 | DB-Startup-Race-Condition (App startet vor DB) | `depends_on` mit `condition: service_healthy` |
| 6 | `prisma migrate deploy` fehlte im Deployment | Docker-Entrypoint führt Migration automatisch aus |
| 7 | `next-pwa` nicht mehr gepflegt | Ersetzt durch `serwist` |
| 8 | Keine API-Validierung | Zod in allen POST/PUT-Routen |
| 9 | Zeitzonenstrategie nicht definiert | Eigener Abschnitt: UTC in DB, Europe/Berlin in App |
| 10 | Keine DB-Indizes | `@@index` für alle Query-kritischen Felder |
| 11 | Vollständige Disziplinliste fehlte | Alle 23 DSV-Standard-Disziplinen tabellarisch |
| 12 | Kein Adminer für Entwicklung | Adminer-Service in `docker-compose.yml` (Dev) |
| 13 | Kein `updatedAt` in veränderbaren Models | Hinzugefügt |
| 14 | `Media` ohne Constraint: weder noch beide FK gesetzt | App-Layer Validation + Kommentar im Schema |
| 15 | Foto-Thumbnails nicht bedacht | `sharp` generiert `_thumb.webp` neben Original |
| 16 | Trainings-spezifische Techniken fehlten | `trainingOnly`-Flag + 3 neue Stroke-Enum-Werte + 12 neue EventTypes |
| 17 | Ports 3000/8080 belegt | App auf 4000:3000, Adminer auf 9000:8080 |
