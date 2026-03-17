import { renderHook } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useFeedbackAttachments } from '@/hooks/useFeedbackAttachments'

const mocks = vi.hoisted(() => ({
  boat: { activeBoatId: 'boat-1', isAdmin: false },
  auth: { user: { uid: 'user-1' } as { uid: string } | null },
  useFirestoreQuery: vi.fn(() => ({ data: [], isLoading: false, error: null })),
  collection: vi.fn(() => 'collection-ref'),
  where: vi.fn((...args: unknown[]) => ({ type: 'where', args })),
  orderBy: vi.fn((...args: unknown[]) => ({ type: 'orderBy', args })),
  query: vi.fn((...args: unknown[]) => ({ type: 'query', args })),
}))

vi.mock('@/context/BoatContext', () => ({
  useBoat: () => mocks.boat,
}))

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => mocks.auth,
}))

vi.mock('../../hooks/useFirestoreQuery', () => ({
  useFirestoreQuery: mocks.useFirestoreQuery,
}))

vi.mock('firebase/firestore', () => ({
  collection: mocks.collection,
  where: mocks.where,
  orderBy: mocks.orderBy,
  query: mocks.query,
}))

vi.mock('@/lib/firebase', () => ({
  db: { name: 'db' },
}))

describe('useFeedbackAttachments smoke', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.boat = { activeBoatId: 'boat-1', isAdmin: false }
    mocks.auth = { user: { uid: 'user-1' } }
  })

  it('adds uploadedByUserId filter for non-admin user', () => {
    renderHook(() => useFeedbackAttachments())

    const queryBuilder = (mocks.useFirestoreQuery as unknown as { mock: { calls: unknown[][] } })
      .mock.calls[0]?.[1] as (() => unknown) | null
    expect(queryBuilder).toBeTruthy()
    queryBuilder?.()

    expect(mocks.where).toHaveBeenCalledWith('boatId', '==', 'boat-1')
    expect(mocks.where).toHaveBeenCalledWith('uploadedByUserId', '==', 'user-1')
  })

  it('does not add uploadedByUserId filter for admin', () => {
    mocks.boat = { activeBoatId: 'boat-1', isAdmin: true }
    mocks.auth = { user: { uid: 'admin-1' } }

    renderHook(() => useFeedbackAttachments())

    const queryBuilder = (mocks.useFirestoreQuery as unknown as { mock: { calls: unknown[][] } })
      .mock.calls[0]?.[1] as (() => unknown) | null
    expect(queryBuilder).toBeTruthy()
    queryBuilder?.()

    const whereCalls = mocks.where.mock.calls.map((c) => c.join('|'))
    expect(whereCalls.some((c) => c.includes('uploadedByUserId'))).toBe(false)
    expect(mocks.where).toHaveBeenCalledWith('boatId', '==', 'boat-1')
  })
})
