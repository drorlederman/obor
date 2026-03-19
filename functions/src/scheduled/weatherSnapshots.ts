import { FieldValue, getFirestore } from 'firebase-admin/firestore'
import { onCall } from 'firebase-functions/v2/https'
import { onSchedule } from 'firebase-functions/v2/scheduler'
import { ensureAdmin } from '../shared/auth'
import { Errors } from '../shared/errors'

interface GeocodeResponse {
  results?: Array<{
    latitude: number
    longitude: number
    name: string
    country?: string
  }>
}

interface WindResponse {
  hourly?: {
    time: string[]
    wind_speed_10m: Array<number | null>
    wind_gusts_10m: Array<number | null>
    wind_direction_10m: Array<number | null>
  }
}

interface MarineResponse {
  hourly?: {
    time: string[]
    wave_height: Array<number | null>
    wave_direction: Array<number | null>
    wave_period: Array<number | null>
  }
}

interface TimelinePoint {
  at: string
  windKnots: number
  gustKnots: number
  waveHeightMeters: number
  waveDirectionDegrees: number
  wavePeriodSeconds: number
}

interface RefreshWeatherSnapshotInput {
  boatId: string
}

function toNumber(value: number | null | undefined) {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

async function geocodeMarina(name: string): Promise<{ lat: number; lon: number; label: string } | null> {
  const geocodeUrl =
    `https://geocoding-api.open-meteo.com/v1/search?count=1&language=he&format=json&name=${encodeURIComponent(name)}`

  try {
    const response = await fetch(geocodeUrl)
    if (!response.ok) return null

    const json = (await response.json()) as GeocodeResponse
    const first = json.results?.[0]
    if (!first) return null

    const label = [first.name, first.country].filter(Boolean).join(', ')
    return { lat: first.latitude, lon: first.longitude, label: label || name }
  } catch {
    return null
  }
}

async function fetchWind(lat: number, lon: number): Promise<WindResponse | null> {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    '&hourly=wind_speed_10m,wind_gusts_10m,wind_direction_10m' +
    '&wind_speed_unit=kn&forecast_days=2&timezone=auto'

  try {
    const response = await fetch(url)
    if (!response.ok) return null
    return (await response.json()) as WindResponse
  } catch {
    return null
  }
}

async function fetchMarine(lat: number, lon: number): Promise<MarineResponse | null> {
  const url =
    `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lon}` +
    '&hourly=wave_height,wave_direction,wave_period&forecast_days=2&timezone=auto'

  try {
    const response = await fetch(url)
    if (!response.ok) return null
    return (await response.json()) as MarineResponse
  } catch {
    return null
  }
}

function buildTimeline(wind: WindResponse, marine: MarineResponse): TimelinePoint[] {
  const windHourly = wind.hourly
  if (!windHourly?.time?.length) return []

  const marineByTime = new Map<
    string,
    { waveHeightMeters: number; waveDirectionDegrees: number; wavePeriodSeconds: number }
  >()

  const marineHourly = marine.hourly
  if (marineHourly?.time?.length) {
    marineHourly.time.forEach((time, index) => {
      marineByTime.set(time, {
        waveHeightMeters: toNumber(marineHourly.wave_height?.[index]),
        waveDirectionDegrees: toNumber(marineHourly.wave_direction?.[index]),
        wavePeriodSeconds: toNumber(marineHourly.wave_period?.[index]),
      })
    })
  }

  const merged = windHourly.time.map((time, index) => {
    const wave = marineByTime.get(time)
    return {
      at: new Date(time).toISOString(),
      windKnots: toNumber(windHourly.wind_speed_10m?.[index]),
      gustKnots: toNumber(windHourly.wind_gusts_10m?.[index]),
      waveHeightMeters: wave?.waveHeightMeters ?? 0,
      waveDirectionDegrees: wave?.waveDirectionDegrees ?? 0,
      wavePeriodSeconds: wave?.wavePeriodSeconds ?? 0,
    }
  })

  const now = Date.now()
  const currentIndex = merged.findIndex((point) => new Date(point.at).getTime() >= now)
  const start = currentIndex === -1 ? 0 : currentIndex
  return merged.slice(start, start + 12)
}

async function updateBoatWeatherSnapshot(boatId: string): Promise<'updated' | 'skipped'> {
  const db = getFirestore()

  const boatSnap = await db.doc(`boats/${boatId}`).get()
  if (!boatSnap.exists) return 'skipped'

  const boatData = boatSnap.data() as { homeMarina?: string; status?: string } | undefined
  const homeMarina = (boatData?.homeMarina ?? '').trim()
  const boatStatus = boatData?.status ?? 'active'

  if (!homeMarina) return 'skipped'
  if (!['active', 'maintenance'].includes(boatStatus)) return 'skipped'

  const weatherSettingsRef = db.doc(`system_settings/${boatId}_weather`)
  const weatherSettingsSnap = await weatherSettingsRef.get()
  const weatherSettings = weatherSettingsSnap.data() ?? {}

  let lat = weatherSettings.locationLat as number | null | undefined
  let lon = weatherSettings.locationLng as number | null | undefined
  let locationLabel = (weatherSettings.locationLabel as string | undefined) ?? homeMarina

  if (typeof lat !== 'number' || typeof lon !== 'number') {
    const geocode = await geocodeMarina(homeMarina)
    if (!geocode) return 'skipped'
    lat = geocode.lat
    lon = geocode.lon
    locationLabel = geocode.label

    await weatherSettingsRef.set(
      {
        boatId,
        type: 'weather',
        locationLat: lat,
        locationLng: lon,
        locationLabel,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    )
  }

  const [wind, marine] = await Promise.all([fetchWind(lat, lon), fetchMarine(lat, lon)])
  if (!wind || !marine) return 'skipped'

  const timeline = buildTimeline(wind, marine)
  if (timeline.length === 0) return 'skipped'

  const generatedAtIso = new Date().toISOString()
  const current = timeline[0]

  await db.doc(`weather_snapshots/${boatId}`).set(
    {
      boatId,
      source: 'open-meteo',
      homeMarina,
      location: {
        lat,
        lon,
        label: locationLabel,
      },
      current,
      timeline,
      generatedAt: generatedAtIso,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  )

  return 'updated'
}

export const weatherSnapshots = onSchedule('every 60 minutes', async () => {
  const db = getFirestore()

  const boatsSnap = await db
    .collection('boats')
    .where('status', 'in', ['active', 'maintenance'])
    .get()

  if (boatsSnap.empty) return

  let updatedCount = 0

  await Promise.allSettled(
    boatsSnap.docs.map(async (boatDoc) => {
      const boatId = boatDoc.id
      const result = await updateBoatWeatherSnapshot(boatId)
      if (result === 'updated') {
        updatedCount++
      }
    }),
  )

  console.log(`weatherSnapshots: updated ${updatedCount} boats`)
})

export const refreshWeatherSnapshotNow = onCall<RefreshWeatherSnapshotInput>(async (request) => {
  const boatId = (request.data?.boatId as string | undefined) ?? ''

  if (!boatId?.trim()) {
    throw Errors.invalidArgument('מזהה סירה חסר')
  }

  await ensureAdmin(request, boatId)

  try {
    const result = await updateBoatWeatherSnapshot(boatId)
    if (result !== 'updated') {
      throw Errors.preconditionFailed('לא ניתן לרענן תחזית. בדוק שמוגדרת מרינה תקינה לסירה')
    }
  } catch (err) {
    if ((err as { code?: string } | null)?.code) {
      throw err
    }
    throw Errors.internal('שגיאה ברענון נתוני מזג האוויר, נסה שוב בעוד כמה דקות')
  }

  return { success: true }
})
