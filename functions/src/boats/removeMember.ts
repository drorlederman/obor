import { onCall } from 'firebase-functions/v2/https'
import { getFirestore } from 'firebase-admin/firestore'
import { ensureAdmin } from '../shared/auth'
import { Errors } from '../shared/errors'
import { serverTimestamp, increment, runTransaction } from '../shared/firestore'
import { removeFromCustomClaims } from '../shared/claims'
import { writeAuditLog } from '../audit/writeAuditLog'

interface RemoveMemberData {
  boatId: string
  userId: string
}

export const removeMember = onCall(async (request) => {
  const { boatId, userId: targetUserId } = request.data as RemoveMemberData

  if (!boatId) throw Errors.invalidArgument('boatId הוא שדה חובה')
  if (!targetUserId) throw Errors.invalidArgument('userId הוא שדה חובה')

  const { uid } = await ensureAdmin(request, boatId)

  const db = getFirestore()
  const memberRef = db.doc(`boat_members/${targetUserId}_${boatId}`)
  const boatRef = db.doc(`boats/${boatId}`)

  // Load target member
  const memberSnap = await memberRef.get()
  if (!memberSnap.exists) throw Errors.membershipNotFound()

  const memberData = memberSnap.data()!
  if (memberData.status === 'removed') {
    throw Errors.preconditionFailed('השותף כבר הוסר')
  }

  // Prevent removing the last admin
  if (memberData.role === 'admin') {
    const adminSnap = await db
      .collection('boat_members')
      .where('boatId', '==', boatId)
      .where('role', '==', 'admin')
      .where('status', '==', 'active')
      .get()

    if (adminSnap.size <= 1) {
      throw Errors.preconditionFailed('לא ניתן להסיר את המנהל האחרון של הסירה')
    }
  }

  // Find partner document
  const partnerSnap = await db
    .collection('partners')
    .where('boatId', '==', boatId)
    .where('userId', '==', targetUserId)
    .limit(1)
    .get()

  await runTransaction(async (transaction) => {
    // Update boat_member
    transaction.update(memberRef, {
      status: 'removed',
      updatedAt: serverTimestamp(),
    })

    // Update partner if exists
    if (!partnerSnap.empty) {
      transaction.update(partnerSnap.docs[0].ref, {
        status: 'removed',
        updatedAt: serverTimestamp(),
      })
    }

    // Decrement memberCount
    transaction.update(boatRef, {
      memberCount: increment(-1),
      updatedAt: serverTimestamp(),
    })
  })

  // Remove from Custom Claims (outside transaction)
  await removeFromCustomClaims(targetUserId, boatId)

  await writeAuditLog({
    boatId,
    action: 'member.removed',
    performedByUserId: uid,
    entityType: 'boat_member',
    entityId: `${targetUserId}_${boatId}`,
    details: { removedUserId: targetUserId },
  })

  return { success: true }
})
