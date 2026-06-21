'use client'

import { useState, useEffect } from 'react'
import { parseTimeInput, formatTime } from '@/lib/time'

interface TimeInputProps {
  value: string
  onChange: (value: string) => void
  error?: string
  placeholder?: string
  className?: string
}

export function TimeInput({
  value,
  onChange,
  error,
  placeholder = 'z.B. 1:23,45',
  className = '',
}: TimeInputProps) {
  const [raw, setRaw] = useState(value)

  useEffect(() => {
    setRaw(value)
  }, [value])

  const handleBlur = () => {
    // Nur-Ziffern-Eingabe auto-formatieren
    const digitsOnly = raw.replace(/\D/g, '')
    if (digitsOnly === raw && digitsOnly.length > 0) {
      const ms = parseTimeInput(raw)
      if (ms !== null) {
        const formatted = formatTime(ms)
        setRaw(formatted)
        onChange(formatted)
        return
      }
    }
    onChange(raw)
  }

  return (
    <div className={className}>
      <input
        type="text"
        inputMode="decimal"
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={`w-full rounded-md border px-3 py-2 text-sm font-mono
          ${error ? 'border-red-400 focus:ring-red-400' : 'border-gray-300 focus:ring-blue-500'}
          focus:outline-none focus:ring-2`}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}
