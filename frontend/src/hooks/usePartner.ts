import { collection, query, where, limit, type DocumentData } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useBoat } from '@/context/BoatContext'
import { useAuth } from '@/context/AuthContext'
import { useFirestoreQuery } from './useFirestoreQuery'
import type { Partner } from '@/types'

export type { Partner }

function docToPartner(id: string, data: DocumentData): Partner {
  return {
    id,
    boatId: data.boatId as string,
    userId: data.userId as string,
    fullName: data.fullName as string,
    email: data.email as string,
    phone: (data.phone as string) ?? null,
    status: data.status as Partner['status'],
    weekdayCreditsBalance: (data.weekdayCreditsBalance as number) ?? 0,
    weekendCreditsBalance: (data.weekendCreditsBalance as number) ?? 0,
    financialStatus: (data.financialStatus as Partner['financialStatus']) ?? 'active',
    joinedAt: data.joinedAt?.toDate?.() ?? new Date(),
    notes: (data.notes as string) ?? null,
  }
}

export function usePartner() {
  const { activeBoatId } = useBoat()
  const { user } = useAuth()

  const result = useFirestoreQuery(
    ['partner', activeBoatId, user?.uid],
    activeBoatId && user?.uid
      ? () =>
          query(
            collection(db, 'partners'),
            where('boatId', '==', activeBoatId),
            where('userId', '==', user.uid),
            limit(1),
          )
      : null,
    docToPartner,
  )

  return { ...result, data: result.data?.[0] ?? null }
}
