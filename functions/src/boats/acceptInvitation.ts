import { onCall } from 'firebase-functions/v2/https'
import { getFirestore } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'
import { ensureAuthenticated } from '../shared/auth'
import { Errors } from '../shared/errors'
import { serverTimestamp, increment, runTransaction } from '../shared/firestore'
import { syncCustomClaims } from '../shared/claims'
import { isExpired } from '../shared/dates'
import { writeAuditLog } from '../audit/writeAuditLog'

interface AcceptInvitationData {
  token: string
}

export const acceptInvitation = onCall(async (request) => {
  const uid = ensureAuthenticated(request)
  const { token } = request.data as AcceptInvitationData

  if (!token?.trim()) throw Errors.invalidArgument('טוקן ההזמנה הוא שדה חובה')

  const db = getFirestore()

  // Find invitation by token
  const invSnap = await db
    .collection('invitations')
    .where('token', '==', token.trim())
    .limit(1)
    .get()

  if (invSnap.empty) throw Errors.notFound('ההזמנה')

  const invDoc = invSnap.docs[0]
  const invitation = invDoc.data()

  // Validate invitation
  if (invitation.status === 'accepted') throw Errors.invitationAlreadyUsed()
  if (invitation.status === 'cancelled' || invitation.status === 'expired') {
    throw Errors.invitationExpired()
  }
  if (invitation.status !== 'pending') throw Errors.invitationExpired()
  if (isExpired(invitation.expiresAt)) throw Errors.invitationExpired()

  const boatId = invitation.boatId as string

  // Check user email matches invitation email (soft check — log if mismatch but allow)
  const authUser = await getAuth().getUser(uid)
  const userEmail = authUser.email?.toLowerCase() ?? ''
  if (userEmail !== invitation.email) {
    throw Errors.permissionDenied('כתובת האימייל אינה תואמת להזמנה')
  }

  // Check not already an active member
  const memberRef = db.doc(`boat_members/${uid}_${boatId}`)
  const existingMember = await memberRef.get()
  if (existingMember.exists && existingMember.data()?.status === 'active') {
    throw Errors.alreadyExists('הינך כבר חבר פעיל בסירה זו')
  }

  const partnerId = db.collection('partners').doc().id
  const boatRef = db.doc(`boats/${boatId}`)
  const now = serverTimestamp()

  // Get user doc for partner info
  let fullName = authUser.displayName ?? ''
  let email = authUser.email ?? ''
  let phone: string | null = null
  try {
    const userDoc = await db.doc(`users/${uid}`).get()
    if (userDoc.exists) {
      const userData = userDoc.data()!
      fullName = (userData.fullName as string) || fullName
      email = (userData.email as string) || email
      phone = (userData.phone as string | null) ?? null
    }
  } catch {
    // Use auth data as fallback
  }

  await runTransaction(async (transaction) => {
    // Re-read invitation inside transaction to prevent double acceptance
    const invTransactionSnap = await transaction.get(invDoc.ref)
    if (!invTransactionSnap.exists) throw Errors.notFound('ההזמנה')
    const invData = invTransactionSnap.data()!
    if (invData.status !== 'pending') throw Errors.invitationAlreadyUsed()

    // Create boat_member
    transaction.set(memberRef, {
      boatId,
      userId: uid,
      partnerId,
      role: invitation.role,
      status: 'active',
      invitedByUserId: invitation.invitedByUserId,
      invitedAt: invitation.createdAt,
      joinedAt: now,
      createdAt: now,
      updatedAt: now,
    })

    // Create partner
    transaction.set(db.doc(`partners/${partnerId}`), {
      boatId,
      userId: uid,
      fullName,
      email,
      phone,
      status: 'active',
      weekdayCreditsBalance: 0,
      weekendCreditsBalance: 0,
      financialStatus: 'active',
      joinedAt: now,
      createdAt: now,
      updatedAt: now,
      notes: null,
    })

    // Update invitation
    transaction.update(invDoc.ref, {
      status: 'accepted',
      acceptedAt: now,
      acceptedByUserId: uid,
    })

    // Increment boat memberCount
    transaction.update(boatRef, {
      memberCount: increment(1),
      updatedAt: now,
    })
  })

  // Sync Custom Claims (outside transaction)
  await syncCustomClaims(uid)

  await writeAuditLog({
    boatId,
    action: 'member.joined',
    performedByUserId: uid,
    entityType: 'boat_member',
    entityId: `${uid}_${boatId}`,
    details: { role: invitation.role, invitationId: invDoc.id },
  })

  return { success: true, boatId, partnerId }
})
