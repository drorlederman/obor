import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { doc, getDoc } from 'firebase/firestore'
import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { useUpcomingBookings } from '@/hooks/useBookings'
import { useMarineWeatherSnapshot } from '@/hooks/useMarineWeatherSnapshot'
import { usePartner } from '@/hooks/usePartner'
import { useBoat } from '@/context/BoatContext'
import { useAuth } from '@/context/AuthContext'
import { refreshWeatherSnapshotNowFn } from '@/services/functions'
import { db } from '@/lib/firebase'
import BookingCard from '@/features/bookings/components/BookingCard'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ErrorState from '@/components/ui/ErrorState'
import EmptyState from '@/components/ui/EmptyState'

function CreditCard({
  label,
  balance,
  loading,
}: {
  label: string
  balance: number
  loading: boolean
}) {
  return (
    <div className="card flex-1 text-center">
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</p>
      {loading ? (
        <div className="flex justify-center py-1">
          <LoadingSpinner size="sm" />
        </div>
      ) : (
        <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">{balance}</p>
      )}
      <p className="text-xs text-gray-400 dark:text-gray-500">מטבעות</p>
    </div>
  )
}

function formatHour(date: Date) {
  return date.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
}

function formatCompass(degrees: number) {
  const normalized = ((degrees % 360) + 360) % 360
  if (normalized < 22.5 || normalized >= 337.5) return 'צפון'
  if (normalized < 67.5) return 'צפון-מזרח'
  if (normalized < 112.5) return 'מזרח'
  if (normalized < 157.5) return 'דרום-מזרח'
  if (normalized < 202.5) return 'דרום'
  if (normalized < 247.5) return 'דרום-מערב'
  if (normalized < 292.5) return 'מערב'
  return 'צפון-מערב'
}

function sourceLabel(source: string) {
  if (source === 'open-meteo') return 'שירות אופן-מטאו דרך שרת האפליקציה'
  if (source === 'windy') return 'שירות תחזית ימית דרך שרת האפליקציה'
  return 'שירות תחזית ימית דרך שרת האפליקציה'
}

function windColorClass(knots: number) {
  if (knots >= 22) return 'bg-red-500 dark:bg-red-400'
  if (knots >= 16) return 'bg-amber-500 dark:bg-amber-400'
  if (knots >= 10) return 'bg-emerald-500 dark:bg-emerald-400'
  return 'bg-sky-500 dark:bg-sky-400'
}

