import { useState } from 'react'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { db } from '@/lib/firebase'
import { useContacts } from '@/hooks/useContacts'
import { useBoat } from '@/context/BoatContext'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ErrorState from '@/components/ui/ErrorState'
import EmptyState from '@/components/ui/EmptyState'
import type { ContactCategory } from '@/types'

const CATEGORY_LABELS: Record<ContactCategory, string> = {
  marina: 'מרינה', emergency: 'חירום', supplier: 'ספק', service: 'שירות', general: 'כללי',
}

const CATEGORY_ICON: Record<ContactCategory, string> = {
  marina: '⚓', emergency: '🚨', supplier: '🔧', service: '🛠️', general: '📋',
}

const schema = z.object({
  name:      z.string().min(2, 'שם חובה'),
  roleLabel: z.string().min(2, 'תפקיד חובה'),
  phone:     z.string().min(7, 'טלפון חובה'),
  email:     z.string().email('אימייל לא תקין').optional().or(z.literal('')),
  category:  z.enum(['marina', 'emergency', 'supplier', 'service', 'general']),
  notes:     z.string().optional(),
})
type FormData = z.infer<typeof schema>

export default function ContactsPage() {
  const queryClient = useQueryClient()
  const { activeBoatId, isAdmin } = useBoat()
  const { data: contacts, isLoading, error } = useContacts()
  const [showForm, setShowForm] = useState(false)

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { category: 'general' },
  })

  async function onSubmit(data: FormData) {
    if (!activeBoatId) return
    try {
      await addDoc(collection(db, 'contacts'), {
        boatId: activeBoatId,
        name: data.name.trim(),
        roleLabel: data.roleLabel.trim(),
        phone: data.phone.trim(),
        email: data.email?.trim() || null,
        notes: data.notes?.trim() || null,
        category: data.category,
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      toast.success('איש הקשר נוסף')
      queryClient.invalidateQueries({ queryKey: ['contacts', activeBoatId] })
      reset()
      setShowForm(false)
    } catch {
      toast.error('שגיאה בהוספת איש הקשר')
    }
  }

  // Group by category
  const grouped = contacts?.reduce<Record<string, typeof contacts>>((acc, c) => {
    const key = c.category
    if (!acc[key]) acc[key] = []
    acc[key].push(c)
    return acc
  }, {}) ?? {}

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">אנשי קשר</h1>
        {isAdmin && !showForm && (
          <button onClick={() => setShowForm(true)} className="btn-primary text-sm px-4 py-2">
            + הוסף
          </button>
        )}
      </div>

      {/* Add form */}
      {showForm && isAdmin && (
        <div className="card space-y-4">
          <h2 className="font-semibold text-gray-900 dark:text-white">איש קשר חדש</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">שם</label>
                <input {...register('name')} className="input" placeholder="שם מלא" />
                {errors.name && <p className="mt-0.5 text-xs text-red-500">{errors.name.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">תפקיד</label>
                <input {...register('roleLabel')} className="input" placeholder="לדוגמה: קפטן מרינה" />
                {errors.roleLabel && <p className="mt-0.5 text-xs text-red-500">{errors.roleLabel.message}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">טלפון</label>
                <input {...register('phone')} type="tel" className="input" placeholder="050-0000000" />
                {errors.phone && <p className="mt-0.5 text-xs text-red-500">{errors.phone.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">קטגוריה</label>
                <select {...register('category')} className="input">
                  {Object.entries(CATEGORY_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">אימייל (אופציונלי)</label>
              <input {...register('email')} type="email" className="input" placeholder="דוגמה: שם@דומיין.קום" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">הערות</label>
              <input {...register('notes')} className="input" placeholder="הערות נוספות..." />
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={isSubmitting} className="btn-primary flex-1">
                {isSubmitting ? <span className="flex items-center justify-center gap-2"><LoadingSpinner size="sm" />שומר...</span> : 'הוסף'}
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
          <ErrorState message="שגיאה בטעינת אנשי הקשר" />
        </div>
      )}

      {!isLoading && !error && Object.keys(grouped).length === 0 && (
        <div className="card">
          <EmptyState
            title="אין אנשי קשר"
            description="אנשי קשר חשובים יוצגו כאן לאחר הוספה"
          />
        </div>
      )}

      {Object.entries(grouped).map(([category, items]) => (
        <div key={category}>
          <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <span>{CATEGORY_ICON[category as ContactCategory]}</span>
            {CATEGORY_LABELS[category as ContactCategory]}
          </h2>
          <div className="card divide-y divide-gray-100 dark:divide-gray-800 p-0 overflow-hidden">
            {items.map((contact) => (
              <div key={contact.id} className="flex items-center justify-between px-4 py-3">
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white text-sm">{contact.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{contact.roleLabel}</p>
                  {contact.notes && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">{contact.notes}</p>
                  )}
                </div>
                <a
                  href={`tel:${contact.phone}`}
                  className="flex-shrink-0 flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 font-medium ml-4"
                >
                  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.0 1.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
                  </svg>
                  {contact.phone}
                </a>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
