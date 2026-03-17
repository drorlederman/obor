import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { createChargeSchema, type CreateChargeFormData } from '@/features/finance/schemas/charge.schema'
import { createChargeFn } from '@/services/functions'
import { useBoat } from '@/context/BoatContext'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

interface Props {
  onClose: () => void
}

const CATEGORY_OPTIONS = [
  { value: 'maintenance', label: 'תחזוקה' },
  { value: 'marina', label: 'מרינה' },
  { value: 'insurance', label: 'ביטוח' },
  { value: 'equipment', label: 'ציוד' },
  { value: 'general', label: 'כללי' },
] as const

export default function CreateChargeModal({ onClose }: Props) {
  const queryClient = useQueryClient()
  const { activeBoatId } = useBoat()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateChargeFormData>({
    resolver: zodResolver(createChargeSchema),
    defaultValues: {
      category: 'general',
    },
  })

  async function onSubmit(data: CreateChargeFormData) {
    if (!activeBoatId) return
    try {
      await createChargeFn({
        boatId: activeBoatId,
        title: data.title,
        description: data.description || null,
        category: data.category,
        totalAmount: data.totalAmount,
        dueDate: data.dueDate,
      })
      toast.success('חיוב נוצר בהצלחה')
      queryClient.invalidateQueries({ queryKey: ['charges', activeBoatId] })
      onClose()
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message ?? 'שגיאה ביצירת החיוב')
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose} />
      <div className="fixed inset-x-0 bottom-0 md:inset-0 z-50 flex md:items-center md:justify-center">
        <div className="w-full md:max-w-md bg-white dark:bg-gray-900 rounded-t-3xl md:rounded-2xl shadow-xl md:mx-4 max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900">
            <h2 className="text-base font-bold text-gray-900 dark:text-white">חיוב חדש</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                כותרת
              </label>
              <input
                {...register('title')}
                className="input"
                placeholder="לדוגמה: ביטוח שנתי 2026"
              />
              {errors.title && (
                <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>
              )}
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                קטגוריה
              </label>
              <select {...register('category')} className="input">
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="mt-1 text-xs text-red-500">{errors.category.message}</p>
              )}
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                סכום כולל (₪)
              </label>
              <input
                type="number"
                min={1}
                step={0.01}
                {...register('totalAmount', { valueAsNumber: true })}
                className="input"
                placeholder="לדוגמה: 5000"
              />
              {errors.totalAmount && (
                <p className="mt-1 text-xs text-red-500">{errors.totalAmount.message}</p>
              )}
            </div>

            {/* Due date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                תאריך פירעון
              </label>
              <input
                type="date"
                {...register('dueDate')}
                className="input"
              />
              {errors.dueDate && (
                <p className="mt-1 text-xs text-red-500">{errors.dueDate.message}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                תיאור (אופציונלי)
              </label>
              <textarea
                {...register('description')}
                className="input min-h-[80px] resize-none"
                placeholder="פרטים נוספים על החיוב..."
              />
            </div>

            <div className="pt-1 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3">
              החיוב ייווצר כ<strong>טיוטה</strong>. לאחר בדיקה ניתן לפרסם אותו ולשלוח חשבוניות לכל השותפים.
            </div>

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <LoadingSpinner size="sm" />
                  יוצר...
                </span>
              ) : (
                'צור חיוב'
              )}
            </button>
          </form>
        </div>
      </div>
    </>
  )
}
