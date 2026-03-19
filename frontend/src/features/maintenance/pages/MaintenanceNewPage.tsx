import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { useBoat } from '@/context/BoatContext'
import { useAuth } from '@/context/AuthContext'
import { usePartner } from '@/hooks/usePartner'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

const schema = z.object({
  title: z.string().min(3, 'כותרת חובה (לפחות 3 תווים)'),
  description: z.string().min(5, 'תיאור חובה (לפחות 5 תווים)'),
  category: z.enum(['engine', 'sails', 'electrical', 'hull', 'safety', 'general']),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
})

type FormData = z.infer<typeof schema>

const CATEGORY_LABELS = {
  engine: 'מנוע', sails: 'מפרשים', electrical: 'חשמל',
  hull: 'גוף הסירה', safety: 'בטיחות', general: 'כללי',
}

const PRIORITY_LABELS = {
  low: 'נמוכה', medium: 'בינונית', high: 'גבוהה', critical: 'קריטי',
}

const PRIORITY_COLORS = {
  low: 'border-gray-300 dark:border-gray-600',
  medium: 'border-yellow-400',
  high: 'border-orange-400',
  critical: 'border-red-500',
}

export default function MaintenanceNewPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { activeBoatId } = useBoat()
  const { user } = useAuth()
  const { data: partner } = usePartner()

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { category: 'general', priority: 'medium' },
  })

  const watchPriority = watch('priority')

  async function onSubmit(data: FormData) {
    if (!activeBoatId || !user) return
    try {
      await addDoc(collection(db, 'maintenance_tickets'), {
        boatId: activeBoatId,
        title: data.title.trim(),
        description: data.description.trim(),
        category: data.category,
        priority: data.priority,
        status: 'open',
        createdByUserId: user.uid,
        createdByPartnerId: partner?.id ?? null,
        attachmentCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      toast.success('קריאת התחזוקה נפתחה בהצלחה')
      queryClient.invalidateQueries({ queryKey: ['maintenance_tickets', activeBoatId] })
      navigate('/maintenance')
    } catch {
      toast.error('שגיאה בפתיחת הקריאה')
    }
  }

  return (
    <div className="p-4 max-w-lg mx-auto">
      <div className="flex items-center gap-3 pt-2 mb-6">
        <Link to="/maintenance" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors">
          <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M9 18l6-6-6-6" />
          </svg>
        </Link>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">קריאת תחזוקה חדשה</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">כותרת הקריאה</label>
          <input {...register('title')} className="input" placeholder="לדוגמה: נזילה בחדר המנוע" />
          {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>}
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">קטגוריה</label>
          <select {...register('category')} className="input">
            {Object.entries(CATEGORY_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>

        {/* Priority */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">דחיפות</label>
          <div className="grid grid-cols-4 gap-2">
            {(Object.entries(PRIORITY_LABELS) as [keyof typeof PRIORITY_LABELS, string][]).map(([v, l]) => (
              <label key={v} className={`flex items-center justify-center p-2.5 rounded-xl border-2 cursor-pointer text-sm text-center transition-colors ${
                watchPriority === v ? PRIORITY_COLORS[v] : 'border-gray-200 dark:border-gray-700'
              }`}>
                <input type="radio" value={v} {...register('priority')} className="sr-only" />
                {l}
              </label>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">תיאור הבעיה</label>
          <textarea {...register('description')} rows={4} className="input resize-none"
            placeholder="תאר את הבעיה בפירוט..." />
          {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description.message}</p>}
        </div>

        <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
          {isSubmitting
            ? <span className="flex items-center justify-center gap-2"><LoadingSpinner size="sm" />שומר...</span>
            : 'פתח קריאה'}
        </button>
      </form>
    </div>
  )
}
