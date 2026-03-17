import { onCall } from 'firebase-functions/v2/https'
import { getFirestore } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'
import { ensureAdmin } from '../shared/auth'
import type { MemberRole } from '../shared/auth'
import { Errors } from '../shared/errors'
import { serverTimestamp } from '../shared/firestore'
import { daysFromNow } from '../shared/dates'
import { writeAuditLog } from '../audit/writeAuditLog'
import { randomUUID } from 'crypto'
import { sendInvitationEmail } from '../shared/email'

interface InvitePartnerData {
  boatId: string
  email: string
  role: MemberRole
}

const VALID_ROLES: MemberRole[] = ['partner', 'scheduler', 'treasurer', 'maintenanceManager', 'admin']

export const invitePartner = onCall(async (request) => {
  const { boatId, email, role } = request.data as InvitePartnerData

  if (!boatId) throw Errors.invalidArgument('boatId הוא שדה חובה')
  if (!email?.trim()) throw Errors.invalidArgument('כתובת אימייל היא שדה חובה')
  if (!VALID_ROLES.includes(role)) throw Errors.invalidArgument('תפקיד לא תקין')

  const { uid } = await ensureAdmin(request, boatId)

  const db = getFirestore()
  const normalizedEmail = email.trim().toLowerCase()

  // Check if user with this email already exists and is an active member
  try {
    const existingUser = await getAuth().getUserByEmail(normalizedEmail)
    const memberDoc = await db.doc(`boat_members/${existingUser.uid}_${boatId}`).get()
    if (memberDoc.exists) {
      const memberData = memberDoc.data()!
      if (memberData.status === 'active') {
        throw Errors.alreadyExists('שותף עם אימייל זה כבר חבר פעיל בסירה')
      }
    }
  } catch (err: unknown) {
    // User doesn't exist in Auth yet — invitation is still valid
    if (err instanceof Error && err.message?.includes('There is no user record')) {
      // Fine — user will sign up later
    } else {
      const isHttpsError = err !== null && typeof err === 'object' && 'code' in err
      if (isHttpsError) throw err // Re-throw our own errors
    }
  }

  // Check for pending invitation for this email+boat
  const pendingSnap = await db
    .collection('invitations')
    .where('boatId', '==', boatId)
    .where('email', '==', normalizedEmail)
    .where('status', '==', 'pending')
    .get()

  if (!pendingSnap.empty) {
    throw Errors.alreadyExists('קיימת הזמנה פעילה לאימייל זה')
  }

  // Get boat name for the invitation
  const boatDoc = await db.doc(`boats/${boatId}`).get()
  if (!boatDoc.exists) throw Errors.boatNotFound()
  const boatName = (boatDoc.data()!.name as string) ?? ''

  const token = randomUUID()
  const invitationRef = db.collection('invitations').doc()

  await invitationRef.set({
    boatId,
    boatName,
    email: normalizedEmail,
    role,
    token,
    status: 'pending',
    invitedByUserId: uid,
    createdAt: serverTimestamp(),
    expiresAt: daysFromNow(7),
    acceptedAt: null,
    acceptedByUserId: null,
  })

  await writeAuditLog({
    boatId,
    action: 'member.invited',
    performedByUserId: uid,
    entityType: 'invitation',
    entityId: invitationRef.id,
    details: { email: normalizedEmail, role },
  })

  // Send invitation email (non-blocking — don't fail if email fails)
  sendInvitationEmail(normalizedEmail, boatName, token).catch((err) =>
    console.error('sendInvitationEmail failed:', err),
  )

  return { success: true, invitationId: invitationRef.id, token }
})
