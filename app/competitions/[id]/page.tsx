'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { formatDate, formatTime } from '@/lib/time'
import { POOL_LABELS, STROKE_LABELS } from '@/lib/constants'
import type { CompetitionEvent, CompetitionWithEvents } from '@/lib/types'
import { CompetitionForm, type CompetitionFormData } from '../_components/competition-form'
import { EventForm, type EventFormData } from './_components/event-form'

// ── Hilfskomponenten ─────────────────────────────────────────────────────────

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4"
      onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  )
}

function ConfirmDelete({ message, detail, onConfirm, onCancel }: {
  message: string; detail?: string; onConfirm: () => void; onCancel: () => void
}) {
  return (
    <div>
      <h3 className="font-semibold text-gray-800 mb-2">{message}</h3>
      {detail && <p className="text-sm text-gray-500 mb-4">{detail}</p>}
      <div className="flex gap-2 mt-4">
        <button onClick={onConfirm}
          className="flex-1 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">
          Löschen
        </button>
        <button onClick={onCancel}
          className="flex-1 rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
          Abbrechen
        </button>
      </div>
    </div>
  )
}

function EventRow({ event, onEdit, onDelete }: {
  event: CompetitionEvent
  onEdit:   (e: CompetitionEvent) => void
  onDelete: (id: string) => void
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="font-medium text-gray-800 text-sm">{event.eventType.displayName}</span>
          {event.heat && (
            <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500">{event.heat}</span>
          )}
          {event.relayLeg && (
            <span className="text-xs text-gray-400">Pos. {event.relayLeg}</span>
          )}
          {event.relayStroke && (
            <span className="text-xs text-gray-400">({STROKE_LABELS[event.relayStroke] ?? event.relayStroke})</span>
          )}
        </div>
        <div className="flex flex-wrap gap-x-3 mt-0.5 text-xs text-gray-400">
          {event.lane  && <span>Bahn {event.lane}</span>}
          {event.place && <span>Platz {event.place}</span>}
          {event.teamTimeMs && <span>Team: {formatTime(event.teamTimeMs)}</span>}
          {event.notes && <span>· {event.notes}</span>}
        </div>
      </div>
      <span className="font-mono text-lg font-semibold text-blue-700 shrink-0">
        {formatTime(event.timeMs)}
      </span>
      <div className="flex gap-1 shrink-0">
        <button onClick={() => onEdit(event)}
          className="rounded px-2 py-1 text-xs text-gray-400 hover:bg-gray-100" title="Bearbeiten">
          ✏️
        </button>
        <button onClick={() => onDelete(event.id)}
          className="rounded px-2 py-1 text-xs text-red-400 hover:bg-red-50" title="Löschen">
          🗑️
        </button>
      </div>
    </div>
  )
}

// ── Hauptseite ────────────────────────────────────────────────────────────────

