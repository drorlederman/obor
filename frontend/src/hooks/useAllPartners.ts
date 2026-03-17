import { collection, query, where, orderBy, type DocumentData } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useBoat } from '@/context/BoatContext'
import { useFirestoreQuery } from './useFirestoreQuery'
import type { Partner } from '@/types'

function docToPartner(id: string, data: DocumentData): Partner {
  return {
    id,
    boatId: data.boatId as string,
    userId: (data.userId as string) ?? null,
    fullName: data.fullName as string,
    email: data.email as string,
    phone: (data.phone as string) ?? null,
    status: data.status as Partner['status'],
    weekdayCreditsBalance: (data.weekdayCreditsBalance as number) ?? 0,
    weekendCreditsBalance: (data.weekendCreditsBalance as number) ?? 0,
    financialStatus: (data.financialStatus as Partner['financialStatus']) ?? 'active',
    joinedAt: data.joinedAt.toDate(),
    notes: (data.notes as string) ?? null,
  }
}

/** All active partners for the current boat. Used by admin/treasurer views. */
export function useAllPartners() {
  const { activeBoatId, isAdmin, isTreasurer } = useBoat()
  return useFirestoreQuery(
    ['partners-all', activeBoatId],
    activeBoatId && (isAdmin || isTreasurer)
      ? () =>
          query(
            collection(db, 'partners'),
            where('boatId', '==', activeBoatId),
            where('status', '==', 'active'),
            orderBy('fullName', 'asc'),
          )
      : null,
    docToPartner,
  )
}
