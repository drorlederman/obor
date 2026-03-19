import { collection, query, where, type DocumentData } from 'firebase/firestore'
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
  const result = useFirestoreQuery(
    ['announcements', activeBoatId],
    activeBoatId
      ? () =>
          query(
            collection(db, 'announcements'),
            where('boatId', '==', activeBoatId),
          )
      : null,
    docToAnnouncement,
  )

  const data = result.data
    ?.filter((item) => item.isActive)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

  return { ...result, data }
}
