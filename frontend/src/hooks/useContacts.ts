import { collection, query, where, orderBy, type DocumentData } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useBoat } from '@/context/BoatContext'
import { useFirestoreQuery } from './useFirestoreQuery'
import type { Contact } from '@/types'

function docToContact(id: string, data: DocumentData): Contact {
  return {
    id,
    boatId: data.boatId as string,
    name: data.name as string,
    roleLabel: data.roleLabel as string,
    phone: data.phone as string,
    email: (data.email as string) ?? null,
    notes: (data.notes as string) ?? null,
    category: data.category as Contact['category'],
    isActive: (data.isActive as boolean) ?? true,
    createdAt: data.createdAt.toDate(),
    updatedAt: data.updatedAt.toDate(),
  }
}

export function useContacts() {
  const { activeBoatId } = useBoat()
  return useFirestoreQuery(
    ['contacts', activeBoatId],
    activeBoatId
      ? () =>
          query(
            collection(db, 'contacts'),
            where('boatId', '==', activeBoatId),
            where('isActive', '==', true),
            orderBy('category', 'asc'),
          )
      : null,
    docToContact,
  )
}
