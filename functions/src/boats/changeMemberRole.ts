import { onCall } from 'firebase-functions/v2/https'
import { getFirestore } from 'firebase-admin/firestore'
import { ensureAdmin } from '../shared/auth'
import type { MemberRole } from '../shared/auth'
import { Errors } from '../shared/errors'
import { serverTimestamp } from '../shared/firestore'
import { updateCustomClaims } from '../shared/claims'
import { writeAuditLog } from '../audit/writeAuditLog'

interface ChangeMemberRoleData {
  boatId: string
  userId: string
  newRole: MemberRole
}

const VALID_ROLES: MemberRole[] = ['partner', 'scheduler', 'treasurer', 'maintenanceManager', 'admin']

export const changeMemberRole = onCall(async (request) => {
  const { boatId, userId: targetUserId, newRole } = request.data as ChangeMemberRoleData

  if (!boatId) throw Errors.invalidArgument('boatId הוא שדה חובה')
  if (!targetUserId) throw Errors.invalidArgument('userId הוא שדה חובה')
  if (!VALID_ROLES.includes(newRole)) throw Errors.invalidArgument('תפקיד לא תקין')

  const { uid } = await ensureAdmin(request, boatId)

  const db = getFirestore()
  const memberRef = db.doc(`boat_members/${targetUserId}_${boatId}`)

  const memberSnap = await memberRef.get()
  if (!memberSnap.exists) throw Errors.membershipNotFound()

  const memberData = memberSnap.data()!
  if (memberData.status === 'removed') {
    throw Errors.preconditionFailed('לא ניתן לשנות תפקיד לשותף שהוסר')
  }

  const currentRole = memberData.role as MemberRole

  // If demoting an admin, ensure it's not the last one
  if (currentRole === 'admin' && newRole !== 'admin') {
    const adminSnap = await db
      .collection('boat_members')
      .where('boatId', '==', boatId)
      .where('role', '==', 'admin')
      .where('status', '==', 'active')
      .get()

    if (adminSnap.size <= 1) {
      throw Errors.preconditionFailed('לא ניתן להוריד את המנהל האחרון של הסירה')
    }
  }

  if (currentRole === newRole) {
    throw Errors.preconditionFailed('התפקיד החדש זהה לתפקיד הנוכחי')
  }

  await memberRef.update({
    role: newRole,
    updatedAt: serverTimestamp(),
  })

  // Sync Custom Claims
  await updateCustomClaims(targetUserId, boatId, {
    role: newRole,
    status: memberData.status,
  })

  await writeAuditLog({
    boatId,
    action: 'member.role_changed',
    performedByUserId: uid,
    entityType: 'boat_member',
    entityId: `${targetUserId}_${boatId}`,
    details: { targetUserId, previousRole: currentRole, newRole },
  })

  return { success: true }
})
