import busboy from 'busboy'
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

  if (!req.body) throw new Error('Kein Request-Body')

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

    // Promise das aufgelöst wird sobald der WriteStream fertig ist
    let fileCompleteProm: Promise<void> = Promise.resolve()
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
      const relPath    = [String(year), targetId, storedName].join('/')

      let size = 0

      fileCompleteProm = new Promise<void>((res, rej) => {
        const ws = createWriteStream(filepath)
        file.on('data', (chunk: Buffer) => { size += chunk.length })
        file.pipe(ws)
        ws.on('finish', () => {
          fileData = { relPath, mimeType, sizeBytes: size, originalName: filename }
          res()
        })
        ws.on('error', rej)
      })
    })

    bb.on('error', (e) => {
      console.error('[upload] busboy error:', e)
      reject(e)
    })

    bb.on('finish', () => {
      // Warten bis WriteStream fertig ist (Race-Condition-Fix)
      fileCompleteProm
        .then(async () => {
          if (!fileData) throw new Error('Keine Datei empfangen')

          const type = fileData.mimeType.startsWith('video/')
            ? 'VIDEO' as const
            : 'PHOTO' as const

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

          resolve({ ...media, sizeBytes: media.sizeBytes.toString() })
        })
        .catch((e) => {
          console.error('[upload] finish handler error:', e)
          reject(e)
        })
    })

    // Async-Iteration ist in Next.js App Router zuverlässiger als Readable.fromWeb
    ;(async () => {
      try {
        for await (const chunk of req.body as unknown as AsyncIterable<Uint8Array>) {
          bb.write(chunk)
        }
        bb.end()
      } catch (e) {
        console.error('[upload] body read error:', e)
        bb.destroy()
        reject(e as Error)
      }
    })()
  })
}
