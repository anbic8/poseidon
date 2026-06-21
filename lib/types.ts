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
