import { NextRequest } from 'next/server'
import { createReadStream, statSync } from 'fs'
import { Readable } from 'stream'
import path from 'path'

export const dynamic = 'force-dynamic'

const MIME_TYPES: Record<string, string> = {
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png':  'image/png',
  '.gif':  'image/gif',
  '.webp': 'image/webp',
  '.mp4':  'video/mp4',
  '.mov':  'video/quicktime',
  '.avi':  'video/x-msvideo',
  '.mkv':  'video/x-matroska',
  '.webm': 'video/webm',
}

type Params = { params: { path: string[] } }

export async function GET(req: NextRequest, { params }: Params) {
  const mediaDir    = path.resolve(process.env.MEDIA_DIR ?? '/app/media')
  const requestedPath = path.resolve(path.join(mediaDir, ...params.path))

  // Path-Traversal-Schutz
  if (!requestedPath.startsWith(mediaDir + path.sep)) {
    return new Response('Forbidden', { status: 403 })
  }

  let stat
  try {
    stat = statSync(requestedPath)
  } catch {
    return new Response('Not Found', { status: 404 })
  }

  const mimeType = MIME_TYPES[path.extname(requestedPath).toLowerCase()] ?? 'application/octet-stream'
  const rangeHeader = req.headers.get('range')

  if (rangeHeader) {
    const [startStr, endStr] = rangeHeader.replace(/bytes=/, '').split('-')
    const start = parseInt(startStr, 10)
    const end   = endStr ? parseInt(endStr, 10) : stat.size - 1
    const chunkSize = end - start + 1

    const webStream = Readable.toWeb(createReadStream(requestedPath, { start, end })) as ReadableStream

    return new Response(webStream, {
      status: 206,
      headers: {
        'Content-Range':  `bytes ${start}-${end}/${stat.size}`,
        'Accept-Ranges':  'bytes',
        'Content-Length': String(chunkSize),
        'Content-Type':   mimeType,
        'Cache-Control':  'public, max-age=3600',
      },
    })
  }

  const webStream = Readable.toWeb(createReadStream(requestedPath)) as ReadableStream

  return new Response(webStream, {
    headers: {
      'Content-Type':   mimeType,
      'Content-Length': String(stat.size),
      'Accept-Ranges':  'bytes',
      'Cache-Control':  'public, max-age=3600',
    },
  })
}
