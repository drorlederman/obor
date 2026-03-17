import { onCall } from 'firebase-functions/v2/https'
import { getFirestore } from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'
import { ensureAdmin } from '../shared/auth'
import { Errors } from '../shared/errors'
import { serverTimestamp } from '../shared/firestore'
import { writeAuditLog } from '../audit/writeAuditLog'

interface CreateSystemBackupData {
  boatId: string
  notes?: string | null
}

const BOAT_COLLECTIONS = [
  'bookings',
  'credit_transactions',
  'charges',
  'partner_invoices',
  'payments',
  'maintenance_tickets',
  'maintenance_updates',
  'maintenance_attachments',
  'announcements',
  'checklists',
  'checklist_runs',
  'contacts',
  'feedback_reports',
  'system_settings',
  'partners',
  'invitations',
]

export const createSystemBackup = onCall(async (request) => {
  const { boatId, notes = null } = request.data as CreateSystemBackupData

  if (!boatId) throw Errors.invalidArgument('boatId הוא שדה חובה')

  const { uid } = await ensureAdmin(request, boatId)

  const db = getFirestore()

  // Export all boat-scoped data
  const backupData: Record<string, Record<string, unknown>[]> = {}
  let totalDocuments = 0

  for (const collectionName of BOAT_COLLECTIONS) {
    try {
      const snap = await db
        .collection(collectionName)
        .where('boatId', '==', boatId)
        .get()

      backupData[collectionName] = snap.docs.map((doc) => ({
        _id: doc.id,
        ...doc.data(),
      }))
      totalDocuments += snap.size
    } catch {
      backupData[collectionName] = []
    }
  }

  // Also export boat_members (uses compound doc ID, not boatId field but does have boatId)
  try {
    const membersSnap = await db
      .collection('boat_members')
      .where('boatId', '==', boatId)
      .get()
    backupData['boat_members'] = membersSnap.docs.map((doc) => ({
      _id: doc.id,
      ...doc.data(),
    }))
    totalDocuments += membersSnap.size
  } catch {
    backupData['boat_members'] = []
  }

  // Get boat metadata
  const boatDoc = await db.doc(`boats/${boatId}`).get()
  if (boatDoc.exists) {
    backupData['boats'] = [{ _id: boatId, ...boatDoc.data() }]
    totalDocuments += 1
  }

  const backupPayload = {
    boatId,
    exportedAt: new Date().toISOString(),
    totalDocuments,
    collections: Object.keys(backupData),
    data: backupData,
  }

  // Upload to Firebase Storage
  const backupRef = db.collection('backups').doc()
  const backupId = backupRef.id
  const storagePath = `boats/${boatId}/backups/${backupId}.json`

  try {
    const bucket = getStorage().bucket()
    const file = bucket.file(storagePath)
    await file.save(JSON.stringify(backupPayload, null, 2), {
      contentType: 'application/json',
      metadata: {
        boatId,
        backupId,
        createdByUserId: uid,
      },
    })
  } catch (err) {
    throw Errors.internal('שגיאה בשמירת הגיבוי לאחסון')
  }

  // Create backup metadata
  await backupRef.set({
    boatId,
    storagePath,
    notes: notes ?? null,
    totalDocuments,
    collections: Object.keys(backupData),
    status: 'completed',
    createdByUserId: uid,
    createdAt: serverTimestamp(),
  })

  await writeAuditLog({
    boatId,
    action: 'backup.created',
    performedByUserId: uid,
    entityType: 'backup',
    entityId: backupId,
    details: { totalDocuments, storagePath },
  })

  return { success: true, backupId, totalDocuments }
})
