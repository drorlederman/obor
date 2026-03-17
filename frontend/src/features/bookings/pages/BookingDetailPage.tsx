import { useParams, useNavigate, Link } from 'react-router-dom'
import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { useBookingById } from '@/hooks/useBookings'
import { usePartner } from '@/hooks/usePartner'
import { useAuth } from '@/context/AuthContext'
import { useBoat } from '@/context/BoatContext'
import { cancelBookingFn, joinPartnerSailFn } from '@/services/functions'
import BookingTypeChip from '@/features/bookings/components/BookingTypeChip'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

const STATUS_LABELS: Record<string, string> = {
  active: 'פעיל',
  cancelled: 'בוטל',
  completed: 'הושלם',
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-start gap-4 py-3 border-b border-gray-100 dark:border-gray-800 last:border-0">
      <span className="text-sm text-gray-500 dark:text-gray-400 shrink-0">{label}</span>
      <span className="text-sm font-medium text-gray-900 dark:text-white text-left">{value}</span>
    </div>
  )
}

function formatDate(d: Date) {
  return d.toLocaleString('he-IL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function BookingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const { isScheduler } = useBoat()
  const { data: booking, isLoading, isError } = useBookingById(id)
  const { data: partner } = usePartner()
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [cancelLoading, setCancelLoading] = useState(false)
  const [joinLoading, setJoinLoading] = useState(false)

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (isError || !booking) {
    return (
      <div className="p-4 text-center">
        <p className="text-sm text-red-500 mb-4">ההזמנה לא נמצאה</p>
        <Link to="/bookings" className="btn-secondary text-sm">
          חזור ליומן
        </Link>
      </div>
    )
  }

  const now = new Date()
  const isFuture = booking.startTime > now
  const isOwner = booking.createdByUserId === user?.uid
  const canCancel =
    booking.status === 'active' && (isOwner || isScheduler)
  const canJoin =
    booking.type === 'partner_sail' &&
    booking.status === 'active' &&
    isFuture &&
    !!partner &&
    !booking.participants.includes(partner.id)

  async function handleCancel() {
    if (!id) return
    setCancelLoading(true)
    try {
      await cancelBookingFn({ bookingId: id })
      toast.success('ההזמנה בוטלה בהצלחה')
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      queryClient.invalidateQueries({ queryKey: ['bookings-upcoming'] })
      queryClient.invalidateQueries({ queryKey: ['booking'] })
      queryClient.invalidateQueries({ queryKey: ['partner'] })
      navigate('/bookings', { replace: true })
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message ?? 'שגיאה בביטול ההזמנה')
    } finally {
      setCancelLoading(false)
      setConfirmCancel(false)
    }
  }

  async function handleJoin() {
    if (!id || !partner) return
    setJoinLoading(true)
    try {
      await joinPartnerSailFn({ bookingId: id, partnerPartnerId: partner.id })
      toast.success('הצטרפת לשיט המשותף!')
      queryClient.invalidateQueries({ queryKey: ['booking'] })
      queryClient.invalidateQueries({ queryKey: ['partner'] })
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message ?? 'שגיאה בהצטרפות')
    } finally {
      setJoinLoading(false)
    }
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
        <h1 className="text-xl font-bold text-gray-900 dark:text-white truncate">
          {booking.title}
        </h1>
      </div>

      {/* Status + type */}
      <div className="flex items-center gap-2 mb-4">
        <BookingTypeChip type={booking.type} />
        <span
          className={`text-sm font-medium px-3 py-1 rounded-full ${
            booking.status === 'active'
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
              : booking.status === 'cancelled'
              ? 'bg-gray-100 dark:bg-gray-800 text-gray-500'
              : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
          }`}
        >
          {STATUS_LABELS[booking.status]}
        </span>
      </div>

      {/* Details card */}
      <div className="card mb-4">
        <DetailRow label="התחלה" value={formatDate(booking.startTime)} />
        <DetailRow label="סיום" value={formatDate(booking.endTime)} />
        <DetailRow
          label="משך"
          value={`${Math.round(booking.durationHours * 10) / 10} שעות`}
        />
        {booking.creditType && (
          <>
            <DetailRow
              label="סוג מטבע"
              value={booking.creditType === 'weekday' ? 'יום חול' : 'סוף שבוע'}
            />
            <DetailRow label="מטבעות" value={`${booking.creditsUsed}`} />
          </>
        )}
        {booking.type === 'partner_sail' && booking.participants.length > 0 && (
          <DetailRow
            label="משתתפים"
            value={`${booking.participants.length} שותפים`}
          />
        )}
        {booking.notes && (
          <DetailRow label="הערות" value={booking.notes} />
        )}
      </div>

      {/* Actions */}
      <div className="space-y-3">
        {/* Join partner sail */}
        {canJoin && (
          <button
            onClick={handleJoin}
            disabled={joinLoading}
            className="btn-primary w-full"
          >
            {joinLoading ? (
              <span className="flex items-center justify-center gap-2">
                <LoadingSpinner size="sm" />
                מצטרף...
              </span>
            ) : (
              'הצטרף לשיט המשותף'
            )}
          </button>
        )}

        {/* Already joined */}
        {booking.type === 'partner_sail' &&
          booking.status === 'active' &&
          partner &&
          booking.participants.includes(partner.id) && (
            <div className="text-center text-sm text-green-600 dark:text-green-400 font-medium py-2">
              ✓ אתה משתתף בשיט זה
            </div>
          )}

        {/* Cancel */}
        {canCancel && !confirmCancel && (
          <button
            onClick={() => setConfirmCancel(true)}
            className="w-full py-3 px-4 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            ביטול הזמנה
          </button>
        )}

        {/* Cancel confirmation */}
        {confirmCancel && (
          <div className="card border border-red-200 dark:border-red-800">
            <p className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              בטוח שברצונך לבטל את ההזמנה?
            </p>
            {booking.creditsUsed > 0 && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                המטבעות יוחזרו לחשבונך.
              </p>
            )}
            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                disabled={cancelLoading}
                className="flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50"
              >
                {cancelLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <LoadingSpinner size="sm" />
                    מבטל...
                  </span>
                ) : (
                  'כן, בטל'
                )}
              </button>
              <button
                onClick={() => setConfirmCancel(false)}
                className="flex-1 btn-secondary py-2.5 text-sm"
              >
                ביטול
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
