import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import FeedbackNewPage from '@/features/feedback/pages/FeedbackNewPage'

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  invalidateQueries: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  increment: vi.fn((v: number) => ({ __increment: v })),
  serverTimestamp: vi.fn(() => 'ts'),
  uploadBytes: vi.fn(),
  ref: vi.fn(() => ({ path: 'file-ref' })),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mocks.navigate,
  }
})

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: mocks.invalidateQueries }),
}))

vi.mock('@/context/BoatContext', () => ({
  useBoat: () => ({ activeBoatId: 'boat-1' }),
}))

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ user: { uid: 'user-1' } }),
}))

vi.mock('@/hooks/usePartner', () => ({
  usePartner: () => ({ data: { id: 'partner-1' } }),
}))

vi.mock('@/lib/firebase', () => ({
  db: { name: 'db' },
  storage: { name: 'storage' },
}))

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(() => 'collection-ref'),
  addDoc: mocks.addDoc,
  doc: vi.fn(() => 'doc-ref'),
  updateDoc: mocks.updateDoc,
  increment: mocks.increment,
  serverTimestamp: mocks.serverTimestamp,
}))

vi.mock('firebase/storage', () => ({
  ref: mocks.ref,
  uploadBytes: mocks.uploadBytes,
}))

vi.mock('react-hot-toast', () => ({
  __esModule: true,
  default: { success: mocks.toastSuccess, error: mocks.toastError },
}))

vi.mock('@/components/ui/LoadingSpinner', () => ({
  __esModule: true,
  default: () => <span>טוען</span>,
}))

describe('FeedbackNewPage smoke', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates report with attachmentCount 0 and increments only after successful upload', async () => {
    mocks.addDoc
      .mockResolvedValueOnce({ id: 'report-1' }) // feedback_reports
      .mockResolvedValueOnce({ id: 'attachment-1' }) // feedback_attachments
    mocks.uploadBytes.mockResolvedValue({})
    mocks.updateDoc.mockResolvedValue({})

    const { container } = render(
      <MemoryRouter>
        <FeedbackNewPage />
      </MemoryRouter>,
    )

    fireEvent.change(screen.getByPlaceholderText('תיאור קצר של הבעיה או הרעיון'), {
      target: { value: 'דיווח חשוב' },
    })
    fireEvent.change(screen.getByPlaceholderText('פרט את הבעיה, הצעת הפיצ׳ר, או כל מידע שיעזור לנו...'), {
      target: { value: 'תיאור מפורט של בעיה במערכת' },
    })

    const file = new File(['demo'], 'demo.png', { type: 'image/png' })
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(fileInput, { target: { files: [file] } })

    fireEvent.click(screen.getByText('שלח דיווח'))

    await waitFor(() => {
      expect(mocks.addDoc).toHaveBeenCalled()
      expect(mocks.addDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ attachmentCount: 0 }),
      )
      expect(mocks.uploadBytes).toHaveBeenCalled()
      expect(mocks.updateDoc).toHaveBeenCalled()
      expect(mocks.increment).toHaveBeenCalledWith(1)
      expect(mocks.toastSuccess).toHaveBeenCalledWith('הדיווח נשלח בהצלחה')
      expect(mocks.navigate).toHaveBeenCalledWith('/feedback')
    })
  })
})
