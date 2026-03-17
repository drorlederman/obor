import { collection, query, where, orderBy, type DocumentData } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useBoat } from '@/context/BoatContext'
import { useFirestoreQuery } from './useFirestoreQuery'
import type { Charge } from '@/types'

function docToCharge(id: string, data: DocumentData): Charge {
  return {
    id,
    boatId: data.boatId as string,
    title: data.title as string,
    description: (data.description as string) ?? null,
    category: data.category as Charge['category'],
    totalAmount: data.totalAmount as number,
    splitMethod: 'equal',
    dueDate: data.dueDate.toDate(),
    status: data.status as Charge['status'],
    createdByUserId: data.createdByUserId as string,
    createdAt: data.createdAt.toDate(),
    updatedAt: data.updatedAt.toDate(),
  }
}

export function useCharges() {
  const { activeBoatId } = useBoat()
  return useFirestoreQuery(
    ['charges', activeBoatId],
    activeBoatId
      ? () =>
          query(
            collection(db, 'charges'),
            where('boatId', '==', activeBoatId),
            orderBy('createdAt', 'desc'),
          )
      : null,
    docToCharge,
  )
}
