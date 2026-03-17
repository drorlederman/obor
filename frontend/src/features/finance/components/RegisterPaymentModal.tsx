import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { registerPaymentSchema, type RegisterPaymentFormData } from '@/features/finance/schemas/payment.schema'
import { registerPaymentFn } from '@/services/functions'
import { useBoat } from '@/context/BoatContext'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import type { PartnerInvoice } from '@/types'

interface Props {
  invoice: PartnerInvoice
  partnerName?: string
  onClose: () => void
}

const METHOD_OPTIONS = [
  { value: 'cash', label: 'מזומן' },
  { value: 'bank_transfer', label: 'העברה בנקאית' },
  { value: 'card', label: 'כרטיס אשראי' },
] as const

function formatAmount(amount: number): string {
  return `₪${amount.toLocaleString('he-IL')}`
}

export default function RegisterPaymentModal({ invoice, partnerName, onClose }: Props) {
  const queryClient = useQueryClient()
  const { activeBoatId } = useBoat()

  const today = new Date().toISOString().slice(0, 10)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterPaymentFormData>({
    resolver: zodResolver(registerPaymentSchema),
    defaultValues: {
      amount: invoice.amountRemaining,
      method: 'bank_transfer',
      paidAt: today,
    },
  })

  async function onSubmit(data: RegisterPaymentFormData) {
    if (!activeBoatId) return
    try {
      await registerPaymentFn({
        invoiceId: invoice.id,
        amount: data.amount,
        method: data.method,
        reference: data.reference || null,
        notes: data.notes || null,
        paidAt: new Date(data.paidAt).toISOString(),
      })
      toast.success('התשלום נרשם בהצלחה')
      queryClient.invalidateQueries({ queryKey: ['invoices', activeBoatId] })
      queryClient.invalidateQueries({ queryKey: ['payments', activeBoatId] })
      onClose()
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message ?? 'שגיאה ברישום התשלום')
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose} />
      <div className="fixed inset-x-0 bottom-0 md:inset-0 z-50 flex md:items-center md:justify-center">
        <div className="w-full md:max-w-md bg-white dark:bg-gray-900 rounded-t-3xl md:rounded-2xl shadow-xl md:mx-4">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">רישום תשלום</h2>
              {partnerName && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{partnerName}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Invoice summary */}
          <div className="px-4 pt-3 pb-1 bg-gray-50 dark:bg-gray-800/50">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">יתרה לתשלום</span>
              <span className="font-bold text-red-600 dark:text-red-400">
                {formatAmount(invoice.amountRemaining)}
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-4">
            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                סכום תשלום (₪)
              </label>
              <input
                type="number"
                min={0.01}
                max={invoice.amountRemaining}
                step={0.01}
                {...register('amount', { valueAsNumber: true })}
                className="input"
              />
              {errors.amount && (
                <p className="mt-1 text-xs text-red-500">{errors.amount.message}</p>
              )}
            </div>

            {/* Method */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                אמצעי תשלום
              </label>
              <div className="grid grid-cols-3 gap-2">
                {METHOD_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className="flex items-center justify-center p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer text-sm text-center"
                  >
                    <input
                      type="radio"
                      value={opt.value}
                      {...register('method')}
                      className="sr-only"
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
              {errors.method && (
                <p className="mt-1 text-xs text-red-500">{errors.method.message}</p>
              )}
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                תאריך תשלום
              </label>
              <input type="date" {...register('paidAt')} className="input" />
              {errors.paidAt && (
                <p className="mt-1 text-xs text-red-500">{errors.paidAt.message}</p>
              )}
            </div>

            {/* Reference */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                אסמכתה (אופציונלי)
              </label>
              <input
                {...register('reference')}
                className="input"
                placeholder="מספר עסקה, שיק וכו'"
              />
            </div>

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <LoadingSpinner size="sm" />
                  רושם...
                </span>
              ) : (
                'רשום תשלום'
              )}
            </button>
          </form>
        </div>
      </div>
    </>
  )
}
