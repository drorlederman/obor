import { useState } from 'react'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { db } from '@/lib/firebase'
import { useAnnouncements } from '@/hooks/useAnnouncements'
import { useBoat } from '@/context/BoatContext'
import { useAuth } from '@/context/AuthContext'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ErrorState from '@/components/ui/ErrorState'
import EmptyState from '@/components/ui/EmptyState'
import type { AnnouncementPriority } from '@/types'

const PRIORITY_CONFIG: Record<AnnouncementPriority, { label: string; classes: string; border: string }> = {
  info:      { label: 'מידע',  classes: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',   border: 'border-r-4 border-r-blue-400' },
  important: { label: 'חשוב',  classes: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800', border: 'border-r-4 border-r-yellow-400' },
  urgent:    { label: 'דחוף',  classes: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',       border: 'border-r-4 border-r-red-500' },
}

const schema = z.object({
  title:    z.string().min(2, 'כותרת חובה'),
  content:  z.string().min(5, 'תוכן חובה'),
  priority: z.enum(['info', 'important', 'urgent']),
})
type FormData = z.infer<typeof schema>

function formatDate(date: Date) {
  return date.toLocaleDateString('he-IL', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function AnnouncementsPage() {
  const queryClient = useQueryClient()
  const { activeBoatId, isAdmin } = useBoat()
  const { user } = useAuth()
  const { data: announcements, isLoading, error } = useAnnouncements()
  const canPost = isAdmin
  const [showForm, setShowForm] = useState(false)

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { priority: 'info' },
  })

  async function onSubmit(data: FormData) {
    if (!activeBoatId || !user) return
    try {
      await addDoc(collection(db, 'announcements'), {
        boatId: activeBoatId,
        title: data.title.trim(),
        content: data.content.trim(),
        priority: data.priority,
        isActive: true,
        expiresAt: null,
        createdByUserId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      toast.success('ההודעה פורסמה')
      queryClient.invalidateQueries({ queryKey: ['announcements', activeBoatId] })
      reset()
      setShowForm(false)
    } catch {
      toast.error('שגיאה בפרסום ההודעה')
    }
  }

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">הודעות</h1>
        {canPost && !showForm && (
          <button onClick={() => setShowForm(true)} className="btn-primary text-sm px-4 py-2">
            + הודעה חדשה
          </button>
        )}
      </div>

      {/* Post form */}
      {showForm && canPost && (
        <div className="card space-y-4">
          <h2 className="font-semibold text-gray-900 dark:text-white">פרסום הודעה חדשה</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">כותרת</label>
              <input {...register('title')} className="input" placeholder="כותרת ההודעה" />
              {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">עדיפות</label>
              <select {...register('priority')} className="input">
                <option value="info">מידע</option>
                <option value="important">חשוב</option>
                <option value="urgent">דחוף</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">תוכן</label>
              <textarea {...register('content')} rows={4} className="input resize-none" placeholder="תוכן ההודעה..." />
              {errors.content && <p className="mt-1 text-xs text-red-500">{errors.content.message}</p>}
            </div>

            <div className="flex gap-2">
              <button type="submit" disabled={isSubmitting} className="btn-primary flex-1">
                {isSubmitting ? <span className="flex items-center justify-center gap-2"><LoadingSpinner size="sm" />שומר...</span> : 'פרסם'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); reset() }} className="btn-secondary px-4">
                ביטול
              </button>
            </div>
          </form>
        </div>
      )}

      {isLoading && <div className="flex justify-center py-12"><LoadingSpinner /></div>}
      {error && (
        <div className="card">
          <ErrorState message="שגיאה בטעינת ההודעות" />
        </div>
      )}

      {!isLoading && !error && (!announcements || announcements.length === 0) && (
        <div className="card">
          <EmptyState
            title="אין הודעות פעילות"
            description="הודעות חדשות מהמנהל יופיעו כאן"
          />
        </div>
      )}

      {announcements && announcements.length > 0 && (
        <div className="space-y-3">
          {announcements.map((a) => {
            const cfg = PRIORITY_CONFIG[a.priority]
            return (
              <div key={a.id} className={`rounded-xl border p-4 ${cfg.classes} ${cfg.border}`}>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{a.title}</h3>
                  <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-white/50 dark:bg-black/20 text-gray-600 dark:text-gray-400">
                    {cfg.label}
                  </span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1.5 whitespace-pre-wrap">{a.content}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">{formatDate(a.createdAt)}</p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
