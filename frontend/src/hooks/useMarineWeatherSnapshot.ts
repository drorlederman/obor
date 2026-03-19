import { doc, getDoc, type Timestamp } from 'firebase/firestore'
import { useQuery } from '@tanstack/react-query'
import { db } from '@/lib/firebase'
import { useBoat } from '@/context/BoatContext'

interface TimelinePoint {
  at: Date
  windKnots: number
  gustKnots: number
  waveHeightMeters: number
  waveDirectionDegrees: number
  wavePeriodSeconds: number
}

export interface MarineWeatherSnapshot {
  boatId: string
  source: string
  homeMarina: string
  locationLabel: string
  current: TimelinePoint
  timeline: TimelinePoint[]
  generatedAt: Date
}

function toTimelinePoint(raw: unknown): TimelinePoint {
  const data = (raw ?? {}) as Record<string, unknown>
  return {
    at: new Date(String(data.at ?? new Date().toISOString())),
    windKnots: Number(data.windKnots ?? 0),
    gustKnots: Number(data.gustKnots ?? 0),
    waveHeightMeters: Number(data.waveHeightMeters ?? 0),
    waveDirectionDegrees: Number(data.waveDirectionDegrees ?? 0),
    wavePeriodSeconds: Number(data.wavePeriodSeconds ?? 0),
  }
}

export function useMarineWeatherSnapshot() {
  const { activeBoatId } = useBoat()

  return useQuery<MarineWeatherSnapshot | null>({
    queryKey: ['marine-weather-snapshot', activeBoatId],
    enabled: !!activeBoatId,
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const boatId = activeBoatId!
      const snapshotRef = doc(db, 'weather_snapshots', boatId)
      const snapshotSnap = await getDoc(snapshotRef)
      if (!snapshotSnap.exists()) return null

      const data = snapshotSnap.data() as {
        source?: string
        homeMarina?: string
        location?: { label?: string }
        current?: unknown
        timeline?: unknown[]
        generatedAt?: string
        updatedAt?: Timestamp
      }

      const timeline = ((data.timeline as unknown[] | undefined) ?? []).map(toTimelinePoint)
      const current = data.current ? toTimelinePoint(data.current) : timeline[0]
      if (!current) return null

      let generatedAt = new Date()
      if (data.generatedAt) {
        generatedAt = new Date(data.generatedAt)
      } else if (data.updatedAt) {
        generatedAt = data.updatedAt.toDate()
      }

      return {
        boatId,
        source: data.source ?? 'open-meteo',
        homeMarina: data.homeMarina ?? '',
        locationLabel: data.location?.label ?? data.homeMarina ?? 'מרינה',
        current,
        timeline,
        generatedAt,
      }
    },
  })
}
