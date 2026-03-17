import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { useBackups } from '@/hooks/useBackups'
import { useBoat } from '@/context/BoatContext'
import { createSystemBackupFn, restoreBackupFn } from '@/services/functions'
import EmptyState from '@/components/ui/EmptyState'
import ErrorState from '@/components/ui/ErrorState'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

function formatDateTime(date: Date) {
  return date.toLocaleString('he-IL', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const STATUS_CONFIG = {
  completed:   { label: 'הושלם',       classes: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  in_progress: { label: 'בתהליך',      classes: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  failed:      { label: 'נכשל',        classes: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
}

export default function BackupsPage() {
  const queryClient = useQueryClient()
  const { activeBoatId } = useBoat()
  const { data: backups, isLoading, error } = useBackups()

  const [creating, setCreating] = useState(false)
  const [restoreId, setRestoreId] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  async function handleCreate() {
    if (!activeBoatId) return
    setCreating(true)
    try {
      const result = await createSystemBackupFn({ boatId: activeBoatId, notes: null })
      toast.success(`גיבוי נוצר — ${result.data.totalDocuments} מסמכים`)
      queryClient.invalidateQueries({ queryKey: ['backups', activeBoatId] })
    } catch {
      toast.error('שגיאה ביצירת הגיבוי')
    } finally {
      setCreating(false)
    }
  }

  async function handleRestore(backupId: string) {
    setRestoreId(backupId)
    try {
      const result = await restoreBackupFn({ backupId, confirm: true })
      toast.success(`שחזור הושלם — ${result.data.totalRestored} מסמכים שוחזרו`)
      queryClient.invalidateQueries({ queryKey: ['backups', activeBoatId] })
    } catch {
      toast.error('שגיאה בשחזור הגיבוי')
    } finally {
      setRestoreId(null)
      setConfirmId(null)
    }
  }

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">גיבוי ושחזור</h1>
        <button onClick={handleCreate} disabled={creating} className="btn-primary text-sm px-4 py-2">
          {creating ? <span className="flex items-center gap-1.5"><LoadingSpinner size="sm" />יוצר...</span> : '+ גיבוי חדש'}
        </button>
      </div>

      <div className="card bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 space-y-1">
        <p className="text-sm font-medium text-amber-800 dark:text-amber-300">⚠️ שחזור גיבוי</p>
        <p className="text-xs text-amber-700 dark:text-amber-400">
          שחזור גיבוי מחליף את כל הנתונים הנוכחיים בנתוני הגיבוי. פעולה זו אינה הפיכה.
          מומלץ ליצור גיבוי חדש לפני שחזור.
        </p>
      </div>

      {isLoading && <div className="flex justify-center py-12"><LoadingSpinner /></div>}
      {error && (
        <div className="card">
          <ErrorState message="שגיאה בטעינת הגיבויים" />
        </div>
      )}

      {!isLoading && !error && (!backups || backups.length === 0) && (
        <div className="card">
          <EmptyState
            title="אין גיבויים"
            description="צור את הגיבוי הראשון כדי לאפשר שחזור בעת הצורך"
          />
        </div>
      )}

      {backups && backups.length > 0 && (
        <div className="space-y-3">
          {backups.map((b) => {
            const cfg = STATUS_CONFIG[b.status]
            const isConfirming = confirmId === b.id
            const isRestoring = restoreId === b.id
            return (
              <div key={b.id} className="card space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white text-sm">
                      {formatDateTime(b.createdAt)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {b.totalDocuments.toLocaleString()} מסמכים
                    </p>
                    {b.notes && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{b.notes}</p>}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${cfg.classes}`}>
                    {cfg.label}
                  </span>
                </div>

                {b.status === 'completed' && (
                  isConfirming ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRestore(b.id)}
                        disabled={!!restoreId}
                        className="flex-1 py-2 rounded-lg text-xs font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                      >
                        {isRestoring ? <span className="flex items-center justify-center gap-1"><LoadingSpinner size="sm" />משחזר...</span> : 'כן, שחזר'}
                      </button>
                      <button
                        onClick={() => setConfirmId(null)}
                        className="flex-1 py-2 rounded-lg text-xs font-medium border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        ביטול
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmId(b.id)}
                      className="w-full py-2 rounded-lg text-xs font-medium border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      שחזר גיבוי זה
                    </button>
                  )
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
