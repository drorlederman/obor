import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi } from 'vitest'
import NotificationsSettingsPage from '@/features/settings/pages/NotificationsSettingsPage'

const mocks = vi.hoisted(() => ({
  setDoc: vi.fn(),
  doc: vi.fn(),
  serverTimestamp: vi.fn(),
  setQueryData: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}))

vi.mock('@/context/BoatContext', () => ({
  useBoat: () => ({ activeBoatId: 'boat-1' }),
}))

vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({
    data: {
      announcements: true,
      maintenance: true,
      invoices: true,
      bookingReminders: true,
    },
    isLoading: false,
    error: null,
  }),
  useQueryClient: () => ({ setQueryData: mocks.setQueryData }),
}))

vi.mock('firebase/firestore', () => ({
  setDoc: mocks.setDoc,
  doc: mocks.doc,
  serverTimestamp: mocks.serverTimestamp,
  getDoc: vi.fn(),
}))

vi.mock('@/lib/firebase', () => ({
  db: {},
}))

vi.mock('react-hot-toast', () => ({
  __esModule: true,
  default: { success: mocks.toastSuccess, error: mocks.toastError },
}))

describe('NotificationsSettingsPage smoke', () => {
  it('persists notification toggle to Firestore', async () => {
    mocks.setDoc.mockResolvedValue(undefined)
    mocks.doc.mockReturnValue('settings-doc-ref')
    mocks.serverTimestamp.mockReturnValue('ts')

    render(
      <MemoryRouter>
        <NotificationsSettingsPage />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByText('עדכוני תחזוקה'))

    await waitFor(() => {
      expect(mocks.setDoc).toHaveBeenCalledWith(
        'settings-doc-ref',
        expect.objectContaining({
          boatId: 'boat-1',
          type: 'notifications',
          maintenance: false,
        }),
        { merge: true },
      )
      expect(mocks.setQueryData).toHaveBeenCalled()
      expect(mocks.toastSuccess).toHaveBeenCalledWith('ההגדרה עודכנה')
    })
  })
})
