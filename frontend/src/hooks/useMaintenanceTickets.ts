import { collection, query, where, doc, type DocumentData } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useBoat } from '@/context/BoatContext'
import { useFirestoreQuery } from './useFirestoreQuery'
import { useFirestoreDoc } from './useFirestoreDoc'
import type { MaintenanceTicket, MaintenanceUpdate, MaintenanceAttachment } from '@/types'

function docToTicket(id: string, data: DocumentData): MaintenanceTicket {
  return {
    id,
    boatId: data.boatId as string,
    title: data.title as string,
    description: data.description as string,
    category: data.category as MaintenanceTicket['category'],
    priority: data.priority as MaintenanceTicket['priority'],
    status: data.status as MaintenanceTicket['status'],
    createdByUserId: data.createdByUserId as string,
    createdByPartnerId: (data.createdByPartnerId as string) ?? null,
    assignedToUserId: (data.assignedToUserId as string) ?? null,
    attachmentCount: (data.attachmentCount as number) ?? 0,
    createdAt: data.createdAt.toDate(),
    updatedAt: data.updatedAt.toDate(),
    resolvedAt: data.resolvedAt ? data.resolvedAt.toDate() : null,
    closedAt: data.closedAt ? data.closedAt.toDate() : null,
  }
}

function docToUpdate(id: string, data: DocumentData): MaintenanceUpdate {
  return {
    id,
    boatId: data.boatId as string,
    ticketId: data.ticketId as string,
    comment: data.comment as string,
    statusBefore: (data.statusBefore as MaintenanceUpdate['statusBefore']) ?? null,
    statusAfter: (data.statusAfter as MaintenanceUpdate['statusAfter']) ?? null,
    createdByUserId: data.createdByUserId as string,
    createdAt: data.createdAt.toDate(),
  }
}

function docToAttachment(id: string, data: DocumentData): MaintenanceAttachment {
  return {
    id,
    boatId: data.boatId as string,
    ticketId: data.ticketId as string,
    storagePath: data.storagePath as string,
    fileName: data.fileName as string,
    contentType: data.contentType as string,
    sizeBytes: (data.sizeBytes as number) ?? 0,
    uploadedByUserId: data.uploadedByUserId as string,
    createdAt: data.createdAt.toDate(),
  }
}

export function useMaintenanceTickets() {
  const { activeBoatId } = useBoat()
  const result = useFirestoreQuery(
    ['maintenance_tickets', activeBoatId],
    activeBoatId
      ? () =>
          query(
            collection(db, 'maintenance_tickets'),
            where('boatId', '==', activeBoatId),
          )
      : null,
    docToTicket,
  )

  const data = result.data
    ?.slice()
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

  return { ...result, data }
}

export function useMaintenanceTicket(ticketId: string | undefined) {
  return useFirestoreDoc(
    ['maintenance_ticket', ticketId],
    ticketId ? doc(db, 'maintenance_tickets', ticketId) : null,
    docToTicket,
  )
}

export function useMaintenanceUpdates(ticketId: string | undefined) {
  const result = useFirestoreQuery(
    ['maintenance_updates', ticketId],
    ticketId
      ? () =>
          query(
            collection(db, 'maintenance_updates'),
            where('ticketId', '==', ticketId),
          )
      : null,
    docToUpdate,
  )

  const data = result.data
    ?.slice()
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())

  return { ...result, data }
}

export function useMaintenanceAttachments(ticketId: string | undefined) {
  const { activeBoatId } = useBoat()
  const result = useFirestoreQuery(
    ['maintenance_attachments', ticketId],
    activeBoatId && ticketId
      ? () =>
          query(
            collection(db, 'maintenance_attachments'),
            where('boatId', '==', activeBoatId),
            where('ticketId', '==', ticketId),
          )
      : null,
    docToAttachment,
  )

  const data = result.data
    ?.slice()
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

  return { ...result, data }
}
