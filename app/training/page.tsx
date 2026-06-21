'use client'

import { useCallback, useEffect, useState } from 'react'
import { TrainingForm, type FormData } from './_components/training-form'
import { MediaUpload } from '@/components/media-upload'
import { formatTime, formatDate } from '@/lib/time'
import type { EventType, Media, PoolType, TrainingEntry } from '@/lib/types'

const POOL_LABELS: Record<PoolType, string> = { KURZBAHN: 'KB', LANGBAHN: 'LB' }
const currentYear = new Date().getFullYear()
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - i)

const SELECT = `rounded-md border border-gray-300 dark:border-slate-600
  bg-white dark:bg-slate-800 px-3 py-1.5 text-sm
  text-gray-800 dark:text-slate-200
  focus:outline-none focus:ring-2 focus:ring-blue-500`

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

  useEffect(() => {
    const params = new URLSearchParams()
    if (filterPoolType) params.set('poolType', filterPoolType)
    fetch(`/api/event-types?${params}`).then((r) => r.json()).then(setEventTypes)
  }, [filterPoolType])

  const loadTrainings = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filterPoolType)    params.set('poolType', filterPoolType)
    if (filterEventTypeId) params.set('eventTypeId', filterEventTypeId)
    if (filterYear)        params.set('year', String(filterYear))
    fetch(`/api/trainings?${params}`).then((r) => r.json()).then(setTrainings).finally(() => setLoading(false))
  }, [filterPoolType, filterEventTypeId, filterYear])

  useEffect(() => { loadTrainings() }, [loadTrainings])

  async function handleCreate(data: FormData) {
    const res = await fetch('/api/trainings', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
    })
    if (!res.ok) { const err = await res.json(); throw new Error(err.errors?.formErrors?.[0] ?? 'Fehler') }
    setShowAddForm(false)
    loadTrainings()
  }

  async function handleUpdate(data: FormData) {
    if (!editEntry) return
    await fetch(`/api/trainings/${editEntry.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
    })
    setEditEntry(null)
    loadTrainings()
  }

  async function handleDelete(id: string) {
    await fetch(`/api/trainings/${id}`, { method: 'DELETE' })
    setDeleteId(null)
    loadTrainings()
  }

  async function handleDeleteMedia(mediaId: string) {
    await fetch(`/api/media/${mediaId}`, { method: 'DELETE' })
    loadTrainings()
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Training</h1>
        <button onClick={() => { setShowAddForm(true); setEditEntry(null) }}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          + Neue Zeit
        </button>
      </div>

      {showAddForm && (
        <div className="mb-6 rounded-lg border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/40 p-4">
          <TrainingForm onSave={handleCreate} onCancel={() => setShowAddForm(false)} />
        </div>
      )}

      {/* Filter */}
      <div className="mb-6 flex flex-wrap gap-3">
        <select value={filterPoolType} onChange={(e) => { setFilterPoolType(e.target.value as PoolType | ''); setFilterEventTypeId('') }} className={SELECT}>
          <option value="">Alle Bahnen</option>
          <option value="KURZBAHN">Kurzbahn (25m)</option>
          <option value="LANGBAHN">Langbahn (50m)</option>
        </select>

        <select value={filterEventTypeId} onChange={(e) => setFilterEventTypeId(e.target.value)} className={SELECT}>
          <option value="">Alle Disziplinen</option>
          {eventTypes.map((et) => (
            <option key={et.id} value={et.id}>{et.displayName}</option>
          ))}
        </select>

        <select value={filterYear} onChange={(e) => setFilterYear(Number(e.target.value))} className={SELECT}>
          <option value={0}>Alle Jahre</option>
          {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>

        <span className="ml-auto text-sm text-gray-500 dark:text-slate-400 self-center">
          {loading ? 'Lädt…' : `${trainings.length} Einträge`}
        </span>
      </div>

      {/* Liste */}
      {trainings.length === 0 && !loading ? (
        <div className="rounded-lg border border-dashed border-gray-300 dark:border-slate-700 py-12 text-center text-gray-500 dark:text-slate-500">
          Noch keine Trainingszeiten eingetragen.
        </div>
      ) : (
        <div className="space-y-2">
          {trainings.map((t) => (
            <div key={t.id}
              className="rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800
                hover:border-gray-300 dark:hover:border-slate-600">
              {/* Zeile */}
              <div className="px-4 py-3 flex items-center gap-3">
                <span className="w-20 shrink-0 text-xs text-gray-500 dark:text-slate-400">
                  {formatDate(t.date)}
                </span>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-gray-800 dark:text-slate-200 truncate block">
                    {t.eventType.displayName}
                  </span>
                  <span className="text-xs text-gray-400 dark:text-slate-500">
                    {POOL_LABELS[t.poolType]}{t.notes && <> · {t.notes}</>}
                  </span>
                </div>
                <span className="font-mono text-base font-semibold text-blue-700 dark:text-blue-400 shrink-0">
                  {formatTime(t.timeMs)}
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  <MediaUpload
                    url={`/api/trainings/${t.id}/media`}
                    accept="video/*"
                    label="🎥"
                    onSuccess={() => loadTrainings()}
                  />
                  <button onClick={() => { setEditEntry(t); setShowAddForm(false) }}
                    className="rounded px-2 py-1 text-xs text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700">
                    ✏️
                  </button>
                  <button onClick={() => setDeleteId(t.id)}
                    className="rounded px-2 py-1 text-xs text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30">
                    🗑️
                  </button>
                </div>
              </div>
              {/* Videos */}
              {t.media && t.media.filter((m: Media) => m.type === 'VIDEO').map((v: Media) => (
                <div key={v.id} className="border-t border-gray-100 dark:border-slate-700 px-4 py-3 flex gap-3 items-start bg-gray-50 dark:bg-slate-900/50">
                  <video controls preload="metadata" className="rounded flex-1 max-h-52 bg-black">
                    <source src={`/api/media/file/${v.filename}`} type={v.mimeType} />
                  </video>
                  <button onClick={() => handleDeleteMedia(v.id)}
                    className="rounded px-2 py-1 text-xs text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 shrink-0 mt-1">
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Edit-Modal */}
      {editEntry && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4"
          onClick={() => setEditEntry(null)}>
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}>
            <TrainingForm entry={editEntry} onSave={handleUpdate} onCancel={() => setEditEntry(null)} />
          </div>
        </div>
      )}

      {/* Löschen-Bestätigung */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4"
          onClick={() => setDeleteId(null)}>
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl p-6 w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold text-gray-800 dark:text-slate-100 mb-2">Eintrag löschen?</h3>
            <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">Diese Aktion kann nicht rückgängig gemacht werden.</p>
            <div className="flex gap-2">
              <button onClick={() => handleDelete(deleteId)}
                className="flex-1 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">
                Löschen
              </button>
              <button onClick={() => setDeleteId(null)}
                className="flex-1 rounded-md border border-gray-300 dark:border-slate-600 px-4 py-2 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700">
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
