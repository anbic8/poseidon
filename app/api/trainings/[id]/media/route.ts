import { NextRequest, NextResponse } from 'next/server'
import { handleMediaUpload } from '@/lib/upload'

export const dynamic = 'force-dynamic'

type Params = { params: { id: string } }

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const media = await handleMediaUpload(req, { trainingEntryId: params.id })
    return NextResponse.json(media, { status: 201 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Upload fehlgeschlagen'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
