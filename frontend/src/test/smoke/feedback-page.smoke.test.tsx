import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import FeedbackPage from '@/features/feedback/pages/FeedbackPage'

const mocks = vi.hoisted(() => ({
  invalidateQueries: vi.fn(),
  updateDoc: vi.fn(),
  doc: vi.fn(),
  serverTimestamp: vi.fn(() => 'ts'),
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

vi.mock('@/context/BoatContext', () => ({
  useBoat: () => ({ isAdmin: true }),
}))

vi.mock('@/lib/firebase', () => ({
  db: { name: 'db' },
}))

vi.mock('firebase/firestore', () => ({
  doc: mocks.doc,
  updateDoc: mocks.updateDoc,
  serverTimestamp: mocks.serverTimestamp,
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
})
