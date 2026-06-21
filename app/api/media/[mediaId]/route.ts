import { NextRequest, NextResponse } from 'next/server'
import { unlink } from 'fs/promises'
import path from 'path'
import { db } from '@/lib/db'

type Params = { params: { mediaId: string } }

export async function DELETE(_req: NextRequest, { params }: Params) {
  const media = await db.media.findUnique({ where: { id: params.mediaId } })
  if (!media) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })

  // Datei vom Dateisystem löschen (Fehler ignorieren falls Datei fehlt)
  const mediaDir  = process.env.MEDIA_DIR ?? '/app/media'
  const filepath  = path.join(mediaDir, ...media.filename.split('/'))
  try {
    await unlink(filepath)
  } catch {
    // Datei bereits gelöscht oder nicht vorhanden — DB-Eintrag trotzdem löschen
  }

  await db.media.delete({ where: { id: params.mediaId } })
  return new NextResponse(null, { status: 204 })
}
