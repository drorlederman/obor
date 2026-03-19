import { collection, query, where, type DocumentData } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useBoat } from '@/context/BoatContext'
import { useAuth } from '@/context/AuthContext'
import { useFirestoreQuery } from './useFirestoreQuery'
import type { FeedbackAttachment } from '@/types'

function docToFeedbackAttachment(id: string, data: DocumentData): FeedbackAttachment {
  return {
    id,
    boatId: data.boatId as string,
    reportId: data.reportId as string,
    storagePath: data.storagePath as string,
    fileName: data.fileName as string,
    contentType: data.contentType as string,
    sizeBytes: (data.sizeBytes as number) ?? 0,
    uploadedByUserId: data.uploadedByUserId as string,
    createdAt: data.createdAt.toDate(),
  }
}

export function useFeedbackAttachments() {
  const { activeBoatId, isAdmin } = useBoat()
  const { user } = useAuth()

  const result = useFirestoreQuery(
    ['feedback_attachments', activeBoatId, user?.uid, isAdmin],
    activeBoatId && user
      ? () => {
          const constraints = [
            where('boatId', '==', activeBoatId),
            ...(!isAdmin ? [where('uploadedByUserId', '==', user.uid)] : []),
          ]
          return query(collection(db, 'feedback_attachments'), ...constraints)
        }
      : null,
    docToFeedbackAttachment,
  )

  const data = result.data
    ?.slice()
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

  return { ...result, data }
}