export default function DashboardPage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { activeBoatId, isAdmin } = useBoat()
  const [refreshingWeather, setRefreshingWeather] = useState(false)
  const { data: upcomingBookings, isLoading: loadingBookings } = useUpcomingBookings(3)
  const { data: partner, isLoading: loadingPartner } = usePartner()
  const { data: weatherLocation, isLoading: loadingWeatherLocation } = useQuery<string | null>({
    queryKey: ['dashboard-weather-location', activeBoatId],
    enabled: !!activeBoatId,
    queryFn: async () => {
      const boatSnap = await getDoc(doc(db, 'boats', activeBoatId!))
      if (!boatSnap.exists()) return null
      return (boatSnap.data().homeMarina as string | null) ?? null
    },
  })
  const {
    data: marineSnapshot,
    isLoading: loadingMarineSnapshot,
    isError: marineSnapshotError,
  } = useMarineWeatherSnapshot()

  const firstName = user?.displayName?.split(' ')[0] ?? 'שותף'

  async function handleRefreshWeatherNow() {
    if (!activeBoatId) return
    setRefreshingWeather(true)
    try {
      await refreshWeatherSnapshotNowFn({ boatId: activeBoatId })
      await queryClient.invalidateQueries({ queryKey: ['marine-weather-snapshot', activeBoatId] })
      toast.success('התחזית רועננה בהצלחה')
    } catch (error) {
      const err = error as { code?: string; message?: string } | null
      if (err?.code === 'functions/permission-denied') {
        toast.error('רק מנהל סירה יכול לרענן תחזית ידנית')
      } else if (err?.code === 'functions/failed-precondition') {
        toast.error('לא ניתן לרענן תחזית. בדוק שמוגדרת מרינה תקינה')
      } else {
        toast.error(err?.message?.trim() || 'שגיאה ברענון התחזית')
      }
    } finally {
      setRefreshingWeather(false)
    }
  }

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-6">
      {/* Greeting */}
      <div className="pt-2">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          שלום, {firstName} 👋
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          {new Date().toLocaleDateString('he-IL', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </p>
      </div>

      {/* Credit balances */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
          יתרת מטבעות
        </h2>
        <div className="flex gap-3">
          <CreditCard
            label="ימי חול"
            balance={partner?.weekdayCreditsBalance ?? 0}
            loading={loadingPartner}
          />
          <CreditCard
            label="סוף שבוע"
            balance={partner?.weekendCreditsBalance ?? 0}
            loading={loadingPartner}
          />
        </div>
      </section>

      {/* Marine weather */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            מזג אוויר ימי
          </h2>
          <div className="flex items-center gap-3">
            {isAdmin && weatherLocation && (
              <button
                onClick={handleRefreshWeatherNow}
                disabled={refreshingWeather}
                className="text-xs text-emerald-700 dark:text-emerald-300 hover:underline disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {refreshingWeather ? 'מרענן...' : 'רענון עכשיו'}
              </button>
            )}
            <Link
              to="/settings/weather"
              className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
            >
              הגדרות מזג אוויר
            </Link>
          </div>
        </div>

        {loadingWeatherLocation || loadingMarineSnapshot ? (
          <div className="card flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : !weatherLocation ? (
          <div className="card">
            <EmptyState
              title="אין מיקום מזג אוויר"
              description='הגדר מרינה במסך "הגדרות מזג אוויר" כדי למשוך תחזית ימית'
              actionLabel="להגדרת מרינה"
              onAction={() => navigate('/settings/weather')}
            />
          </div>
        ) : marineSnapshotError ? (
          <div className="card">
            <ErrorState message="שגיאה בטעינת תחזית ימית" />
          </div>
        ) : !marineSnapshot ? (
          <div className="card">
            <EmptyState
              title="התחזית עדיין מתעדכנת"
              description="המערכת מושכת נתונים משירות מזג האוויר אחת לשעה. נסה שוב בעוד כמה דקות."
            />
          </div>
        ) : (
          <div className="card space-y-5 bg-sky-50/70 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs text-sky-700 dark:text-sky-300">תחנה פעילה</p>
                <p className="text-sm font-semibold text-sky-900 dark:text-sky-100">
                  {marineSnapshot.locationLabel}
                </p>
              </div>
              <p className="text-xs text-sky-700 dark:text-sky-300">
                עודכן: {formatHour(marineSnapshot.generatedAt)}
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div className="rounded-xl bg-white/80 dark:bg-slate-900/50 p-3 border border-sky-100 dark:border-sky-900">
                <p className="text-xs text-gray-500 dark:text-gray-400">רוח ממוצעת</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {marineSnapshot.current.windKnots.toFixed(1)} קשר
                </p>
              </div>
              <div className="rounded-xl bg-white/80 dark:bg-slate-900/50 p-3 border border-sky-100 dark:border-sky-900">
                <p className="text-xs text-gray-500 dark:text-gray-400">משב רוח</p>
                <p className="text-xl font-bold text-amber-700 dark:text-amber-300">
                  {marineSnapshot.current.gustKnots.toFixed(1)} קשר
                </p>
              </div>
              <div className="rounded-xl bg-white/80 dark:bg-slate-900/50 p-3 border border-sky-100 dark:border-sky-900">
                <p className="text-xs text-gray-500 dark:text-gray-400">גובה גל</p>
                <p className="text-xl font-bold text-blue-700 dark:text-blue-300">
                  {marineSnapshot.current.waveHeightMeters.toFixed(1)} מ'
                </p>
              </div>
              <div className="rounded-xl bg-white/80 dark:bg-slate-900/50 p-3 border border-sky-100 dark:border-sky-900">
                <p className="text-xs text-gray-500 dark:text-gray-400">כיוון גל</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {formatCompass(marineSnapshot.current.waveDirectionDegrees)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  מחזור {marineSnapshot.current.wavePeriodSeconds.toFixed(1)} שנ'
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <p className="text-xs font-medium text-sky-800 dark:text-sky-200">תחזית לשעות הקרובות</p>
              {marineSnapshot.timeline.map((point) => (
                <div
                  key={point.at.getTime()}
                  className="grid grid-cols-[64px_1fr_auto_auto] items-center gap-2 rounded-lg bg-white/70 dark:bg-slate-900/40 px-2.5 py-1.5 border border-sky-100 dark:border-sky-900"
                >
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-300">{formatHour(point.at)}</p>
                  <div className="h-2 rounded-full bg-sky-100 dark:bg-sky-950 overflow-hidden">
                    <div
                      className="h-full bg-sky-500 dark:bg-sky-400"
                      style={{ width: `${Math.min(100, point.waveHeightMeters * 25)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-700 dark:text-gray-200">{point.windKnots.toFixed(1)} קשר</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{point.waveHeightMeters.toFixed(1)} מ'</p>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-sky-800 dark:text-sky-200">תחזית 12 שעות — עוצמת רוח (קשר)</p>
              <div className="rounded-xl bg-white/80 dark:bg-slate-900/40 p-3 border border-sky-100 dark:border-sky-900 space-y-3">
                {(() => {
                  const points = marineSnapshot.timeline.slice(0, 12)
                  const maxKnots = Math.max(12, ...points.map((point) => point.windKnots))
                  const topScale = Math.ceil(maxKnots / 2) * 2

                  return (
                    <>
                      <div className="flex items-center justify-between text-[10px] text-gray-500 dark:text-gray-400 px-1">
                        <span>{topScale} קשר</span>
                        <span>{Math.round(topScale / 2)} קשר</span>
                        <span>0</span>
                      </div>
                      <div className="grid grid-cols-6 md:grid-cols-12 gap-1.5 items-end h-28 border-b border-dashed border-sky-100 dark:border-sky-900 pb-2">
                        {points.map((point) => {
                          const height = Math.max(10, Math.min(108, (point.windKnots / topScale) * 108))
                          const barColor = windColorClass(point.windKnots)
                          return (
                            <div key={`wind-bar-${point.at.getTime()}`} className="flex flex-col items-center gap-1">
                              <div
                                className={`w-full rounded-md transition-all ${barColor}`}
                                style={{ height: `${height}px` }}
                                title={`${point.windKnots.toFixed(1)} קשר`}
                              />
                              <p className="text-[10px] text-gray-600 dark:text-gray-300">{formatHour(point.at)}</p>
                              <p className="text-[10px] font-medium text-gray-700 dark:text-gray-200">
                                {point.windKnots.toFixed(0)}
                              </p>
                            </div>
                          )
                        })}
                      </div>
                      <div className="flex items-center justify-center gap-3 text-[10px] text-gray-600 dark:text-gray-300">
                        <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-sky-500 dark:bg-sky-400" />קל</span>
                        <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400" />בינוני</span>
                        <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500 dark:bg-amber-400" />חזק</span>
                        <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 dark:bg-red-400" />חזק מאוד</span>
                      </div>
                    </>
                  )
                })()}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-sky-800 dark:text-sky-200">תחזית 12 שעות — כיוון רוח</p>
              <div className="rounded-xl bg-white/80 dark:bg-slate-900/40 p-3 border border-sky-100 dark:border-sky-900">
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                  {marineSnapshot.timeline.slice(0, 12).map((point) => {
                    const windLevelClass = windColorClass(point.windKnots).replace('bg-', 'text-')
                    return (
                      <div
                        key={`wind-dir-${point.at.getTime()}`}
                        className="rounded-lg border border-sky-100 dark:border-sky-900 bg-white/90 dark:bg-slate-900/55 p-2 text-center space-y-1.5"
                      >
                        <p className="text-[10px] text-gray-600 dark:text-gray-300">{formatHour(point.at)}</p>
                        <div className="flex justify-center">
                          <span
                            className={`inline-flex w-7 h-7 items-center justify-center ${windLevelClass}`}
                            style={{ transform: `rotate(${point.windDirectionDegrees}deg)` }}
                            aria-hidden
                          >
                            ↑
                          </span>
                        </div>
                        <p className="text-[11px] font-medium text-gray-700 dark:text-gray-200">{point.windKnots.toFixed(0)} קשר</p>
                        <p className="text-[11px] text-gray-600 dark:text-gray-300">{formatCompass(point.windDirectionDegrees)}</p>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-sky-800 dark:text-sky-200">תחזית 12 שעות — גובה גל (מטר)</p>
              <div className="rounded-xl bg-white/80 dark:bg-slate-900/40 p-3 border border-sky-100 dark:border-sky-900">
                <div className="grid grid-cols-6 md:grid-cols-12 gap-1.5 items-end h-20">
                  {marineSnapshot.timeline.slice(0, 12).map((point) => {
                    const height = Math.max(8, Math.min(76, point.waveHeightMeters * 36))
                    return (
                      <div key={`wave-bar-${point.at.getTime()}`} className="flex flex-col items-center gap-1">
                        <div
                          className="w-full rounded-md bg-indigo-500/80 dark:bg-indigo-400 transition-all"
                          style={{ height: `${height}px` }}
                          title={`${point.waveHeightMeters.toFixed(1)} מטר`}
                        />
                        <p className="text-[10px] text-gray-600 dark:text-gray-300">{formatHour(point.at)}</p>
                        <p className="text-[10px] font-medium text-gray-700 dark:text-gray-200">
                          {point.waveHeightMeters.toFixed(1)}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            <p className="text-xs text-sky-700 dark:text-sky-300">
              מקור הנתונים: {sourceLabel(marineSnapshot.source)}
            </p>
          </div>
        )}
      </section>

      {/* Quick actions */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
          פעולות מהירות
        </h2>
        <div className="flex gap-3">
          <Link to="/bookings/new" className="btn-primary flex-1 text-center text-sm">
            + הזמנה חדשה
          </Link>
          <Link to="/bookings" className="btn-secondary flex-1 text-center text-sm">
            יומן הזמנות
          </Link>
        </div>
      </section>

      {/* Upcoming bookings */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            הזמנות קרובות
          </h2>
          <Link
            to="/bookings"
            className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
          >
            כל ההזמנות
          </Link>
        </div>

        {loadingBookings ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner size="md" />
          </div>
        ) : upcomingBookings && upcomingBookings.length > 0 ? (
          <div className="space-y-2">
            {upcomingBookings.map((b) => (
              <BookingCard key={b.id} booking={b} showDate />
            ))}
          </div>
        ) : (
          <div className="card">
            <EmptyState
              title="אין הזמנות קרובות"
              description="אפשר ליצור הזמנה חדשה כבר עכשיו"
              actionLabel="להזמנה חדשה"
              onAction={() => navigate('/bookings/new')}
            />
          </div>
        )}
      </section>
    </div>
  )
}
