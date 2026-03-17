import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { deleteDoc, doc, runTransaction, serverTimestamp, updateDoc } from 'firebase/firestore'
import { deleteObject, getDownloadURL, ref } from 'firebase/storage'
import toast from 'react-hot-toast'
import { db, storage } from '@/lib/firebase'
import { useFeedbackReports } from '@/hooks/useFeedbackReports'
import { useFeedbackAttachments } from '@/hooks/useFeedbackAttachments'
import { useBoat } from '@/context/BoatContext'
import EmptyState from '@/components/ui/EmptyState'
import ErrorState from '@/components/ui/ErrorState'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import type { FeedbackType, FeedbackStatus } from '@/types'

const TYPE_CONFIG: Record<FeedbackType, { label: string; classes: string }> = {
  bug:     { label: 'תקלה',    classes: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
  feature: { label: 'פיצ׳ר',   classes: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
  general: { label: 'כללי',    classes: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
}

const STATUS_CONFIG: Record<FeedbackStatus, { label: string; classes: string }> = {
  new:       { label: 'חדש',      classes: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  reviewing: { label: 'בבדיקה',   classes: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' },
  resolved:  { label: 'טופל',     classes: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  closed:    { label: 'סגור',     classes: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500' },
}

function formatDate(date: Date) {
  return date.toLocaleDateString('he-IL', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function FeedbackPage() {
  const queryClient = useQueryClient()
  const { isAdmin } = useBoat()
  const { data: reports, isLoading, error } = useFeedbackReports()
  const { data: attachments } = useFeedbackAttachments()
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [deletingAttachmentId, setDeletingAttachmentId] = useState<string | null>(null)

  const attachmentsByReport = (attachments ?? []).reduce<Record<string, typeof attachments>>((acc, item) => {
    const reportId = item.reportId
    if (!acc[reportId]) acc[reportId] = []
    acc[reportId].push(item)
    return acc
  }, {})

  async function handleStatusChange(reportId: string, status: FeedbackStatus) {
    setUpdatingId(reportId)
    try {
      await updateDoc(doc(db, 'feedback_reports', reportId), {
        status,
        updatedAt: serverTimestamp(),
      })
      toast.success('סטטוס הדיווח עודכן')
      queryClient.invalidateQueries({ queryKey: ['feedback_reports'] })
    } catch {
      toast.error('שגיאה בעדכון סטטוס הדיווח')
    } finally {
      setUpdatingId(null)
    }
  }

  async function handleOpenAttachment(storagePath: string) {
    try {
      const url = await getDownloadURL(ref(storage, storagePath))
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch {
      toast.error('שגיאה בפתיחת הקובץ')
    }
  }

  async function handleDeleteAttachment(attachmentId: string, reportId: string, storagePath: string) {
    if (!isAdmin) return
    if (!window.confirm('למחוק את הקובץ המצורף?')) return

    setDeletingAttachmentId(attachmentId)
    try {
      await deleteObject(ref(storage, storagePath))
      await deleteDoc(doc(db, 'feedback_attachments', attachmentId))

      await runTransaction(db, async (tx) => {
        const reportRef = doc(db, 'feedback_reports', reportId)
        const reportSnap = await tx.get(reportRef)
        if (!reportSnap.exists()) return
        const data = reportSnap.data()
        const currentCount = (data.attachmentCount as number) ?? 0
        tx.update(reportRef, {
          attachmentCount: Math.max(0, currentCount - 1),
          updatedAt: serverTimestamp(),
        })
      })

      toast.success('הקובץ נמחק')
      queryClient.invalidateQueries({ queryKey: ['feedback_attachments'] })
      queryClient.invalidateQueries({ queryKey: ['feedback_reports'] })
    } catch {
      toast.error('שגיאה במחיקת הקובץ')
    } finally {
      setDeletingAttachmentId(null)
    }
  }

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">פידבק ודיווח תקלות</h1>
        <Link to="/feedback/new" className="btn-primary text-sm px-4 py-2">
          + דיווח חדש
        </Link>
      </div>

      {isAdmin && (
        <div className="card bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 py-2 px-4">
          <p className="text-xs text-blue-700 dark:text-blue-300">מנהל — מציג את כל הדיווחים</p>
        </div>
      )}

      {isLoading && <div className="flex justify-center py-12"><LoadingSpinner /></div>}
      {error && (
        <div className="card">
          <ErrorState message="שגיאה בטעינת הדיווחים" />
        </div>
      )}

      {!isLoading && !error && (!reports || reports.length === 0) && (
        <div className="card">
          <EmptyState
            title="אין דיווחים עדיין"
            description="נתקלת בתקלה או יש לך רעיון? שתף אותנו"
          />
        </div>
      )}

      {reports && reports.length > 0 && (
        <div className="space-y-3">
          {reports.map((r) => {
            const typeCfg = TYPE_CONFIG[r.type]
            const statusCfg = STATUS_CONFIG[r.status]
            const reportAttachments = attachmentsByReport[r.id] ?? []
            return (
              <div key={r.id} className="card space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-gray-900 dark:text-white text-sm">{r.title}</p>
                  <div className="flex gap-1.5 flex-shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeCfg.classes}`}>
                      {typeCfg.label}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusCfg.classes}`}>
                      {statusCfg.label}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{r.message}</p>
                {reportAttachments.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400">קבצים מצורפים ({reportAttachments.length})</p>
                    <div className="space-y-1">
                      {reportAttachments.map((a) => (
                        <div key={a.id} className="flex items-center justify-between gap-2">
                          <button
                            onClick={() => void handleOpenAttachment(a.storagePath)}
                            className="block text-xs text-blue-600 dark:text-blue-400 hover:underline truncate"
                          >
                            {a.fileName}
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => void handleDeleteAttachment(a.id, r.id, a.storagePath)}
                              disabled={deletingAttachmentId === a.id}
                              className="text-[11px] px-2 py-1 rounded border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-60"
                            >
                              {deletingAttachmentId === a.id ? 'מוחק...' : 'מחק'}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-gray-400 dark:text-gray-500">{formatDate(r.createdAt)}</p>
                  {isAdmin && (
                    <select
                      value={r.status}
                      onChange={(e) => void handleStatusChange(r.id, e.target.value as FeedbackStatus)}
                      disabled={updatingId === r.id}
                      className="text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-2 py-1 text-gray-700 dark:text-gray-300 disabled:opacity-60"
                    >
                      <option value="new">חדש</option>
                      <option value="reviewing">בבדיקה</option>
                      <option value="resolved">טופל</option>
                      <option value="closed">סגור</option>
                    </select>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
