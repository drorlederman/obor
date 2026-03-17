import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { adjustCreditsSchema, type AdjustCreditsFormData } from '@/features/credits/schemas/adjust-credits.schema'
import { adjustCreditsFn } from '@/services/functions'
import { useAllPartners } from '@/hooks/useAllPartners'
import { useBoat } from '@/context/BoatContext'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

interface Props {
  defaultPartnerId?: string
  onClose: () => void
}

export default function AdjustCreditsModal({ defaultPartnerId, onClose }: Props) {
  const queryClient = useQueryClient()
  const { activeBoatId } = useBoat()
  const { data: partners, isLoading: loadingPartners } = useAllPartners()

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<AdjustCreditsFormData>({
    resolver: zodResolver(adjustCreditsSchema),
    defaultValues: {
      partnerId: defaultPartnerId ?? '',
      creditType: 'weekday',
      operation: 'add',
    },
  })

  // Set defaultPartnerId when partners load
  useEffect(() => {
    if (defaultPartnerId) setValue('partnerId', defaultPartnerId)
  }, [defaultPartnerId, setValue])

  async function onSubmit(data: AdjustCreditsFormData) {
    if (!activeBoatId) return
    try {
      const result = await adjustCreditsFn({
        boatId: activeBoatId,
        partnerId: data.partnerId,
        creditType: data.creditType,
        operation: data.operation,
        amount: data.amount,
        description: data.description,
      })
      const newBalance = result.data.newBalance
      toast.success(`יתרה עודכנה. יתרה חדשה: ${newBalance} מטבעות`)
      queryClient.invalidateQueries({ queryKey: ['partner'] })
      queryClient.invalidateQueries({ queryKey: ['credit-transactions'] })
      queryClient.invalidateQueries({ queryKey: ['partners-all'] })
      onClose()
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message ?? 'שגיאה בעדכון מטבעות')
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-x-0 bottom-0 md:inset-0 z-50 flex md:items-center md:justify-center">
        <div className="w-full md:max-w-md bg-white dark:bg-gray-900 rounded-t-3xl md:rounded-2xl shadow-xl md:mx-4">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
            <h2 className="text-base font-bold text-gray-900 dark:text-white">התאמת מטבעות</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-4">
            {/* Partner select */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                שותף
              </label>
              {loadingPartners ? (
                <div className="flex justify-center py-2">
                  <LoadingSpinner size="sm" />
                </div>
              ) : (
                <select {...register('partnerId')} className="input">
                  <option value="">בחר שותף...</option>
                  {(partners ?? []).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.fullName}
                    </option>
                  ))}
                </select>
              )}
              {errors.partnerId && (
                <p className="mt-1 text-xs text-red-500">{errors.partnerId.message}</p>
              )}
            </div>

            {/* Credit type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                סוג מטבע
              </label>
              <div className="flex gap-3">
                {(['weekday', 'weekend'] as const).map((type) => (
                  <label
                    key={type}
                    className="flex-1 flex items-center gap-2 p-3 rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer"
                  >
                    <input type="radio" value={type} {...register('creditType')} className="sr-only" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {type === 'weekday' ? 'יום חול' : 'סוף שבוע'}
                    </span>
                  </label>
                ))}
              </div>
              {errors.creditType && (
                <p className="mt-1 text-xs text-red-500">{errors.creditType.message}</p>
              )}
            </div>

            {/* Operation */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                פעולה
              </label>
              <div className="flex gap-3">
                <label className="flex-1 flex items-center gap-2 p-3 rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer">
                  <input type="radio" value="add" {...register('operation')} className="sr-only" />
                  <span className="text-sm font-medium text-green-600 dark:text-green-400">+ הוסף</span>
                </label>
                <label className="flex-1 flex items-center gap-2 p-3 rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer">
                  <input type="radio" value="subtract" {...register('operation')} className="sr-only" />
                  <span className="text-sm font-medium text-red-600 dark:text-red-400">- הפחת</span>
                </label>
              </div>
              {errors.operation && (
                <p className="mt-1 text-xs text-red-500">{errors.operation.message}</p>
              )}
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                כמות
              </label>
              <input
                type="number"
                min={1}
                step={1}
                {...register('amount', { valueAsNumber: true })}
                className="input"
                placeholder="לדוגמה: 5"
              />
              {errors.amount && (
                <p className="mt-1 text-xs text-red-500">{errors.amount.message}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                תיאור
              </label>
              <input
                {...register('description')}
                className="input"
                placeholder="לדוגמה: תוספת מטבעות לחודש מאי"
              />
              {errors.description && (
                <p className="mt-1 text-xs text-red-500">{errors.description.message}</p>
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
                'עדכן מטבעות'
              )}
            </button>
          </form>
        </div>
      </div>
    </>
  )
}
