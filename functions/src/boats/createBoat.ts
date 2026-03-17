import { onCall } from 'firebase-functions/v2/https'
import { getFirestore } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'
import { ensureAuthenticated } from '../shared/auth'
import { Errors } from '../shared/errors'
import { serverTimestamp } from '../shared/firestore'
import { updateCustomClaims } from '../shared/claims'
import { writeAuditLog } from '../audit/writeAuditLog'

interface CreateBoatData {
  name: string
  code: string
  homeMarina?: string | null
}

export const createBoat = onCall(async (request) => {
  const uid = ensureAuthenticated(request)
  const { name, code, homeMarina = null } = request.data as CreateBoatData

  if (!name?.trim()) throw Errors.invalidArgument('שם הסירה הוא שדה חובה')
  if (!code?.trim()) throw Errors.invalidArgument('קוד הסירה הוא שדה חובה')

  const db = getFirestore()

  // Check code uniqueness
  const codeSnap = await db.collection('boats').where('code', '==', code.trim()).get()
  if (!codeSnap.empty) throw Errors.alreadyExists('קוד הסירה')

  // Get user profile for partner name
  let fullName = ''
  let email = ''
  let phone: string | null = null
  try {
    const userDoc = await db.doc(`users/${uid}`).get()
    const userData = userDoc.data() ?? {}
    fullName = (userData.fullName as string) ?? ''
    email = (userData.email as string) ?? ''
    phone = (userData.phone as string | null) ?? null
  } catch {
    // If user doc doesn't exist yet, fall back to auth
    const authUser = await getAuth().getUser(uid)
    email = authUser.email ?? ''
    fullName = authUser.displayName ?? ''
  }

  const boatRef = db.collection('boats').doc()
  const boatId = boatRef.id
  const partnerRef = db.collection('partners').doc()
  const partnerId = partnerRef.id
  const now = serverTimestamp()

  const batch = db.batch()

  // Boat
  batch.set(boatRef, {
    name: name.trim(),
    code: code.trim().toUpperCase(),
    status: 'active',
    homeMarina: homeMarina ?? null,
    ownerUserId: uid,
    memberCount: 1,
    createdAt: now,
    updatedAt: now,
  })

  // boat_members
  batch.set(db.doc(`boat_members/${uid}_${boatId}`), {
    boatId,
    userId: uid,
    partnerId,
    role: 'admin',
    status: 'active',
    invitedByUserId: null,
    invitedAt: null,
    joinedAt: now,
    createdAt: now,
    updatedAt: now,
  })

  // partners
  batch.set(partnerRef, {
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

  // system_settings (3 docs)
  batch.set(db.doc(`system_settings/${boatId}_credits`), {
    boatId,
    type: 'credits',
    dayCreditCost: 1,
    weekendCreditCost: 2,
    updatedAt: now,
  })
  batch.set(db.doc(`system_settings/${boatId}_notifications`), {
    boatId,
    type: 'notifications',
    paymentReminderDays: 7,
    announcements: true,
    maintenance: true,
    invoices: true,
    bookingReminders: true,
    updatedAt: now,
  })
  batch.set(db.doc(`system_settings/${boatId}_weather`), {
    boatId,
    type: 'weather',
    locationLat: null,
    locationLng: null,
    updatedAt: now,
  })

  await batch.commit()

  // Update Custom Claims
  await updateCustomClaims(uid, boatId, { role: 'admin', status: 'active', boatName: name.trim() })

  // Audit log
  await writeAuditLog({
    boatId,
    action: 'boat.created',
    performedByUserId: uid,
    entityType: 'boat',
    entityId: boatId,
    details: { name: name.trim(), code: code.trim().toUpperCase() },
  })

  return { success: true, boatId, partnerId }
})
