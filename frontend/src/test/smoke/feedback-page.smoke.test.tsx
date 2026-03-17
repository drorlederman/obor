import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import FeedbackPage from '@/features/feedback/pages/FeedbackPage'

const mocks = vi.hoisted(() => ({
  invalidateQueries: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  runTransaction: vi.fn(),
  doc: vi.fn(),
  ref: vi.fn(),
  deleteObject: vi.fn(),
  serverTimestamp: vi.fn(() => 'ts'),
  feedbackAttachments: [] as Array<{
    id: string
    reportId: string
    storagePath: string
    fileName: string
    contentType: string
    sizeBytes: number
    uploadedByUserId: string
    boatId: string
    createdAt: Date
  }>,
}))

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: mocks.invalidateQueries }),
}))

vi.mock('@/hooks/useFeedbackReports', () => ({
  useFeedbackReports: () => ({
    data: [
      {
        id: 'report-1',
        boatId: 'boat-1',
        userId: 'u1',
        partnerId: null,
        type: 'bug',
        title: 'כותרת',
        message: 'תיאור מפורט של התקלה',
        status: 'new',
        attachmentCount: 0,
        createdAt: new Date('2026-03-17T10:00:00Z'),
        updatedAt: new Date('2026-03-17T10:00:00Z'),
      },
    ],
    isLoading: false,
    error: null,
  }),
}))

vi.mock('@/hooks/useFeedbackAttachments', () => ({
  useFeedbackAttachments: () => ({ data: mocks.feedbackAttachments, isLoading: false, error: null }),
}))

vi.mock('@/context/BoatContext', () => ({
  useBoat: () => ({ isAdmin: true }),
}))

vi.mock('@/lib/firebase', () => ({
  db: { name: 'db' },
  storage: { name: 'storage' },
}))

vi.mock('firebase/firestore', () => ({
  doc: mocks.doc,
  updateDoc: mocks.updateDoc,
  deleteDoc: mocks.deleteDoc,
  runTransaction: mocks.runTransaction,
  serverTimestamp: mocks.serverTimestamp,
}))

vi.mock('firebase/storage', () => ({
  getDownloadURL: vi.fn(),
  ref: mocks.ref,
  deleteObject: mocks.deleteObject,
}))

vi.mock('react-hot-toast', () => ({
  __esModule: true,
  default: { success: vi.fn(), error: vi.fn() },
}))

vi.mock('@/components/ui/LoadingSpinner', () => ({
  __esModule: true,
  default: () => <span>טוען</span>,
}))

describe('FeedbackPage smoke', () => {
  beforeEach(() => {
    mocks.feedbackAttachments = []
    mocks.runTransaction.mockResolvedValue(undefined)
  })

  it('allows admin to change report status', async () => {
    render(
      <MemoryRouter>
        <FeedbackPage />
      </MemoryRouter>,
    )

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'resolved' } })

    await waitFor(() => {
      expect(mocks.doc).toHaveBeenCalled()
      expect(mocks.updateDoc).toHaveBeenCalled()
      expect(mocks.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['feedback_reports'] })
    })
  })

  it('allows admin to delete attachment and refresh data', async () => {
    mocks.feedbackAttachments = [
      {
        id: 'att-1',
        reportId: 'report-1',
        storagePath: 'boats/boat-1/feedback/report-1/file.png',
        fileName: 'file.png',
        contentType: 'image/png',
        sizeBytes: 1024,
        uploadedByUserId: 'u1',
        boatId: 'boat-1',
        createdAt: new Date('2026-03-17T10:00:00Z'),
      },
    ]
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)

    const txGetMock = vi.fn(async () => ({
      exists: () => true,
      data: () => ({ attachmentCount: 1 }),
    }))
    const txUpdateMock = vi.fn()
    mocks.runTransaction.mockImplementation(async (_db, callback) => callback({ get: txGetMock, update: txUpdateMock }))

    render(
      <MemoryRouter>
        <FeedbackPage />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByText('מחק'))

    await waitFor(() => {
      expect(mocks.deleteObject).toHaveBeenCalled()
      expect(mocks.deleteDoc).toHaveBeenCalled()
      expect(mocks.runTransaction).toHaveBeenCalled()
      expect(mocks.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['feedback_attachments'] })
      expect(mocks.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['feedback_reports'] })
    })

    confirmSpy.mockRestore()
  })
})
