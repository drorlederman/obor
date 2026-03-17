import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { useCharges } from '@/hooks/useCharges'
import { useBoat } from '@/context/BoatContext'
import { publishChargeFn } from '@/services/functions'
import ChargeCard from '@/features/finance/components/ChargeCard'
import CreateChargeModal from '@/features/finance/components/CreateChargeModal'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

export default function ChargesPage() {
  const { activeBoatId } = useBoat()
  const queryClient = useQueryClient()
  const { data: charges, isLoading, error } = useCharges()
  const [showCreate, setShowCreate] = useState(false)
  const [publishingId, setPublishingId] = useState<string | null>(null)

  async function handlePublish(chargeId: string) {
    setPublishingId(chargeId)
    try {
      const result = await publishChargeFn({ chargeId })
      toast.success(`החיוב פורסם — נוצרו ${result.data.invoicesCreated} חשבוניות`)
      queryClient.invalidateQueries({ queryKey: ['charges', activeBoatId] })
      queryClient.invalidateQueries({ queryKey: ['invoices', activeBoatId] })
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message ?? 'שגיאה בפרסום החיוב')
    } finally {
      setPublishingId(null)
    }
  }

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">חיובים</h1>
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          + חיוב חדש
        </button>
      </div>

      {isLoading && (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      )}

      {error && (
        <div className="card text-center text-red-500">
          שגיאה בטעינת החיובים
        </div>
      )}

      {!isLoading && !error && charges?.length === 0 && (
        <div className="card text-center py-10">
          <p className="text-gray-500 dark:text-gray-400">אין חיובים עדיין</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            לחץ על "חיוב חדש" להוסיף את הראשון
          </p>
        </div>
      )}

      {charges && charges.length > 0 && (
        <div className="space-y-3">
          {charges.map((charge) => (
            <ChargeCard
              key={charge.id}
              charge={charge}
              onPublish={() => handlePublish(charge.id)}
              publishing={publishingId === charge.id}
            />
          ))}
        </div>
      )}

      {showCreate && (
        <CreateChargeModal onClose={() => setShowCreate(false)} />
      )}
    </div>
  )
}
