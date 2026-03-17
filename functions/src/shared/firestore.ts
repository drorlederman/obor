import {
  getFirestore,
  FieldValue,
  DocumentReference,
  DocumentSnapshot,
  Transaction,
} from 'firebase-admin/firestore'
import { Errors } from './errors'

/**
 * Gets a document and throws a typed error if it doesn't exist.
 */
export async function getDocOrThrow<T>(
  ref: DocumentReference,
  notFoundMessage?: string,
): Promise<T> {
  const snap = await ref.get()
  if (!snap.exists) {
    throw Errors.notFound(notFoundMessage)
  }
  return { id: snap.id, ...snap.data() } as T
}

/**
 * Gets a document inside a transaction and throws if it doesn't exist.
 */
export async function getDocInTransactionOrThrow<T>(
  transaction: Transaction,
  ref: DocumentReference,
  notFoundMessage?: string,
): Promise<{ snap: DocumentSnapshot; data: T }> {
  const snap = await transaction.get(ref)
  if (!snap.exists) {
    throw Errors.notFound(notFoundMessage)
  }
  return { snap, data: { id: snap.id, ...snap.data() } as T }
}

/**
 * Runs a Firestore transaction with a typed callback.
 */
export async function runTransaction<T>(
  callback: (transaction: Transaction) => Promise<T>,
): Promise<T> {
  const db = getFirestore()
  return db.runTransaction(callback)
}

/**
 * Returns a serverTimestamp field value.
 */
export function serverTimestamp() {
  return FieldValue.serverTimestamp()
}

/**
 * Returns an increment field value.
 */
export function increment(n: number) {
  return FieldValue.increment(n)
}
