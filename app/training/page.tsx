'use client'

import { useCallback, useEffect, useState } from 'react'
import { TrainingForm, type FormData } from './_components/training-form'
import { formatTime } from '@/lib/time'
import type { EventType, PoolType, TrainingEntry } from '@/lib/types'

const POOL_LABELS: Record<PoolType, string> = {
  KURZBAHN: 'KB',
  LANGBAHN: 'LB',
}

const currentYear = new Date().getFullYear()
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - i)

export default function TrainingPage() {
  const [trainings, setTrainings]         = useState<TrainingEntry[]>([])
  const [eventTypes, setEventTypes]       = useState<EventType[]>([])
  const [filterPoolType, setFilterPoolType] = useState<PoolType | ''>('')
  const [filterEventTypeId, setFilterEventTypeId] = useState('')
  const [filterYear, setFilterYear]       = useState<number>(currentYear)
  const [loading, setLoading]             = useState(false)
  const [showAddForm, setShowAddForm]     = useState(false)
  const [editEntry, setEditEntry]         = useState<TrainingEntry | null>(null)
  const [deleteId, setDeleteId]           = useState<string | null>(null)

  // EventTypes für Filter-Dropdown laden
  useEffect(() => {
    const params = new URLSearchParams()
    if (filterPoolType) params.set('poolType', filterPoolType)
    fetch(`/api/event-types?${params}`)
      .then((r) => r.json())
      .then(setEventTypes)
  }, [filterPoolType])

  const loadTrainings = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filterPoolType)    params.set('poolType', filterPoolType)
    if (filterEventTypeId) params.set('eventTypeId', filterEventTypeId)
    if (filterYear)        params.set('year', String(filterYear))

    fetch(`/api/trainings?${params}`)
      .then((r) => r.json())
      .then(setTrainings)
      .finally(() => setLoading(false))
  }, [filterPoolType, filterEventTypeId, filterYear])

  useEffect(() => {
    loadTrainings()
  }, [loadTrainings])

  async function handleCreate(data: FormData) {
    const res = await fetch('/api/trainings', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(data),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.errors?.formErrors?.[0] ?? 'Fehler beim Anlegen')
    }
    setShowAddForm(false)
    loadTrainings()
  }

  async function handleUpdate(data: FormData) {
    if (!editEntry) return
    const res = await fetch(`/api/trainings/${editEntry.id}`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(data),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.errors?.formErrors?.[0] ?? 'Fehler beim Speichern')
    }
    setEditEntry(null)
    loadTrainings()
  }

  async function handleDelete(id: string) {
    await fetch(`/api/trainings/${id}`, { method: 'DELETE' })
    setDeleteId(null)
    loadTrainings()
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('de-DE', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    })
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Training</h1>
        <button
          onClick={() => { setShowAddForm(true); setEditEntry(null) }}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white
            hover:bg-blue-700"
        >
          + Neue Zeit
        </button>
      </div>

      {/* Add-Formular */}
      {showAddForm && (
        <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <TrainingForm
            onSave={handleCreate}
            onCancel={() => setShowAddForm(false)}
          />
        </div>
      )}

      {/* Filter */}
      <div className="mb-6 flex flex-wrap gap-3">
        <select
          value={filterPoolType}
          onChange={(e) => { setFilterPoolType(e.target.value as PoolType | ''); setFilterEventTypeId('') }}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm
            focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Alle Bahnen</option>
          <option value="KURZBAHN">Kurzbahn (25m)</option>
          <option value="LANGBAHN">Langbahn (50m)</option>
        </select>

        <select
          value={filterEventTypeId}
          onChange={(e) => setFilterEventTypeId(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm
            focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Alle Disziplinen</option>
          {eventTypes.map((et) => (
            <option key={et.id} value={et.id}>{et.displayName}</option>
          ))}
        </select>

        <select
          value={filterYear}
          onChange={(e) => setFilterYear(Number(e.target.value))}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm
            focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value={0}>Alle Jahre</option>
          {YEARS.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>

        <span className="ml-auto text-sm text-gray-500 self-center">
          {loading ? 'Lädt…' : `${trainings.length} Einträge`}
        </span>
      </div>

      {/* Liste */}
      {trainings.length === 0 && !loading ? (
        <div className="rounded-lg border border-dashed border-gray-300 py-12 text-center text-gray-500">
          Noch keine Trainingszeiten eingetragen.
        </div>
      ) : (
        <div className="space-y-2">
          {trainings.map((t) => (
            <div
              key={t.id}
              className="rounded-lg border border-gray-200 bg-white px-4 py-3
                flex items-center gap-4 hover:border-gray-300 transition-colors"
            >
              {/* Datum */}
              <span className="w-24 shrink-0 text-sm text-gray-500">
                {formatDate(t.date)}
              </span>

              {/* Disziplin + Bahntyp */}
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-gray-800 truncate block">
                  {t.eventType.displayName}
                </span>
                <span className="text-xs text-gray-400">
                  {POOL_LABELS[t.poolType]}
                  {t.notes && <> · {t.notes}</>}
                </span>
              </div>

              {/* Zeit */}
              <span className="font-mono text-lg font-semibold text-blue-700 shrink-0">
                {formatTime(t.timeMs)}
              </span>

              {/* Aktionen */}
              <div className="flex gap-1 shrink-0">
                <button
                  onClick={() => { setEditEntry(t); setShowAddForm(false) }}
                  className="rounded px-2 py-1 text-xs text-gray-500 hover:bg-gray-100"
                  title="Bearbeiten"
                >
                  ✏️
                </button>
                <button
                  onClick={() => setDeleteId(t.id)}
                  className="rounded px-2 py-1 text-xs text-red-400 hover:bg-red-50"
                  title="Löschen"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit-Modal */}
      {editEntry && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4"
          onClick={() => setEditEntry(null)}
        >
          <div
            className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <TrainingForm
              entry={editEntry}
              onSave={handleUpdate}
              onCancel={() => setEditEntry(null)}
            />
          </div>
        </div>
      )}

      {/* Löschen-Bestätigung */}
      {deleteId && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4"
          onClick={() => setDeleteId(null)}
        >
          <div
            className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-semibold text-gray-800 mb-2">Eintrag löschen?</h3>
            <p className="text-sm text-gray-500 mb-4">Diese Aktion kann nicht rückgängig gemacht werden.</p>
            <div className="flex gap-2">
              <button
                onClick={() => handleDelete(deleteId)}
                className="flex-1 rounded-md bg-red-600 px-4 py-2 text-sm font-medium
                  text-white hover:bg-red-700"
              >
                Löschen
              </button>
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 rounded-md border border-gray-300 px-4 py-2 text-sm
                  text-gray-700 hover:bg-gray-50"
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
