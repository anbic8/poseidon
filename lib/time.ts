import { z } from 'zod'

/** Datum als deutsches Kurzformat: "21.06.2026" */
export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('de-DE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

/**
 * Parst Zeiteingabe → Millisekunden.
 * Akzeptiert: "1:23,45" | "1:23.45" | "23,45" | "23.45" | "12345" (Stopwatch-Style)
 *
 * Stopwatch-Style (nur Ziffern): rechts nach links — letzte 2 = hh, nächste 2 = ss, Rest = mm
 * "12345" → mm=01 ss=23 hh=45 → 1:23,45
 */
export function parseTimeInput(input: string): number | null {
  const s = input.trim()

  // mm:ss,hh oder mm:ss.hh
  const full = s.match(/^(\d+):(\d{2})[,.](\d{2})$/)
  if (full) {
    const m = parseInt(full[1], 10)
    const sec = parseInt(full[2], 10)
    const hh = parseInt(full[3], 10)
    if (sec >= 60) return null
    return m * 60000 + sec * 1000 + hh * 10
  }

  // ss,hh oder ss.hh
  const short = s.match(/^(\d+)[,.](\d{2})$/)
  if (short) {
    const sec = parseInt(short[1], 10)
    const hh = parseInt(short[2], 10)
    return sec * 1000 + hh * 10
  }

  // Nur Ziffern (Stopwatch-Style)
  const digits = s.replace(/\D/g, '')
  if (digits.length >= 1 && digits.length <= 6 && digits === s) {
    const padded = digits.padStart(6, '0')
    const m = parseInt(padded.slice(0, 2), 10)
    const sec = parseInt(padded.slice(2, 4), 10)
    const hh = parseInt(padded.slice(4, 6), 10)
    if (sec >= 60) return null
    return m * 60000 + sec * 1000 + hh * 10
  }

  return null
}

/** Formatiert Millisekunden → "1:23,45" oder "23,45" */
export function formatTime(ms: number): string {
  const totalH = Math.round(ms / 10)
  const hh = totalH % 100
  const totalSec = Math.floor(totalH / 100)
  const sec = totalSec % 60
  const min = Math.floor(totalSec / 60)

  const hhStr = hh.toString().padStart(2, '0')
  const secStr = sec.toString().padStart(2, '0')

  return min > 0 ? `${min}:${secStr},${hhStr}` : `${sec},${hhStr}`
}

/** Zod-Schema für Zeiteingabe-Felder in Formularen */
export const timeInputSchema = z
  .string()
  .min(1, 'Zeitangabe erforderlich')
  .refine((v) => parseTimeInput(v) !== null, {
    message: 'Format: 1:23,45 oder 23,45',
  })
  .refine(
    (v) => {
      const ms = parseTimeInput(v)
      return ms !== null && ms > 0 && ms < 3600000 // max 60 min
    },
    { message: 'Zeit muss zwischen 0 und 60 Minuten liegen' }
  )
