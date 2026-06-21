import busboy from 'busboy'
import { Readable } from 'stream'
import { createWriteStream, mkdirSync } from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'
import { NextRequest } from 'next/server'
import { db } from './db'

type UploadTarget =
  | { competitionId: string; eventId?: undefined }
  | { eventId: string; competitionId?: undefined }

export async function handleMediaUpload(req: NextRequest, target: UploadTarget) {
  const contentType = req.headers.get('content-type') ?? ''

  const mediaDir = process.env.MEDIA_DIR ?? '/app/media'
  const year     = new Date().getFullYear()
  const targetId = target.competitionId ?? target.eventId ?? 'misc'
  const dir      = path.join(mediaDir, String(year), targetId)
  mkdirSync(dir, { recursive: true })

  const maxBytes =
    parseInt(process.env.MAX_VIDEO_SIZE_MB ?? '2048', 10) * 1024 * 1024

  return new Promise<object>((resolve, reject) => {
    const bb = busboy({
      headers: { 'content-type': contentType },
      limits:  { files: 1, fileSize: maxBytes },
    })

    let fileData: {
      relPath:      string
      mimeType:     string
      sizeBytes:    number
      originalName: string
    } | null = null

    bb.on('file', (field, file, info) => {
      const { filename, mimeType } = info
      const ext        = path.extname(filename) || ''
      const storedName = `${randomUUID()}${ext}`
      const filepath   = path.join(dir, storedName)
      // relPath uses forward slashes (stored in DB, used in API URL)
      const relPath    = [String(year), targetId, storedName].join('/')

      let size = 0
      const ws = createWriteStream(filepath)
      file.on('data', (chunk: Buffer) => { size += chunk.length })
      file.pipe(ws)
      ws.on('finish', () => {
        fileData = { relPath, mimeType, sizeBytes: size, originalName: filename }
      })
      ws.on('error', reject)
    })

    bb.on('error', reject)

    bb.on('finish', async () => {
      if (!fileData) { reject(new Error('Keine Datei empfangen')); return }

      const type = fileData.mimeType.startsWith('video/') ? 'VIDEO' as const : 'PHOTO' as const

      const media = await db.media.create({
        data: {
          type,
          filename:      fileData.relPath,
          originalName:  fileData.originalName,
          mimeType:      fileData.mimeType,
          sizeBytes:     BigInt(fileData.sizeBytes),
          competitionId: target.competitionId ?? null,
          eventId:       target.eventId       ?? null,
        },
      })

      // BigInt → string für JSON-Serialisierung
      resolve({ ...media, sizeBytes: media.sizeBytes.toString() })
    })

    // Web ReadableStream (Next.js App Router) → Node.js Readable → busboy
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nodeStream = Readable.fromWeb(req.body as any)
    nodeStream.pipe(bb)
  })
}

/** Serialisiert ein Media-Objekt aus Prisma (BigInt → string) */
export function serializeMedia(m: { sizeBytes: bigint; [k: string]: unknown }) {
  return { ...m, sizeBytes: m.sizeBytes.toString() }
}
