import { PrismaClient, Stroke } from '@prisma/client'

const db = new PrismaClient()

type EventTypeSeed = {
  displayName: string
  stroke: Stroke
  distanceM: number
  isRelay: boolean
  relayLegs: number | null
  trainingOnly: boolean
  validKB: boolean
  validLB: boolean
  sortOrder: number
}

const eventTypes: EventTypeSeed[] = [
  // --- Freistil ---
  { displayName: '50m Freistil',   stroke: Stroke.FREISTIL, distanceM: 50,   isRelay: false, relayLegs: null, trainingOnly: false, validKB: true,  validLB: true,  sortOrder: 10 },
  { displayName: '100m Freistil',  stroke: Stroke.FREISTIL, distanceM: 100,  isRelay: false, relayLegs: null, trainingOnly: false, validKB: true,  validLB: true,  sortOrder: 11 },
  { displayName: '200m Freistil',  stroke: Stroke.FREISTIL, distanceM: 200,  isRelay: false, relayLegs: null, trainingOnly: false, validKB: true,  validLB: true,  sortOrder: 12 },
  { displayName: '400m Freistil',  stroke: Stroke.FREISTIL, distanceM: 400,  isRelay: false, relayLegs: null, trainingOnly: false, validKB: true,  validLB: true,  sortOrder: 13 },
  { displayName: '800m Freistil',  stroke: Stroke.FREISTIL, distanceM: 800,  isRelay: false, relayLegs: null, trainingOnly: false, validKB: true,  validLB: true,  sortOrder: 14 },
  { displayName: '1500m Freistil', stroke: Stroke.FREISTIL, distanceM: 1500, isRelay: false, relayLegs: null, trainingOnly: false, validKB: true,  validLB: true,  sortOrder: 15 },

  // --- Rücken ---
  { displayName: '50m Rücken',  stroke: Stroke.RUECKEN, distanceM: 50,  isRelay: false, relayLegs: null, trainingOnly: false, validKB: true, validLB: true, sortOrder: 20 },
  { displayName: '100m Rücken', stroke: Stroke.RUECKEN, distanceM: 100, isRelay: false, relayLegs: null, trainingOnly: false, validKB: true, validLB: true, sortOrder: 21 },
  { displayName: '200m Rücken', stroke: Stroke.RUECKEN, distanceM: 200, isRelay: false, relayLegs: null, trainingOnly: false, validKB: true, validLB: true, sortOrder: 22 },

  // --- Brust ---
  { displayName: '50m Brust',  stroke: Stroke.BRUST, distanceM: 50,  isRelay: false, relayLegs: null, trainingOnly: false, validKB: true, validLB: true, sortOrder: 30 },
  { displayName: '100m Brust', stroke: Stroke.BRUST, distanceM: 100, isRelay: false, relayLegs: null, trainingOnly: false, validKB: true, validLB: true, sortOrder: 31 },
  { displayName: '200m Brust', stroke: Stroke.BRUST, distanceM: 200, isRelay: false, relayLegs: null, trainingOnly: false, validKB: true, validLB: true, sortOrder: 32 },

  // --- Schmetterling ---
  { displayName: '50m Schmetterling',  stroke: Stroke.SCHMETTERLING, distanceM: 50,  isRelay: false, relayLegs: null, trainingOnly: false, validKB: true, validLB: true, sortOrder: 40 },
  { displayName: '100m Schmetterling', stroke: Stroke.SCHMETTERLING, distanceM: 100, isRelay: false, relayLegs: null, trainingOnly: false, validKB: true, validLB: true, sortOrder: 41 },
  { displayName: '200m Schmetterling', stroke: Stroke.SCHMETTERLING, distanceM: 200, isRelay: false, relayLegs: null, trainingOnly: false, validKB: true, validLB: true, sortOrder: 42 },

  // --- Lagen ---
  { displayName: '100m Lagen', stroke: Stroke.LAGEN, distanceM: 100, isRelay: false, relayLegs: null, trainingOnly: false, validKB: true,  validLB: false, sortOrder: 50 },
  { displayName: '200m Lagen', stroke: Stroke.LAGEN, distanceM: 200, isRelay: false, relayLegs: null, trainingOnly: false, validKB: true,  validLB: true,  sortOrder: 51 },
  { displayName: '400m Lagen', stroke: Stroke.LAGEN, distanceM: 400, isRelay: false, relayLegs: null, trainingOnly: false, validKB: true,  validLB: true,  sortOrder: 52 },

  // --- Staffeln ---
  { displayName: '4x50m Freistil Staffel',  stroke: Stroke.FREISTIL, distanceM: 50,  isRelay: true, relayLegs: 4, trainingOnly: false, validKB: true,  validLB: false, sortOrder: 60 },
  { displayName: '4x100m Freistil Staffel', stroke: Stroke.FREISTIL, distanceM: 100, isRelay: true, relayLegs: 4, trainingOnly: false, validKB: true,  validLB: true,  sortOrder: 61 },
  { displayName: '4x200m Freistil Staffel', stroke: Stroke.FREISTIL, distanceM: 200, isRelay: true, relayLegs: 4, trainingOnly: false, validKB: true,  validLB: true,  sortOrder: 62 },
  { displayName: '4x50m Lagen Staffel',     stroke: Stroke.LAGEN,    distanceM: 50,  isRelay: true, relayLegs: 4, trainingOnly: false, validKB: true,  validLB: false, sortOrder: 63 },
  { displayName: '4x100m Lagen Staffel',    stroke: Stroke.LAGEN,    distanceM: 100, isRelay: true, relayLegs: 4, trainingOnly: false, validKB: true,  validLB: true,  sortOrder: 64 },

  // --- Trainingsdisziplinen (trainingOnly = true) ---
  { displayName: '25m Rücken Beine (ohne Brett)',  stroke: Stroke.RUECKEN_BEINE_OHNE_BRETT, distanceM: 25,  isRelay: false, relayLegs: null, trainingOnly: true, validKB: true, validLB: true, sortOrder: 70 },
  { displayName: '50m Rücken Beine (ohne Brett)',  stroke: Stroke.RUECKEN_BEINE_OHNE_BRETT, distanceM: 50,  isRelay: false, relayLegs: null, trainingOnly: true, validKB: true, validLB: true, sortOrder: 71 },
  { displayName: '100m Rücken Beine (ohne Brett)', stroke: Stroke.RUECKEN_BEINE_OHNE_BRETT, distanceM: 100, isRelay: false, relayLegs: null, trainingOnly: true, validKB: true, validLB: true, sortOrder: 72 },
  { displayName: '200m Rücken Beine (ohne Brett)', stroke: Stroke.RUECKEN_BEINE_OHNE_BRETT, distanceM: 200, isRelay: false, relayLegs: null, trainingOnly: true, validKB: true, validLB: true, sortOrder: 73 },

  { displayName: '25m Rücken Beine (mit Brett)',  stroke: Stroke.RUECKEN_BEINE_MIT_BRETT, distanceM: 25,  isRelay: false, relayLegs: null, trainingOnly: true, validKB: true, validLB: true, sortOrder: 74 },
  { displayName: '50m Rücken Beine (mit Brett)',  stroke: Stroke.RUECKEN_BEINE_MIT_BRETT, distanceM: 50,  isRelay: false, relayLegs: null, trainingOnly: true, validKB: true, validLB: true, sortOrder: 75 },
  { displayName: '100m Rücken Beine (mit Brett)', stroke: Stroke.RUECKEN_BEINE_MIT_BRETT, distanceM: 100, isRelay: false, relayLegs: null, trainingOnly: true, validKB: true, validLB: true, sortOrder: 76 },
  { displayName: '200m Rücken Beine (mit Brett)', stroke: Stroke.RUECKEN_BEINE_MIT_BRETT, distanceM: 200, isRelay: false, relayLegs: null, trainingOnly: true, validKB: true, validLB: true, sortOrder: 77 },

  { displayName: '25m Kraul Beine (mit Brett)',  stroke: Stroke.KRAUL_BEINE_MIT_BRETT, distanceM: 25,  isRelay: false, relayLegs: null, trainingOnly: true, validKB: true, validLB: true, sortOrder: 78 },
  { displayName: '50m Kraul Beine (mit Brett)',  stroke: Stroke.KRAUL_BEINE_MIT_BRETT, distanceM: 50,  isRelay: false, relayLegs: null, trainingOnly: true, validKB: true, validLB: true, sortOrder: 79 },
  { displayName: '100m Kraul Beine (mit Brett)', stroke: Stroke.KRAUL_BEINE_MIT_BRETT, distanceM: 100, isRelay: false, relayLegs: null, trainingOnly: true, validKB: true, validLB: true, sortOrder: 80 },
  { displayName: '200m Kraul Beine (mit Brett)', stroke: Stroke.KRAUL_BEINE_MIT_BRETT, distanceM: 200, isRelay: false, relayLegs: null, trainingOnly: true, validKB: true, validLB: true, sortOrder: 81 },
]

async function main() {
  console.log(`Seeding ${eventTypes.length} EventTypes...`)

  for (const et of eventTypes) {
    await db.eventType.upsert({
      where: {
        stroke_distanceM_isRelay: {
          stroke: et.stroke,
          distanceM: et.distanceM,
          isRelay: et.isRelay,
        },
      },
      create: et,
      update: {
        displayName:  et.displayName,
        relayLegs:    et.relayLegs,
        trainingOnly: et.trainingOnly,
        validKB:      et.validKB,
        validLB:      et.validLB,
        sortOrder:    et.sortOrder,
      },
    })
  }

  console.log('Seeding abgeschlossen.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
