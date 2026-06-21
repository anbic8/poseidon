'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatDate } from '@/lib/time'
import { POOL_LABELS } from '@/lib/constants'
import type { Competition } from '@/lib/types'
import { CompetitionForm, type CompetitionFormData } from './_components/competition-form'

export default function CompetitionsPage() {
  const router = useRouter()
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [loading,      setLoading]      = useState(false)
  const [showAdd,      setShowAdd]      = useState(false)
  const [editComp,     setEditComp]     = useState<Competition | null>(null)
  const [deleteId,     setDeleteId]     = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    fetch('/api/competitions').then((r) => r.json()).then(setCompetitions).finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  async function handleCreate(data: CompetitionFormData) {
    const res = await fetch('/api/competitions', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Fehler beim Anlegen')
    const created: Competition = await res.json()
    setShowAdd(false)
    router.push(`/competitions/${created.id}`)
  }

  async function handleUpdate(data: CompetitionFormData) {
    if (!editComp) return
    await fetch(`/api/competitions/${editComp.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
    })
    setEditComp(null)
    load()
  }

  async function handleDelete(id: string) {
    await fetch(`/api/competitions/${id}`, { method: 'DELETE' })
    setDeleteId(null)
    load()
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Wettkämpfe</h1>
        <button onClick={() => { setShowAdd(true); setEditComp(null) }}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          + Neuer Wettkampf
        </button>
      </div>

      {showAdd && (
        <div className="mb-6 rounded-lg border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/40 p-4">
          <CompetitionForm onSave={handleCreate} onCancel={() => setShowAdd(false)} />
        </div>
      )}

      {loading && <p className="text-gray-500 dark:text-slate-400 text-sm">Lädt…</p>}

      {!loading && competitions.length === 0 && (
        <div className="rounded-lg border border-dashed border-gray-300 dark:border-slate-700 py-16 text-center text-gray-500 dark:text-slate-500">
          Noch keine Wettkämpfe eingetragen.
        </div>
      )}

      <div className="space-y-3">
        {competitions.map((c) => (
          <div key={c.id}>
            {editComp?.id === c.id ? (
              <div className="rounded-lg border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/40 p-4">
                <CompetitionForm competition={c} onSave={handleUpdate} onCancel={() => setEditComp(null)} />
              </div>
            ) : (
              <div
                className="rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800
                  p-4 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-sm cursor-pointer"
                onClick={() => router.push(`/competitions/${c.id}`)}>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="font-semibold text-gray-900 dark:text-slate-100 truncate">{c.name}</h2>
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm text-gray-500 dark:text-slate-400">
                      <span>{formatDate(c.date)}</span>
                      {c.location && <span>· {c.location}</span>}
                      <span className="rounded-full bg-gray-100 dark:bg-slate-700 px-2 py-0.5 text-xs font-medium text-gray-600 dark:text-slate-300">
                        {POOL_LABELS[c.poolType]}
                      </span>
                      {c._count && (
                        <span className="text-xs text-gray-400 dark:text-slate-500">
                          {c._count.events} {c._count.events === 1 ? 'Lauf' : 'Läufe'}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={(e) => { e.stopPropagation(); setEditComp(c) }}
                      className="rounded px-2 py-1 text-xs text-gray-400 dark:text-slate-500 hover:bg-gray-100 dark:hover:bg-slate-700">✏️</button>
                    <button onClick={(e) => { e.stopPropagation(); setDeleteId(c.id) }}
                      className="rounded px-2 py-1 text-xs text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30">🗑️</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4"
          onClick={() => setDeleteId(null)}>
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl p-6 w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold text-gray-800 dark:text-slate-100 mb-2">Wettkampf löschen?</h3>
            <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">
              Alle Läufe und Medien werden ebenfalls gelöscht.
            </p>
            <div className="flex gap-2">
              <button onClick={() => handleDelete(deleteId)}
                className="flex-1 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">Löschen</button>
              <button onClick={() => setDeleteId(null)}
                className="flex-1 rounded-md border border-gray-300 dark:border-slate-600 px-4 py-2 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700">Abbrechen</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
