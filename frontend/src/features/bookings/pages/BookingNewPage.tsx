import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { bookingSchema, type BookingFormData } from '@/features/bookings/schemas/booking.schema'
import { createBookingFn } from '@/services/functions'
import type { BookingType } from '@/types'
import { usePartner } from '@/hooks/usePartner'
import { useBoat } from '@/context/BoatContext'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { BOOKING_TYPE_LABELS } from '@/features/bookings/components/BookingTypeChip'

// Credit cost threshold (mirrors server logic)
const WEEKEND_THRESHOLD_HOURS = 36
const DAY_CREDIT_COST = 1
const WEEKEND_CREDIT_COST = 2

function computeCreditPreview(startTime: string, endTime: string) {
  if (!startTime || !endTime) return null
  const start = new Date(startTime)
  const end = new Date(endTime)
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) return null
  const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
  const creditType = durationHours >= WEEKEND_THRESHOLD_HOURS ? 'weekend' : 'weekday'
  const cost = creditType === 'weekend' ? WEEKEND_CREDIT_COST : DAY_CREDIT_COST
  return { creditType, cost, durationHours }
}

const ALL_TYPES: BookingType[] = ['private_sail', 'partner_sail', 'marina_use', 'maintenance_block']

function toDateTimeLocalValue(date: Date) {
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`
}

export default function BookingNewPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const queryClient = useQueryClient()
  const { activeBoatId, isScheduler } = useBoat()
  const { data: partner, isLoading: loadingPartner } = usePartner()

  const startFromCalendar = searchParams.get('start')
  const endFromCalendar = searchParams.get('end')
  const parsedStart = startFromCalendar ? new Date(startFromCalendar) : null
  const parsedEnd = endFromCalendar ? new Date(endFromCalendar) : null
  const defaultStart = parsedStart && !Number.isNaN(parsedStart.getTime()) ? toDateTimeLocalValue(parsedStart) : ''
  const defaultEnd = parsedEnd && !Number.isNaN(parsedEnd.getTime()) ? toDateTimeLocalValue(parsedEnd) : ''

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: { type: 'private_sail', notes: '', startTime: defaultStart, endTime: defaultEnd },
  })

  const watchType = watch('type')
  const watchStart = watch('startTime')
  const watchEnd = watch('endTime')
  const creditPreview = computeCreditPreview(watchStart, watchEnd)

  const availableTypes = ALL_TYPES.filter(
    (t) => t !== 'maintenance_block' || isScheduler,
  )

  async function onSubmit(data: BookingFormData) {
    if (!partner || !activeBoatId) {
      toast.error('לא ניתן לבצע הזמנה — פרטי שותף חסרים')
      return
    }
    try {
      await createBookingFn({
        boatId: activeBoatId,
        ownerPartnerId: partner.id,
        type: data.type,
        title: data.title,
        notes: data.notes ?? null,
        startTime: new Date(data.startTime).toISOString(),
        endTime: new Date(data.endTime).toISOString(),
      })
      toast.success('ההזמנה נוצרה בהצלחה')
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      queryClient.invalidateQueries({ queryKey: ['bookings-upcoming'] })
      navigate('/bookings')
    } catch (err: unknown) {
      const msg =
        (err as { message?: string })?.message ?? 'שגיאה ביצירת ההזמנה'
      toast.error(msg)
    }
  }

  if (loadingPartner) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!partner) {
    return (
      <div className="p-4 text-center">
        <p className="text-sm text-red-500">לא נמצא פרופיל שותף — פנה למנהל</p>
      </div>
    )
  }

  return (
    <div className="p-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 pt-2 mb-6">
        <Link
          to="/bookings"
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"
          aria-label="חזור"
        >
          <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M9 18l6-6-6-6" />
          </svg>
        </Link>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">הזמנה חדשה</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Booking type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            סוג הזמנה
          </label>
          <div className="grid grid-cols-2 gap-2">
            {availableTypes.map((type) => (
              <label
                key={type}
                className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-colors ${
                  watchType === type
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <input
                  type="radio"
                  value={type}
                  {...register('type')}
                  className="sr-only"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {BOOKING_TYPE_LABELS[type]}
                </span>
              </label>
            ))}
          </div>
          {errors.type && (
            <p className="mt-1 text-xs text-red-500">{errors.type.message}</p>
          )}
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            כותרת
          </label>
          <input
            {...register('title')}
            placeholder="לדוגמה: שיט בוקר"
            className="input"
          />
          {errors.title && (
            <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>
          )}
        </div>

        {/* Start time */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            זמן התחלה
          </label>
          <input
            type="datetime-local"
            {...register('startTime')}
            step={1800}
            className="input"
          />
          {errors.startTime && (
            <p className="mt-1 text-xs text-red-500">{errors.startTime.message}</p>
          )}
        </div>

        {/* End time */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            זמן סיום
          </label>
          <input
            type="datetime-local"
            {...register('endTime')}
            step={1800}
            className="input"
          />
          {errors.endTime && (
            <p className="mt-1 text-xs text-red-500">{errors.endTime.message}</p>
          )}
        </div>

        {/* Credit preview */}
        {creditPreview && watchType !== 'maintenance_block' && (
          <div
            className={`rounded-xl p-3 text-sm ${
              creditPreview.cost > (
                creditPreview.creditType === 'weekend'
                  ? partner.weekendCreditsBalance
                  : partner.weekdayCreditsBalance
              )
                ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                : 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
            }`}
          >
            <p className="font-medium">
              עלות: {creditPreview.cost} מטבע{' '}
              {creditPreview.creditType === 'weekend' ? 'סוף שבוע' : 'יום חול'}
            </p>
            <p className="text-xs mt-0.5 opacity-80">
              משך: {Math.round(creditPreview.durationHours * 10) / 10} שעות •
              יתרה:{' '}
              {creditPreview.creditType === 'weekend'
                ? partner.weekendCreditsBalance
                : partner.weekdayCreditsBalance}{' '}
              מטבעות
            </p>
            {creditPreview.cost >
              (creditPreview.creditType === 'weekend'
                ? partner.weekendCreditsBalance
                : partner.weekdayCreditsBalance) && (
              <p className="text-xs font-semibold mt-1">⚠️ יתרה לא מספיקה</p>
            )}
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            הערות (אופציונלי)
          </label>
          <textarea
            {...register('notes')}
            placeholder="הוסף הערות לגבי ההזמנה..."
            rows={3}
            className="input resize-none"
          />
          {errors.notes && (
            <p className="mt-1 text-xs text-red-500">{errors.notes.message}</p>
          )}
        </div>

        {/* Submit */}
        <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <LoadingSpinner size="sm" />
              שומר...
            </span>
          ) : (
            'צור הזמנה'
          )}
        </button>
      </form>
    </div>
  )
}
