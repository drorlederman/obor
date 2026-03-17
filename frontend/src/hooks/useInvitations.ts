import { collection, query, where, orderBy, type DocumentData } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useBoat } from '@/context/BoatContext'
import { useFirestoreQuery } from './useFirestoreQuery'
import type { Invitation } from '@/types'

function docToInvitation(id: string, data: DocumentData): Invitation {
  return {
    id,
    boatId: data.boatId as string,
    boatName: (data.boatName as string) ?? '',
    email: data.email as string,
    role: data.role as Invitation['role'],
    token: data.token as string,
    status: data.status as Invitation['status'],
    invitedByUserId: data.invitedByUserId as string,
    createdAt: data.createdAt.toDate(),
    expiresAt: data.expiresAt.toDate(),
    acceptedAt: data.acceptedAt ? data.acceptedAt.toDate() : null,
    acceptedByUserId: (data.acceptedByUserId as string) ?? null,
  }
}

export function useInvitations() {
  const { activeBoatId, isAdmin } = useBoat()
  return useFirestoreQuery(
    ['invitations', activeBoatId],
    activeBoatId && isAdmin
      ? () =>
          query(
            collection(db, 'invitations'),
            where('boatId', '==', activeBoatId),
            where('status', '==', 'pending'),
            orderBy('createdAt', 'desc'),
          )
      : null,
    docToInvitation,
  )
}
