import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import type { MemberRole, MemberStatus } from './auth'

interface MembershipClaim {
  role: MemberRole
  status: MemberStatus
  boatName?: string
}

/**
 * Syncs Custom Claims for a user by reading all their boat_members documents.
 * Call this after any membership change.
 */
export async function syncCustomClaims(userId: string): Promise<void> {
  const db = getFirestore()
  const auth = getAuth()

  const membershipsSnap = await db
    .collection('boat_members')
    .where('userId', '==', userId)
    .get()

  const memberships: Record<string, MembershipClaim> = {}

  for (const doc of membershipsSnap.docs) {
    const data = doc.data()
    const boatId = data.boatId as string

    // Get boat name for UI display
    let boatName: string | undefined
    try {
      const boatDoc = await db.doc(`boats/${boatId}`).get()
      boatName = boatDoc.data()?.name as string | undefined
    } catch {
      // Non-critical
    }

    memberships[boatId] = {
      role: data.role as MemberRole,
      status: data.status as MemberStatus,
      boatName,
    }
  }

  await auth.setCustomUserClaims(userId, { memberships })
}

/**
 * Adds or updates a single boat membership in Custom Claims.
 * More efficient than full sync when only one boat changes.
 */
export async function updateCustomClaims(
  userId: string,
  boatId: string,
  membership: MembershipClaim,
): Promise<void> {
  const auth = getAuth()
  const user = await auth.getUser(userId)
  const existing = (user.customClaims ?? {}) as { memberships?: Record<string, MembershipClaim> }
  const currentMemberships = existing.memberships ?? {}

  await auth.setCustomUserClaims(userId, {
    memberships: {
      ...currentMemberships,
      [boatId]: membership,
    },
  })
}

/**
 * Removes a boat from a user's Custom Claims.
 */
export async function removeFromCustomClaims(userId: string, boatId: string): Promise<void> {
  const auth = getAuth()
  const user = await auth.getUser(userId)
  const existing = (user.customClaims ?? {}) as { memberships?: Record<string, MembershipClaim> }
  const currentMemberships = { ...(existing.memberships ?? {}) }
  delete currentMemberships[boatId]

  await auth.setCustomUserClaims(userId, { memberships: currentMemberships })
}
