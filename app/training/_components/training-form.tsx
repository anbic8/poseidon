'use client'

import { useState, useEffect } from 'react'
import { TimeInput } from '@/components/time-input'
import { formatTime } from '@/lib/time'
import type { EventType, PoolType, TrainingEntry } from '@/lib/types'

interface TrainingFormProps {
  entry?: TrainingEntry | null
  onSave: (data: FormData) => Promise<void>
  onCancel: () => void
}

export type FormData = {
  eventTypeId: string
  poolType: PoolType
  timeInput: string
  date: string
  notes: string
}

function today() {
  return new Date().toISOString().split('T')[0]
}

export function TrainingForm({ entry, onSave, onCancel }: TrainingFormProps) {
  const isEdit = !!entry

  const [poolType, setPoolType]       = useState<PoolType>(entry?.poolType ?? 'KURZBAHN')
  const [eventTypeId, setEventTypeId] = useState(entry?.eventTypeId ?? '')
  const [timeInput, setTimeInput]     = useState(entry ? formatTime(entry.timeMs) : '')
  const [date, setDate]               = useState(entry ? entry.date.split('T')[0] : today())
  const [notes, setNotes]             = useState(entry?.notes ?? '')
  const [eventTypes, setEventTypes]   = useState<EventType[]>([])
  const [timeError, setTimeError]     = useState('')
  const [saving, setSaving]           = useState(false)
  const [error, setError]             = useState('')

  useEffect(() => {
    fetch(`/api/event-types?poolType=${poolType}`)
      .then((r) => r.json())
      .then((data: EventType[]) => {
        setEventTypes(data)
        // Disziplin zurücksetzen wenn sie für den neuen Bahntyp ungültig ist
        if (eventTypeId && !data.find((e) => e.id === eventTypeId)) {
          setEventTypeId('')
        }
      })
  }, [poolType])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setTimeError('')
    setError('')

    if (!eventTypeId) { setError('Bitte Disziplin auswählen.'); return }
    if (!timeInput)   { setTimeError('Zeitangabe erforderlich'); return }

    setSaving(true)
    try {
      await onSave({ eventTypeId, poolType, timeInput, date, notes })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Fehler beim Speichern'
      setError(msg)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="font-semibold text-gray-800">
        {isEdit ? 'Eintrag bearbeiten' : 'Neue Trainingszeit'}
      </h3>

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Datum */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Datum</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm
            focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Bahntyp */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Bahntyp</label>
        <div className="flex gap-3">
          {(['KURZBAHN', 'LANGBAHN'] as PoolType[]).map((pt) => (
            <label key={pt} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value={pt}
                checked={poolType === pt}
                onChange={() => setPoolType(pt)}
                className="accent-blue-600"
              />
              <span className="text-sm">{pt === 'KURZBAHN' ? 'Kurzbahn (25m)' : 'Langbahn (50m)'}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Disziplin */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Disziplin</label>
        <select
          value={eventTypeId}
          onChange={(e) => setEventTypeId(e.target.value)}
          required
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm
            focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">— bitte wählen —</option>
          {eventTypes.map((et) => (
            <option key={et.id} value={et.id}>
              {et.displayName}
              {et.trainingOnly ? ' 🏊' : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Zeit */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Zeit <span className="text-gray-400 font-normal">(mm:ss,hh)</span>
        </label>
        <TimeInput
          value={timeInput}
          onChange={setTimeInput}
          error={timeError}
        />
      </div>

      {/* Notizen */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notizen <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="z.B. Wettkampf, Trainingszustand..."
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm
            focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      {/* Buttons */}
      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={saving}
          className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white
            hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Speichern…' : isEdit ? 'Speichern' : 'Hinzufügen'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-md border border-gray-300 px-4 py-2 text-sm
            text-gray-700 hover:bg-gray-50"
        >
          Abbrechen
        </button>
      </div>
    </form>
  )
}
