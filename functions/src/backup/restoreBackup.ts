import { onCall } from 'firebase-functions/v2/https'
import { getFirestore } from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'
import { ensureAdmin } from '../shared/auth'
import { Errors } from '../shared/errors'
import { writeAuditLog } from '../audit/writeAuditLog'

interface RestoreBackupData {
  backupId: string
  confirm: boolean
}

const BATCH_SIZE = 499 // Firestore batch limit is 500

export const restoreBackup = onCall(async (request) => {
  const { backupId, confirm } = request.data as RestoreBackupData

  if (!backupId) throw Errors.invalidArgument('backupId הוא שדה חובה')
  if (confirm !== true) {
    throw Errors.preconditionFailed('יש לאשר את השחזור במפורש (confirm: true)')
  }

  const db = getFirestore()
  const backupRef = db.doc(`backups/${backupId}`)

  const backupSnap = await backupRef.get()
  if (!backupSnap.exists) throw Errors.notFound('הגיבוי')

  const backupMeta = backupSnap.data()!
  const boatId = backupMeta.boatId as string

  const { uid } = await ensureAdmin(request, boatId)

  const storagePath = backupMeta.storagePath as string

  // Download backup from Storage
  let backupPayload: {
    boatId: string
    data: Record<string, Record<string, unknown>[]>
  }

  try {
    const bucket = getStorage().bucket()
    const file = bucket.file(storagePath)
    const [contents] = await file.download()
    backupPayload = JSON.parse(contents.toString('utf-8'))
  } catch {
    throw Errors.internal('שגיאה בטעינת קובץ הגיבוי מהאחסון')
  }

  if (backupPayload.boatId !== boatId) {
    throw Errors.permissionDenied('הגיבוי אינו שייך לסירה זו')
  }

  const allCollections = backupPayload.data
  let totalRestored = 0

  // Restore each collection in batches
  for (const [collectionName, documents] of Object.entries(allCollections)) {
    if (!Array.isArray(documents) || documents.length === 0) continue

    // Skip the boats collection — don't overwrite boat root
    if (collectionName === 'boats') continue

    // Process in batches
    for (let i = 0; i < documents.length; i += BATCH_SIZE) {
      const chunk = documents.slice(i, i + BATCH_SIZE)
      const batch = db.batch()

      for (const doc of chunk) {
        const { _id, ...data } = doc as { _id: string } & Record<string, unknown>
        if (!_id) continue

        const docRef = db.collection(collectionName).doc(_id)
        batch.set(docRef, data, { merge: false })
        totalRestored++
      }

      await batch.commit()
    }
  }

  await writeAuditLog({
    boatId,
    action: 'backup.restored',
    performedByUserId: uid,
    entityType: 'backup',
    entityId: backupId,
    details: { totalRestored, storagePath },
  })

  return { success: true, totalRestored }
})
