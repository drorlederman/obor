import { collection, query, where, orderBy, doc, type DocumentData } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useBoat } from '@/context/BoatContext'
import { useFirestoreQuery } from './useFirestoreQuery'
import { useFirestoreDoc } from './useFirestoreDoc'
import type { MaintenanceTicket, MaintenanceUpdate } from '@/types'

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

export function useMaintenanceTickets() {
  const { activeBoatId } = useBoat()
  return useFirestoreQuery(
    ['maintenance_tickets', activeBoatId],
    activeBoatId
      ? () =>
          query(
            collection(db, 'maintenance_tickets'),
            where('boatId', '==', activeBoatId),
            orderBy('createdAt', 'desc'),
          )
      : null,
    docToTicket,
  )
}

export function useMaintenanceTicket(ticketId: string | undefined) {
  return useFirestoreDoc(
    ['maintenance_ticket', ticketId],
    ticketId ? doc(db, 'maintenance_tickets', ticketId) : null,
    docToTicket,
  )
}

export function useMaintenanceUpdates(ticketId: string | undefined) {
  return useFirestoreQuery(
    ['maintenance_updates', ticketId],
    ticketId
      ? () =>
          query(
            collection(db, 'maintenance_updates'),
            where('ticketId', '==', ticketId),
            orderBy('createdAt', 'asc'),
          )
      : null,
    docToUpdate,
  )
}
