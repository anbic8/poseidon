import type { PoolType } from './types'

export const POOL_LABELS: Record<PoolType, string> = {
  KURZBAHN: 'KB · 25m',
  LANGBAHN: 'LB · 50m',
}

export const STROKE_LABELS: Record<string, string> = {
  FREISTIL:               'Freistil',
  RUECKEN:                'Rücken',
  BRUST:                  'Brust',
  SCHMETTERLING:          'Schmetterling',
  LAGEN:                  'Lagen',
  RUECKEN_BEINE_OHNE_BRETT: 'Rücken Beine (ohne Brett)',
  RUECKEN_BEINE_MIT_BRETT:  'Rücken Beine (mit Brett)',
  KRAUL_BEINE_MIT_BRETT:    'Kraul Beine (mit Brett)',
}

export const HEAT_OPTIONS = ['Vorlauf', 'Halbfinale', 'A-Finale', 'B-Finale', 'Finale']

export const RELAY_STROKES = [
  { value: 'RUECKEN',        label: 'Rücken (Pos. 1)' },
  { value: 'BRUST',          label: 'Brust (Pos. 2)' },
  { value: 'SCHMETTERLING',  label: 'Schmetterling (Pos. 3)' },
  { value: 'FREISTIL',       label: 'Freistil (Pos. 4)' },
]