export default function CompetitionDetailPage() {
  const { id }   = useParams<{ id: string }>()
  const router   = useRouter()

  const [competition,    setCompetition]    = useState<CompetitionWithEvents | null>(null)
  const [loading,        setLoading]        = useState(true)
  const [editComp,       setEditComp]       = useState(false)
  const [addEvent,       setAddEvent]       = useState(false)
  const [editEvent,      setEditEvent]      = useState<CompetitionEvent | null>(null)
  const [deleteEventId,  setDeleteEventId]  = useState<string | null>(null)
  const [deleteComp,     setDeleteComp]     = useState(false)

  const load = useCallback(() => {
    fetch(`/api/competitions/${id}`)
      .then((r) => r.json())
      .then((data) => { setCompetition(data); setLoading(false) })
  }, [id])

  useEffect(() => { load() }, [load])

  async function handleUpdateComp(data: CompetitionFormData) {
    await fetch(`/api/competitions/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
    })
    setEditComp(false)
    load()
  }

  async function handleDeleteComp() {
    await fetch(`/api/competitions/${id}`, { method: 'DELETE' })
    router.push('/competitions')
  }

  async function handleAddEvent(data: EventFormData) {
    const res = await fetch(`/api/competitions/${id}/events`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.errors?.formErrors?.[0] ?? 'Fehler')
    }
    setAddEvent(false)
    load()
  }

  async function handleUpdateEvent(data: EventFormData) {
    if (!editEvent) return
    await fetch(`/api/events/${editEvent.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
    })
    setEditEvent(null)
    load()
  }

  async function handleDeleteEvent(eventId: string) {
    await fetch(`/api/events/${eventId}`, { method: 'DELETE' })
    setDeleteEventId(null)
    load()
  }

  if (loading) return <div className="max-w-4xl mx-auto px-4 py-8 text-gray-500">Lädt…</div>
  if (!competition) return (
    <div className="max-w-4xl mx-auto px-4 py-8 text-gray-500">
      Wettkampf nicht gefunden. <Link href="/competitions" className="text-blue-600 hover:underline">Zurück</Link>
    </div>
  )

  const individualEvents = competition.events.filter((e) => !e.eventType.isRelay)
  const relayEvents      = competition.events.filter((e) => e.eventType.isRelay)

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="mb-4">
        <Link href="/competitions" className="text-sm text-blue-600 hover:underline">
          ← Wettkämpfe
        </Link>
      </div>

      {/* Wettkampf-Header */}
      {editComp ? (
        <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <CompetitionForm
            competition={competition}
            onSave={handleUpdateComp}
            onCancel={() => setEditComp(false)}
          />
        </div>
      ) : (
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{competition.name}</h1>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500">
                <span>{formatDate(competition.date)}</span>
                {competition.location && <span>· {competition.location}</span>}
                <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                  {POOL_LABELS[competition.poolType]}
                </span>
              </div>
              {competition.notes && (
                <p className="mt-2 text-sm text-gray-600">{competition.notes}</p>
              )}
            </div>
            <div className="flex gap-1 shrink-0">
              <button onClick={() => setEditComp(true)}
                className="rounded px-2 py-1 text-sm text-gray-400 hover:bg-gray-100">✏️</button>
              <button onClick={() => setDeleteComp(true)}
                className="rounded px-2 py-1 text-sm text-red-400 hover:bg-red-50">🗑️</button>
            </div>
          </div>
        </div>
      )}

      {/* Läufe-Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">
          Läufe ({competition.events.length})
        </h2>
        <button
          onClick={() => { setAddEvent(true); setEditEvent(null) }}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + Lauf hinzufügen
        </button>
      </div>

      {/* Add-Formular */}
      {addEvent && (
        <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <EventForm
            poolType={competition.poolType}
            onSave={handleAddEvent}
            onCancel={() => setAddEvent(false)}
          />
        </div>
      )}

      {/* Einzelstarts */}
      {individualEvents.length > 0 && (
        <section className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
            Einzelstarts
          </p>
          <div className="space-y-2">
            {individualEvents.map((ev) => (
              <EventRow key={ev.id} event={ev}
                onEdit={setEditEvent} onDelete={setDeleteEventId} />
            ))}
          </div>
        </section>
      )}

      {/* Staffeln */}
      {relayEvents.length > 0 && (
        <section className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
            Staffeln
          </p>
          <div className="space-y-2">
            {relayEvents.map((ev) => (
              <EventRow key={ev.id} event={ev}
                onEdit={setEditEvent} onDelete={setDeleteEventId} />
            ))}
          </div>
        </section>
      )}

      {competition.events.length === 0 && !addEvent && (
        <div className="rounded-lg border border-dashed border-gray-300 py-12 text-center text-gray-500">
          Noch keine Läufe eingetragen.
        </div>
      )}

      {/* Modals */}
      {editEvent && (
        <Modal onClose={() => setEditEvent(null)}>
          <EventForm
            poolType={competition.poolType}
            event={editEvent}
            onSave={handleUpdateEvent}
            onCancel={() => setEditEvent(null)}
          />
        </Modal>
      )}

      {deleteEventId && (
        <Modal onClose={() => setDeleteEventId(null)}>
          <ConfirmDelete
            message="Lauf löschen?"
            onConfirm={() => handleDeleteEvent(deleteEventId)}
            onCancel={() => setDeleteEventId(null)}
          />
        </Modal>
      )}

      {deleteComp && (
        <Modal onClose={() => setDeleteComp(false)}>
          <ConfirmDelete
            message="Wettkampf löschen?"
            detail="Alle Läufe und Medien werden ebenfalls gelöscht. Diese Aktion ist nicht rückgängig zu machen."
            onConfirm={handleDeleteComp}
            onCancel={() => setDeleteComp(false)}
          />
        </Modal>
      )}
    </div>
  )
}
