import { collection, query, where, orderBy, type DocumentData } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useBoat } from '@/context/BoatContext'
import { useAuth } from '@/context/AuthContext'
import { useFirestoreQuery } from './useFirestoreQuery'
import type { FeedbackReport } from '@/types'

function docToFeedback(id: string, data: DocumentData): FeedbackReport {
  return {
    id,
    boatId: data.boatId as string,
    userId: data.userId as string,
    partnerId: (data.partnerId as string) ?? null,
    type: data.type as FeedbackReport['type'],
    title: data.title as string,
    message: data.message as string,
    status: data.status as FeedbackReport['status'],
    attachmentCount: (data.attachmentCount as number) ?? 0,
    createdAt: data.createdAt.toDate(),
    updatedAt: data.updatedAt.toDate(),
  }
}

export function useFeedbackReports() {
  const { activeBoatId, isAdmin } = useBoat()
  const { user } = useAuth()

  return useFirestoreQuery(
    ['feedback_reports', activeBoatId, user?.uid, isAdmin],
    activeBoatId && user
      ? () => {
          const constraints = [
            where('boatId', '==', activeBoatId),
            ...(!isAdmin ? [where('userId', '==', user.uid)] : []),
            orderBy('createdAt', 'desc'),
          ]
          return query(collection(db, 'feedback_reports'), ...constraints)
        }
      : null,
    docToFeedback,
  )
}
