import { collection, query, where, orderBy, type DocumentData } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useBoat } from '@/context/BoatContext'
import { useFirestoreQuery } from './useFirestoreQuery'

export interface BackupRecord {
  id: string
  boatId: string
  notes: string | null
  totalDocuments: number
  status: 'completed' | 'failed' | 'in_progress'
  createdByUserId: string
  createdAt: Date
}

function docToBackup(id: string, data: DocumentData): BackupRecord {
  return {
    id,
    boatId: data.boatId as string,
    notes: (data.notes as string) ?? null,
    totalDocuments: (data.totalDocuments as number) ?? 0,
    status: (data.status as BackupRecord['status']) ?? 'completed',
    createdByUserId: data.createdByUserId as string,
    createdAt: data.createdAt.toDate(),
  }
}

export function useBackups() {
  const { activeBoatId, isAdmin } = useBoat()
  return useFirestoreQuery(
    ['backups', activeBoatId],
    activeBoatId && isAdmin
      ? () =>
          query(
            collection(db, 'backups'),
            where('boatId', '==', activeBoatId),
            orderBy('createdAt', 'desc'),
          )
      : null,
    docToBackup,
  )
}
