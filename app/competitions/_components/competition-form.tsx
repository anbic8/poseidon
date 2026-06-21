'use client'

import { useState } from 'react'
import type { Competition, PoolType } from '@/lib/types'

export type CompetitionFormData = {
  name: string
  location: string
  date: string
  poolType: PoolType
  notes: string
}

interface Props {
  competition?: Competition | null
  onSave: (data: CompetitionFormData) => Promise<void>
  onCancel: () => void
}

function today() {
  return new Date().toISOString().split('T')[0]
}

export function CompetitionForm({ competition, onSave, onCancel }: Props) {
  const isEdit = !!competition

  const [name,     setName]     = useState(competition?.name ?? '')
  const [location, setLocation] = useState(competition?.location ?? '')
  const [date,     setDate]     = useState(competition ? competition.date.split('T')[0] : today())
  const [poolType, setPoolType] = useState<PoolType>(competition?.poolType ?? 'KURZBAHN')
  const [notes,    setNotes]    = useState(competition?.notes ?? '')
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      await onSave({ name, location, date, poolType, notes })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Fehler beim Speichern')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="font-semibold text-gray-800">
        {isEdit ? 'Wettkampf bearbeiten' : 'Neuer Wettkampf'}
      </h3>

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="z.B. Stadtmeisterschaften 2026"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm
              focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Datum *</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm
              focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ort</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="z.B. Hallenbad München"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm
              focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Bahntyp *</label>
          <div className="flex gap-4">
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

        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Notizen</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm
              focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={saving}
          className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium
            text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Speichern…' : isEdit ? 'Speichern' : 'Anlegen'}
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
