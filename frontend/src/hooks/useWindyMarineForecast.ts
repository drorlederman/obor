import { useQuery } from '@tanstack/react-query'

interface WindyPointForecastResponse {
  ts: number[]
  'wind_u-surface'?: Array<number | null>
  'wind_v-surface'?: Array<number | null>
  'gust-surface'?: Array<number | null>
  'waves_height-surface'?: Array<number | null>
  'waves_period-surface'?: Array<number | null>
  'waves_direction-surface'?: Array<number | null>
}

interface ForecastPoint {
  at: Date
  windKnots: number
  gustKnots: number
  waveHeightMeters: number
  wavePeriodSeconds: number
  waveDirectionDegrees: number
}

export interface WindyMarineForecast {
  locationLabel: string
  current: ForecastPoint
  timeline: ForecastPoint[]
}

const WINDY_ENDPOINT = 'https://api.windy.com/api/point-forecast/v2'
const WINDY_API_KEY = (import.meta.env.VITE_WINDY_API_KEY as string | undefined)?.trim()

function msToKnots(speedMs: number) {
  return speedMs * 1.94384
}

function toSafeNumber(value: number | null | undefined) {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

function buildPoint(data: WindyPointForecastResponse, index: number): ForecastPoint {
  const u = toSafeNumber(data['wind_u-surface']?.[index])
  const v = toSafeNumber(data['wind_v-surface']?.[index])
  const windMs = Math.hypot(u, v)

  return {
    at: new Date(data.ts[index]),
    windKnots: msToKnots(windMs),
    gustKnots: msToKnots(toSafeNumber(data['gust-surface']?.[index])),
    waveHeightMeters: toSafeNumber(data['waves_height-surface']?.[index]),
    wavePeriodSeconds: toSafeNumber(data['waves_period-surface']?.[index]),
    waveDirectionDegrees: toSafeNumber(data['waves_direction-surface']?.[index]),
  }
}

async function geocodeMarina(name: string): Promise<{ lat: number; lon: number; label: string }> {
  const url =
    `https://geocoding-api.open-meteo.com/v1/search?count=1&language=he&format=json&name=${encodeURIComponent(name)}`

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error('לא הצלחנו לאתר את מיקום המרינה')
  }

  const json = (await response.json()) as {
    results?: Array<{
      latitude: number
      longitude: number
      name: string
      country?: string
    }>
  }

  const first = json.results?.[0]
  if (!first) {
    throw new Error('לא נמצא מיקום מתאים למרינה שהוגדרה')
  }

  const label = [first.name, first.country].filter(Boolean).join(', ')
  return { lat: first.latitude, lon: first.longitude, label: label || name }
}

async function fetchWindyForecast(lat: number, lon: number): Promise<WindyPointForecastResponse> {
  if (!WINDY_API_KEY) {
    throw new Error('חסר מפתח Windy. יש להגדיר VITE_WINDY_API_KEY בקובץ הסביבה')
  }

  const response = await fetch(WINDY_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      lat,
      lon,
      model: 'gfsWave',
      parameters: ['wind', 'windGust', 'waves'],
      levels: ['surface'],
      key: WINDY_API_KEY,
    }),
  })

  if (!response.ok) {
    throw new Error('Windy לא החזיר תחזית תקינה')
  }

  return (await response.json()) as WindyPointForecastResponse
}

export function useWindyMarineForecast(marinaName: string | null | undefined) {
  return useQuery<WindyMarineForecast>({
    queryKey: ['windy-marine-forecast', marinaName],
    enabled: !!marinaName?.trim(),
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const marina = marinaName!.trim()
      const location = await geocodeMarina(marina)
      const forecast = await fetchWindyForecast(location.lat, location.lon)

      if (!forecast.ts?.length) {
        throw new Error('לא התקבלו נקודות תחזית מ־Windy')
      }

      const now = Date.now()
      const firstFutureIndex = forecast.ts.findIndex((ts) => ts >= now)
      const currentIndex = firstFutureIndex === -1 ? 0 : firstFutureIndex

      const timelineIndexes = forecast.ts
        .map((_, index) => index)
        .slice(currentIndex, currentIndex + 8)

      if (timelineIndexes.length === 0) {
        throw new Error('אין נתוני תחזית זמינים לשעות הקרובות')
      }

      const timeline = timelineIndexes.map((index) => buildPoint(forecast, index))

      return {
        locationLabel: location.label,
        current: timeline[0],
        timeline,
      }
    },
  })
}
