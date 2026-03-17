import { collection, query, where, orderBy, limit, type DocumentData } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useBoat } from '@/context/BoatContext'
import { useFirestoreQuery } from './useFirestoreQuery'
import type { AuditLog } from '@/types'

function docToAuditLog(id: string, data: DocumentData): AuditLog {
  return {
    id,
    boatId: data.boatId as string,
    action: data.action as string,
    entityType: data.entityType as string,
    entityId: data.entityId as string,
    performedByUserId: data.performedByUserId as string,
    performedByRole: (data.performedByRole as string) ?? null,
    targetPartnerId: (data.targetPartnerId as string) ?? null,
    details: (data.details as Record<string, unknown>) ?? {},
    createdAt: data.createdAt.toDate(),
  }
}

export function useAuditLogs() {
  const { activeBoatId, isAdmin } = useBoat()
  return useFirestoreQuery(
    ['audit_logs', activeBoatId],
    activeBoatId && isAdmin
      ? () =>
          query(
            collection(db, 'audit_logs'),
            where('boatId', '==', activeBoatId),
            orderBy('createdAt', 'desc'),
            limit(100),
          )
      : null,
    docToAuditLog,
  )
}
