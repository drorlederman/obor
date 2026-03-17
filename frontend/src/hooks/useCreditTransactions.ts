import { collection, query, where, orderBy, limit, type DocumentData } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useBoat } from '@/context/BoatContext'
import { usePartner } from './usePartner'
import { useFirestoreQuery } from './useFirestoreQuery'
import type { CreditTransaction } from '@/types'

export type { CreditTransaction }

function docToTransaction(id: string, data: DocumentData): CreditTransaction {
  return {
    id,
    boatId: data.boatId as string,
    partnerId: data.partnerId as string,
    bookingId: (data.bookingId as string) ?? null,
    type: data.type as CreditTransaction['type'],
    creditType: data.creditType as 'weekday' | 'weekend',
    amount: data.amount as number,
    balanceAfter: data.balanceAfter as number,
    description: data.description as string,
    createdByUserId: data.createdByUserId as string,
    createdAt: data.createdAt.toDate(),
  }
}

export function useCreditTransactions(limitCount = 30) {
  const { activeBoatId } = useBoat()
  const { data: partner } = usePartner()

  return useFirestoreQuery(
    ['credit-transactions', activeBoatId, partner?.id, limitCount],
    activeBoatId && partner?.id
      ? () =>
          query(
            collection(db, 'credit_transactions'),
            where('boatId', '==', activeBoatId),
            where('partnerId', '==', partner.id),
            orderBy('createdAt', 'desc'),
            limit(limitCount),
          )
      : null,
    docToTransaction,
  )
}
