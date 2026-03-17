import { onCall } from 'firebase-functions/v2/https'
import { getFirestore } from 'firebase-admin/firestore'
import { ensureAdmin } from '../shared/auth'
import { Errors } from '../shared/errors'
import { serverTimestamp, getDocOrThrow } from '../shared/firestore'
import { writeAuditLog } from '../audit/writeAuditLog'

interface RevokeInvitationData {
  invitationId: string
}

interface InvitationDoc {
  id: string
  boatId: string
  status: string
  email: string
  role: string
}

export const revokeInvitation = onCall(async (request) => {
  const { invitationId } = request.data as RevokeInvitationData

  if (!invitationId?.trim()) throw Errors.invalidArgument('מזהה ההזמנה הוא שדה חובה')

  const db = getFirestore()
  const invRef = db.doc(`invitations/${invitationId}`)

  const invitation = await getDocOrThrow<InvitationDoc>(invRef, 'ההזמנה')

  const { uid } = await ensureAdmin(request, invitation.boatId)

  if (invitation.status !== 'pending') {
    throw Errors.preconditionFailed('ניתן לבטל רק הזמנות בסטטוס ממתין')
  }

  await invRef.update({
    status: 'cancelled',
    updatedAt: serverTimestamp(),
  })

  await writeAuditLog({
    boatId: invitation.boatId,
    action: 'invitation.revoked',
    performedByUserId: uid,
    entityType: 'invitation',
    entityId: invitationId,
    details: { email: invitation.email, role: invitation.role },
  })

  return { success: true }
})
