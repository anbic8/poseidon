'use client'

import { useEffect, useState } from 'react'
import { TimeInput } from '@/components/time-input'
import { formatTime } from '@/lib/time'
import { HEAT_OPTIONS, RELAY_STROKES } from '@/lib/constants'
import type { CompetitionEvent, EventType, PoolType } from '@/lib/types'

export type EventFormData = {
  eventTypeId: string; timeInput: string; teamTimeInput?: string
  relayLeg?: number | null; relayStroke?: string | null
  heat?: string; lane?: number | null; place?: number | null; notes?: string
}

interface Props {
  poolType: PoolType
  event?: CompetitionEvent | null
  onSave: (data: EventFormData) => Promise<void>
  onCancel: () => void
}

const INPUT = `w-full rounded-md border border-gray-300 dark:border-slate-600
  bg-white dark:bg-slate-700 px-3 py-2 text-sm
  text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-400
  focus:outline-none focus:ring-2 focus:ring-blue-500`

const LABEL = 'block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1'

export function EventForm({ poolType, event, onSave, onCancel }: Props) {
  const isEdit = !!event

  const [eventTypes,    setEventTypes]    = useState<EventType[]>([])
  const [eventTypeId,   setEventTypeId]   = useState(event?.eventTypeId ?? '')
  const [timeInput,     setTimeInput]     = useState(event ? formatTime(event.timeMs) : '')
  const [teamTimeInput, setTeamTimeInput] = useState(event?.teamTimeMs ? formatTime(event.teamTimeMs) : '')
  const [relayLeg,      setRelayLeg]      = useState<string>(event?.relayLeg?.toString() ?? '')
  const [relayStroke,   setRelayStroke]   = useState(event?.relayStroke ?? '')
  const [heat,          setHeat]          = useState(event?.heat ?? '')
  const [lane,          setLane]          = useState<string>(event?.lane?.toString() ?? '')
  const [place,         setPlace]         = useState<string>(event?.place?.toString() ?? '')
  const [notes,         setNotes]         = useState(event?.notes ?? '')
  const [timeError,     setTimeError]     = useState('')
  const [saving,        setSaving]        = useState(false)
  const [error,         setError]         = useState('')

  useEffect(() => {
    fetch(`/api/event-types?poolType=${poolType}&trainingOnly=false`).then((r) => r.json()).then(setEventTypes)
  }, [poolType])

  const selectedType   = eventTypes.find((e) => e.id === eventTypeId)
  const isRelay        = selectedType?.isRelay ?? false
  const isLagenStaffel = isRelay && selectedType?.stroke === 'LAGEN'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setTimeError(''); setError('')
    if (!eventTypeId) { setError('Bitte Disziplin auswählen.'); return }
    if (!timeInput)   { setTimeError('Zeitangabe erforderlich'); return }
    setSaving(true)
    try {
      await onSave({
        eventTypeId, timeInput,
        teamTimeInput: isRelay && teamTimeInput ? teamTimeInput : undefined,
        relayLeg:      isRelay && relayLeg ? parseInt(relayLeg, 10) : null,
        relayStroke:   isLagenStaffel && relayStroke ? relayStroke : null,
        heat:          heat || undefined,
        lane:          lane  ? parseInt(lane,  10) : null,
        place:         place ? parseInt(place, 10) : null,
        notes:         notes || undefined,
      })
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Fehler') }
    finally { setSaving(false) }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="font-semibold text-gray-800 dark:text-slate-100">
        {isEdit ? 'Lauf bearbeiten' : 'Lauf hinzufügen'}
      </h3>
      {error && (
        <div className="rounded-md bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 px-3 py-2 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      <div>
        <label className={LABEL}>Disziplin *</label>
        <select value={eventTypeId} onChange={(e) => { setEventTypeId(e.target.value); setRelayLeg(''); setRelayStroke('') }}
          required className={INPUT}>
          <option value="">— bitte wählen —</option>
          {eventTypes.filter(e => !e.isRelay).length > 0 && (
            <optgroup label="Einzelstarts">
              {eventTypes.filter(e => !e.isRelay).map((et) => (
                <option key={et.id} value={et.id}>{et.displayName}</option>
              ))}
            </optgroup>
          )}
          {eventTypes.filter(e => e.isRelay).length > 0 && (
            <optgroup label="Staffeln">
              {eventTypes.filter(e => e.isRelay).map((et) => (
                <option key={et.id} value={et.id}>{et.displayName}</option>
              ))}
            </optgroup>
          )}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className={isRelay ? '' : 'col-span-2'}>
          <label className={LABEL}>
            {isRelay ? 'Eigene Teilzeit *' : 'Zeit *'}{' '}
            <span className="text-gray-400 dark:text-slate-500 font-normal">(mm:ss,hh)</span>
          </label>
          <TimeInput value={timeInput} onChange={setTimeInput} error={timeError} />
        </div>
        {isRelay && (
          <div>
            <label className={LABEL}>Gesamtzeit Team <span className="text-gray-400 dark:text-slate-500 font-normal">(opt.)</span></label>
            <TimeInput value={teamTimeInput} onChange={setTeamTimeInput} />
          </div>
        )}
      </div>

      {isRelay && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={LABEL}>Position in Staffel</label>
            <select value={relayLeg} onChange={(e) => setRelayLeg(e.target.value)} className={INPUT}>
              <option value="">—</option>
              {[1,2,3,4].map((n) => <option key={n} value={n}>{n}. Schwimmer</option>)}
            </select>
          </div>
          {isLagenStaffel && (
            <div>
              <label className={LABEL}>Eigene Lage</label>
              <select value={relayStroke} onChange={(e) => setRelayStroke(e.target.value)} className={INPUT}>
                <option value="">—</option>
                {RELAY_STROKES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className={LABEL}>Lauf</label>
          <input type="text" value={heat} onChange={(e) => setHeat(e.target.value)} list="heat-options"
            placeholder="z.B. Finale" className={INPUT} />
          <datalist id="heat-options">
            {HEAT_OPTIONS.map((h) => <option key={h} value={h} />)}
          </datalist>
        </div>
        <div>
          <label className={LABEL}>Bahn</label>
          <input type="number" value={lane} onChange={(e) => setLane(e.target.value)} min={1} max={10} className={INPUT} />
        </div>
        <div>
          <label className={LABEL}>Platz</label>
          <input type="number" value={place} onChange={(e) => setPlace(e.target.value)} min={1} className={INPUT} />
        </div>
      </div>

      <div>
        <label className={LABEL}>Notizen</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={`${INPUT} resize-none`} />
      </div>

      <div className="flex gap-2 pt-1">
        <button type="submit" disabled={saving}
          className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
          {saving ? 'Speichern…' : isEdit ? 'Speichern' : 'Hinzufügen'}
        </button>
        <button type="button" onClick={onCancel}
          className="flex-1 rounded-md border border-gray-300 dark:border-slate-600 px-4 py-2 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700">
          Abbrechen
        </button>
      </div>
    </form>
  )
}
