import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { useMaintenanceTicket, useMaintenanceUpdates } from '@/hooks/useMaintenanceTickets'
import { useBoat } from '@/context/BoatContext'
import { updateMaintenanceStatusFn, addMaintenanceUpdateFn } from '@/services/functions'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import type { TicketStatus } from '@/types'

const STATUS_CONFIG: Record<TicketStatus, { label: string; classes: string }> = {
  open:          { label: 'פתוח',         classes: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
  in_progress:   { label: 'בטיפול',       classes: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  waiting_parts: { label: 'ממתין לחלקים', classes: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' },
  resolved:      { label: 'טופל',         classes: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  closed:        { label: 'סגור',         classes: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
}

const PRIORITY_LABELS = { low: 'נמוכה', medium: 'בינונית', high: 'גבוהה', critical: 'קריטי' }
const CATEGORY_LABELS = { engine: 'מנוע', sails: 'מפרשים', electrical: 'חשמל', hull: 'גוף הסירה', safety: 'בטיחות', general: 'כללי' }

const NEXT_STATUSES: Record<TicketStatus, TicketStatus[]> = {
  open:          ['in_progress', 'waiting_parts', 'resolved'],
  in_progress:   ['waiting_parts', 'resolved'],
  waiting_parts: ['in_progress', 'resolved'],
  resolved:      ['closed', 'open'],
  closed:        [],
}

function formatDateTime(date: Date) {
  return date.toLocaleString('he-IL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export default function MaintenanceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const { isMaintenanceManager, isAdmin } = useBoat()
  const canManage = isMaintenanceManager || isAdmin

  const { data: ticket, isLoading } = useMaintenanceTicket(id)
  const { data: updates } = useMaintenanceUpdates(id)

  const [comment, setComment] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)

  async function handleStatusChange(newStatus: TicketStatus) {
    if (!id) return
    setUpdatingStatus(true)
    try {
      await updateMaintenanceStatusFn({ ticketId: id, status: newStatus })
      toast.success(`הסטטוס עודכן ל-${STATUS_CONFIG[newStatus].label}`)
      queryClient.invalidateQueries({ queryKey: ['maintenance_ticket', id] })
      queryClient.invalidateQueries({ queryKey: ['maintenance_updates', id] })
      queryClient.invalidateQueries({ queryKey: ['maintenance_tickets'] })
    } catch {
      toast.error('שגיאה בעדכון הסטטוס')
    } finally {
      setUpdatingStatus(false)
    }
  }

  async function handleAddComment() {
    if (!comment.trim() || !id) return
    setSubmittingComment(true)
    try {
      await addMaintenanceUpdateFn({ ticketId: id, comment: comment.trim() })
      toast.success('ההערה נוספה')
      setComment('')
      queryClient.invalidateQueries({ queryKey: ['maintenance_updates', id] })
    } catch {
      toast.error('שגיאה בהוספת ההערה')
    } finally {
      setSubmittingComment(false)
    }
  }

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-[60vh]"><LoadingSpinner size="lg" /></div>
  }

  if (!ticket) {
    return (
      <div className="p-4 text-center">
        <p className="text-gray-500 dark:text-gray-400">קריאה לא נמצאה</p>
        <Link to="/maintenance" className="mt-2 inline-block text-sm text-blue-600 hover:underline">חזרה</Link>
      </div>
    )
  }

  const status = STATUS_CONFIG[ticket.status]
  const nextStatuses = NEXT_STATUSES[ticket.status]

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 pt-2">
        <Link to="/maintenance" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors">
          <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M9 18l6-6-6-6" />
          </svg>
        </Link>
        <h1 className="text-lg font-bold text-gray-900 dark:text-white flex-1 line-clamp-1">{ticket.title}</h1>
      </div>

      {/* Status card */}
      <div className="card space-y-3">
        <div className="flex items-center justify-between">
          <span className={`text-sm font-medium px-3 py-1 rounded-full ${status.classes}`}>{status.label}</span>
          <div className="flex gap-2 text-xs text-gray-500 dark:text-gray-400">
            <span>{CATEGORY_LABELS[ticket.category]}</span>
            <span>·</span>
            <span>דחיפות: {PRIORITY_LABELS[ticket.priority]}</span>
          </div>
        </div>

        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{ticket.description}</p>

        <p className="text-xs text-gray-400 dark:text-gray-500">נפתח: {formatDateTime(ticket.createdAt)}</p>
      </div>

      {/* Status actions — manager/admin */}
      {canManage && nextStatuses.length > 0 && (
        <div className="card">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">עדכן סטטוס</p>
          <div className="flex gap-2 flex-wrap">
            {nextStatuses.map((s) => (
              <button
                key={s}
                onClick={() => handleStatusChange(s)}
                disabled={updatingStatus}
                className="text-sm px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                {STATUS_CONFIG[s].label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Updates timeline */}
      {updates && updates.length > 0 && (
        <div className="card space-y-3">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">עדכונים</p>
          <div className="space-y-3">
            {updates.map((u) => (
              <div key={u.id} className="flex gap-3">
                <div className="mt-1.5 w-2 h-2 rounded-full bg-blue-400 flex-shrink-0" />
                <div className="flex-1">
                  {u.statusAfter && (
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">
                      סטטוס → {STATUS_CONFIG[u.statusAfter].label}
                    </p>
                  )}
                  <p className="text-sm text-gray-700 dark:text-gray-300">{u.comment}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{formatDateTime(u.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add comment */}
      {ticket.status !== 'closed' && (
        <div className="card space-y-3">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">הוסף הערה</p>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            className="input resize-none"
            placeholder="כתוב עדכון או הערה..."
          />
          <button
            onClick={handleAddComment}
            disabled={submittingComment || !comment.trim()}
            className="btn-primary w-full"
          >
            {submittingComment
              ? <span className="flex items-center justify-center gap-2"><LoadingSpinner size="sm" />שומר...</span>
              : 'הוסף הערה'}
          </button>
        </div>
      )}
    </div>
  )
}
