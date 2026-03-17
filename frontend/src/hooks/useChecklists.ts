import { collection, query, where, doc, type DocumentData } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useBoat } from '@/context/BoatContext'
import { useFirestoreQuery } from './useFirestoreQuery'
import { useFirestoreDoc } from './useFirestoreDoc'
import type { Checklist, ChecklistItem } from '@/types'

function mapChecklist(id: string, data: DocumentData): Checklist {
  return {
    id,
    boatId: data.boatId as string,
    type: data.type as Checklist['type'],
    title: data.title as string,
    items: ((data.items as ChecklistItem[]) ?? []).sort((a, b) => a.sortOrder - b.sortOrder),
    isActive: data.isActive as boolean,
    createdAt: data.createdAt.toDate(),
    updatedAt: data.updatedAt.toDate(),
  }
}

export function useChecklists() {
  const { activeBoatId } = useBoat()
  return useFirestoreQuery(
    ['checklists', activeBoatId],
    activeBoatId
      ? () =>
          query(
            collection(db, 'checklists'),
            where('boatId', '==', activeBoatId),
            where('isActive', '==', true),
          )
      : null,
    mapChecklist,
  )
}

export function useChecklist(id?: string) {
  return useFirestoreDoc(
    ['checklist', id],
    id ? doc(db, 'checklists', id) : null,
    mapChecklist,
  )
}
