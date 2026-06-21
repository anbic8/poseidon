export type PoolType = 'KURZBAHN' | 'LANGBAHN'

export type EventType = {
  id: string
  displayName: string
  stroke: string
  distanceM: number
  isRelay: boolean
  relayLegs: number | null
  trainingOnly: boolean
  validKB: boolean
  validLB: boolean
  sortOrder: number
}

export type TrainingEntry = {
  id: string
  date: string
  eventTypeId: string
  eventType: EventType
  poolType: PoolType
  timeMs: number
  notes: string | null
  createdAt: string
  updatedAt: string
}

export type Competition = {
  id: string
  name: string
  location: string | null
  date: string
  poolType: PoolType
  notes: string | null
  _count?: { events: number }
  createdAt: string
  updatedAt: string
}

export type CompetitionEvent = {
  id: string
  competitionId: string
  eventTypeId: string
  eventType: EventType
  timeMs: number
  teamTimeMs: number | null
  relayLeg: number | null
  relayStroke: string | null
  heat: string | null
  lane: number | null
  place: number | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

export type CompetitionWithEvents = Competition & {
  events: CompetitionEvent[]
}
