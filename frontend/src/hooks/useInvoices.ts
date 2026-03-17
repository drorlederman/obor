import { collection, query, where, orderBy, type DocumentData } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useBoat } from '@/context/BoatContext'
import { usePartner } from './usePartner'
import { useFirestoreQuery } from './useFirestoreQuery'
import type { PartnerInvoice } from '@/types'

function docToInvoice(id: string, data: DocumentData): PartnerInvoice {
  return {
    id,
    boatId: data.boatId as string,
    chargeId: data.chargeId as string,
    partnerId: data.partnerId as string,
    amount: data.amount as number,
    amountPaid: (data.amountPaid as number) ?? 0,
    amountRemaining: (data.amountRemaining as number) ?? (data.amount as number),
    status: data.status as PartnerInvoice['status'],
    dueDate: data.dueDate.toDate(),
    createdAt: data.createdAt.toDate(),
    updatedAt: data.updatedAt.toDate(),
    lastPaymentAt: data.lastPaymentAt ? data.lastPaymentAt.toDate() : null,
  }
}

/** Returns all invoices (treasurer/admin) or only the current partner's invoices. */
export function useInvoices() {
  const { activeBoatId, isTreasurer, isAdmin } = useBoat()
  const { data: partner } = usePartner()
  const canSeeAll = isTreasurer || isAdmin
  const enabled = !!activeBoatId && (canSeeAll || !!partner?.id)

  return useFirestoreQuery(
    ['invoices', activeBoatId, canSeeAll ? 'all' : partner?.id],
    enabled
      ? () =>
          canSeeAll
            ? query(
                collection(db, 'partner_invoices'),
                where('boatId', '==', activeBoatId),
                orderBy('dueDate', 'desc'),
              )
            : query(
                collection(db, 'partner_invoices'),
                where('boatId', '==', activeBoatId),
                where('partnerId', '==', partner!.id),
                orderBy('dueDate', 'desc'),
              )
      : null,
    docToInvoice,
  )
}
