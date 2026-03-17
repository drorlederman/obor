import { CallableRequest } from 'firebase-functions/v2/https'
import { getFirestore } from 'firebase-admin/firestore'
import { Errors } from './errors'

export type MemberRole = 'partner' | 'scheduler' | 'treasurer' | 'maintenanceManager' | 'admin'
export type MemberStatus = 'active' | 'removed'

interface ClaimMembership {
  role: MemberRole
  status: MemberStatus
}

/**
 * Ensures the request is authenticated. Returns the uid.
 */
export function ensureAuthenticated(request: CallableRequest): string {
  if (!request.auth?.uid) {
    throw Errors.unauthenticated()
  }
  return request.auth.uid
}

/**
 * Ensures the authenticated user is an active member of the given boat.
 * Checks Custom Claims first (fast path), falls back to Firestore (slow path).
 */
export async function ensureActiveMemberOf(
  request: CallableRequest,
  boatId: string,
): Promise<{ uid: string; role: MemberRole }> {
  const uid = ensureAuthenticated(request)

  // Fast path: check Custom Claims
  const claims = request.auth!.token as { memberships?: Record<string, ClaimMembership> }
  const claimMembership = claims.memberships?.[boatId]

  if (claimMembership?.status === 'active') {
    return { uid, role: claimMembership.role }
  }

  // Slow path: fallback to Firestore (handles stale tokens)
  const db = getFirestore()
  const memberDoc = await db.doc(`boat_members/${uid}_${boatId}`).get()

  if (!memberDoc.exists) {
    throw Errors.permissionDenied('אינך חבר בסירה זו')
  }

  const data = memberDoc.data() as { role: MemberRole; status: MemberStatus }

  if (data.status !== 'active') {
    throw Errors.frozenPartner()
  }

  return { uid, role: data.role }
}

/**
 * Ensures the user has one of the specified roles in the boat.
 */
export async function ensureRoleIn(
  request: CallableRequest,
  boatId: string,
  allowedRoles: MemberRole[],
): Promise<{ uid: string; role: MemberRole }> {
  const membership = await ensureActiveMemberOf(request, boatId)

  if (!allowedRoles.includes(membership.role)) {
    throw Errors.permissionDenied()
  }

  return membership
}

/**
 * Ensures the user is an admin of the given boat.
 */
export async function ensureAdmin(
  request: CallableRequest,
  boatId: string,
): Promise<{ uid: string; role: MemberRole }> {
  return ensureRoleIn(request, boatId, ['admin'])
}
