import { unlink } from 'fs/promises'
import path from 'path'

/** Löscht eine Mediendatei vom Dateisystem. Fehler werden ignoriert (Datei fehlt → kein Problem). */
export async function deleteMediaFile(filename: string): Promise<void> {
  const mediaDir = process.env.MEDIA_DIR ?? '/app/media'
  const filepath = path.join(mediaDir, ...filename.split('/'))
  try {
    await unlink(filepath)
  } catch {
    // Datei bereits gelöscht oder nicht vorhanden — DB-Eintrag trotzdem löschen
  }
}
