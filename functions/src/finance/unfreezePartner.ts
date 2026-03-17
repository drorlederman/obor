import { onCall } from 'firebase-functions/v2/https'
import { getFirestore } from 'firebase-admin/firestore'
import { ensureRoleIn } from '../shared/auth'
import { Errors } from '../shared/errors'
import { serverTimestamp } from '../shared/firestore'
import { writeAuditLog } from '../audit/writeAuditLog'

interface UnfreezePartnerData {
  boatId: string
  partnerId: string
}

export const unfreezePartner = onCall(async (request) => {
  const { boatId, partnerId } = request.data as UnfreezePartnerData

  if (!boatId) throw Errors.invalidArgument('boatId הוא שדה חובה')
  if (!partnerId) throw Errors.invalidArgument('partnerId הוא שדה חובה')

  const { uid } = await ensureRoleIn(request, boatId, ['treasurer', 'admin'])

  const db = getFirestore()
  const partnerRef = db.doc(`partners/${partnerId}`)
  const partnerSnap = await partnerRef.get()

  if (!partnerSnap.exists) throw Errors.notFound('השותף')
  const partner = partnerSnap.data()!

  if (partner.boatId !== boatId) throw Errors.permissionDenied('השותף אינו שייך לסירה זו')
  if (partner.financialStatus !== 'frozen') {
    throw Errors.preconditionFailed('השותף אינו מוקפא פיננסית')
  }

  await partnerRef.update({
    financialStatus: 'active',
    updatedAt: serverTimestamp(),
  })

  await writeAuditLog({
    boatId,
    action: 'member.unfrozen',
    performedByUserId: uid,
    entityType: 'partner',
    entityId: partnerId,
    details: { partnerId },
  })

  return { success: true }
})
