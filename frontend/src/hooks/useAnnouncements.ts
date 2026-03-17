import { collection, query, where, orderBy, type DocumentData } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useBoat } from '@/context/BoatContext'
import { useFirestoreQuery } from './useFirestoreQuery'
import type { Announcement } from '@/types'

function docToAnnouncement(id: string, data: DocumentData): Announcement {
  return {
    id,
    boatId: data.boatId as string,
    title: data.title as string,
    content: data.content as string,
    priority: data.priority as Announcement['priority'],
    isActive: (data.isActive as boolean) ?? true,
    expiresAt: data.expiresAt ? data.expiresAt.toDate() : null,
    createdByUserId: data.createdByUserId as string,
    createdAt: data.createdAt.toDate(),
    updatedAt: data.updatedAt.toDate(),
  }
}

export function useAnnouncements() {
  const { activeBoatId } = useBoat()
  return useFirestoreQuery(
    ['announcements', activeBoatId],
    activeBoatId
      ? () =>
          query(
            collection(db, 'announcements'),
            where('boatId', '==', activeBoatId),
            where('isActive', '==', true),
            orderBy('createdAt', 'desc'),
          )
      : null,
    docToAnnouncement,
  )
}
