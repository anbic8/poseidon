import { ImageResponse } from 'next/og'
import { readFileSync } from 'fs'
import { join } from 'path'

export const size        = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  let logoSrc = ''
  try {
    const buf = readFileSync(join(process.cwd(), 'public', 'poseidon.png'))
    logoSrc = `data:image/png;base64,${buf.toString('base64')}`
  } catch { /* fallback */ }

  if (!logoSrc) {
    return new ImageResponse(
      <div style={{ background: '#2563eb', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '22%', fontSize: 110 }}>
        🌊
      </div>,
      { ...size }
    )
  }

  return new ImageResponse(
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={logoSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
    </div>,
    { ...size }
  )
}
