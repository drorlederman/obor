import { collection, query, where, orderBy, type DocumentData } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useBoat } from '@/context/BoatContext'
import { useFirestoreQuery } from './useFirestoreQuery'
import type { Payment } from '@/types'

function docToPayment(id: string, data: DocumentData): Payment {
  return {
    id,
    boatId: data.boatId as string,
    invoiceId: data.invoiceId as string,
    partnerId: data.partnerId as string,
    amount: data.amount as number,
    method: data.method as Payment['method'],
    reference: (data.reference as string) ?? null,
    notes: (data.notes as string) ?? null,
    paidAt: data.paidAt.toDate(),
    createdByUserId: data.createdByUserId as string,
    createdAt: data.createdAt.toDate(),
  }
}

/** All payments for the boat — used by treasurer/admin only (route is RoleGuard protected). */
export function usePayments() {
  const { activeBoatId } = useBoat()
  return useFirestoreQuery(
    ['payments', activeBoatId],
    activeBoatId
      ? () =>
          query(
            collection(db, 'payments'),
            where('boatId', '==', activeBoatId),
            orderBy('paidAt', 'desc'),
          )
      : null,
    docToPayment,
  )
}
