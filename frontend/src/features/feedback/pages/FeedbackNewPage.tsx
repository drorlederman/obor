import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { ref, uploadBytes } from 'firebase/storage'
import { db, storage } from '@/lib/firebase'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { useBoat } from '@/context/BoatContext'
import { useAuth } from '@/context/AuthContext'
import { usePartner } from '@/hooks/usePartner'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

const schema = z.object({
  type:    z.enum(['bug', 'feature', 'general']),
  title:   z.string().min(3, 'כותרת חובה (לפחות 3 תווים)'),
  message: z.string().min(10, 'תיאור חובה (לפחות 10 תווים)'),
})
type FormData = z.infer<typeof schema>

const TYPE_LABELS = { bug: 'תקלה / באג', feature: 'בקשת פיצ׳ר', general: 'כללי' }

export default function FeedbackNewPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { activeBoatId } = useBoat()
  const { user } = useAuth()
  const { data: partner } = usePartner()
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { type: 'general' },
  })

  async function onSubmit(data: FormData) {
    if (!activeBoatId || !user) return
    try {
      const hasAttachment = !!attachmentFile
      const reportRef = await addDoc(collection(db, 'feedback_reports'), {
        boatId: activeBoatId,
        userId: user.uid,
        partnerId: partner?.id ?? null,
        type: data.type,
        title: data.title.trim(),
        message: data.message.trim(),
        status: 'new',
        attachmentCount: hasAttachment ? 1 : 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      if (attachmentFile) {
        const safeFileName = `${Date.now()}_${attachmentFile.name.replace(/[^\w.\-]/g, '_')}`
        const storagePath = `boats/${activeBoatId}/feedback/${reportRef.id}/${safeFileName}`
        const fileRef = ref(storage, storagePath)

        await uploadBytes(fileRef, attachmentFile, {
          contentType: attachmentFile.type || 'application/octet-stream',
          customMetadata: { uploadedByUserId: user.uid },
        })

        await addDoc(collection(db, 'feedback_attachments'), {
          boatId: activeBoatId,
          reportId: reportRef.id,
          storagePath,
          fileName: attachmentFile.name,
          contentType: attachmentFile.type || 'application/octet-stream',
          sizeBytes: attachmentFile.size,
          uploadedByUserId: user.uid,
          createdAt: serverTimestamp(),
        })
      }

      toast.success('הדיווח נשלח בהצלחה')
      queryClient.invalidateQueries({ queryKey: ['feedback_reports', activeBoatId] })
      navigate('/feedback')
    } catch {
      toast.error('שגיאה בשליחת הדיווח')
    }
  }

  return (
    <div className="p-4 max-w-lg mx-auto">
      <div className="flex items-center gap-3 pt-2 mb-6">
        <Link to="/feedback" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors">
          <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M9 18l6-6-6-6" />
          </svg>
        </Link>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">דיווח חדש</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">סוג הדיווח</label>
          <div className="grid grid-cols-3 gap-2">
            {(Object.entries(TYPE_LABELS) as [FormData['type'], string][]).map(([v, l]) => (
              <label key={v} className="relative">
                <input type="radio" value={v} {...register('type')} className="sr-only peer" />
                <div className="flex items-center justify-center p-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 peer-checked:border-blue-500 peer-checked:bg-blue-50 dark:peer-checked:bg-blue-900/20 cursor-pointer text-sm text-center transition-colors">
                  {l}
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">כותרת</label>
          <input {...register('title')} className="input" placeholder="תיאור קצר של הבעיה או הרעיון" />
          {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>}
        </div>

        {/* Message */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">פירוט</label>
          <textarea
            {...register('message')}
            rows={5}
            className="input resize-none"
            placeholder="פרט את הבעיה, הצעת הפיצ׳ר, או כל מידע שיעזור לנו..."
          />
          {errors.message && <p className="mt-1 text-xs text-red-500">{errors.message.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">קובץ מצורף (אופציונלי)</label>
          <input
            type="file"
            className="input"
            onChange={(e) => setAttachmentFile(e.target.files?.[0] ?? null)}
          />
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">מותר: תמונה / PDF / וידאו עד 10MB</p>
        </div>

        <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
          {isSubmitting
            ? <span className="flex items-center justify-center gap-2"><LoadingSpinner size="sm" />שולח...</span>
            : 'שלח דיווח'}
        </button>
      </form>
    </div>
  )
}
