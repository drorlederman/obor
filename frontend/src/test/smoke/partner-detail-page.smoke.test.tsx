import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import PartnerDetailPage from '@/features/partners/pages/PartnerDetailPage'

const mocks = vi.hoisted(() => ({
  unfreezePartnerFn: vi.fn(),
  freezePartnerFn: vi.fn(),
  removeMemberFn: vi.fn(),
  queryClientInvalidate: vi.fn(),
  navigate: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
  currentUid: 'admin-1',
  partnerData: {
    id: 'partner-1',
    boatId: 'boat-1',
    userId: 'user-2',
    fullName: 'ישראל ישראלי',
    email: 'test@example.com',
    phone: null,
    status: 'active',
    weekdayCreditsBalance: 5,
    weekendCreditsBalance: 2,
    financialStatus: 'frozen',
    joinedAt: new Date('2026-03-01T10:00:00Z'),
    notes: null,
  },
}))

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: mocks.queryClientInvalidate }),
  useQuery: () => ({
    data: mocks.partnerData,
    isLoading: false,
  }),
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useParams: () => ({ id: 'partner-1' }),
    useNavigate: () => mocks.navigate,
  }
})

vi.mock('@/context/BoatContext', () => ({
  useBoat: () => ({ activeBoatId: 'boat-1' }),
}))

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ user: { uid: mocks.currentUid } }),
}))

vi.mock('@/services/functions', () => ({
  freezePartnerFn: mocks.freezePartnerFn,
  unfreezePartnerFn: mocks.unfreezePartnerFn,
  changeMemberRoleFn: vi.fn(),
  removeMemberFn: mocks.removeMemberFn,
}))

vi.mock('react-hot-toast', () => ({
  __esModule: true,
  default: { success: mocks.toastSuccess, error: mocks.toastError },
}))

vi.mock('@/components/ui/LoadingSpinner', () => ({
  __esModule: true,
  default: () => <span>טוען</span>,
}))

describe('PartnerDetailPage smoke', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.currentUid = 'admin-1'
    mocks.partnerData = {
      id: 'partner-1',
      boatId: 'boat-1',
      userId: 'user-2',
      fullName: 'ישראל ישראלי',
      email: 'test@example.com',
      phone: null,
      status: 'active',
      weekdayCreditsBalance: 5,
      weekendCreditsBalance: 2,
      financialStatus: 'frozen',
      joinedAt: new Date('2026-03-01T10:00:00Z'),
      notes: null,
    }
  })

  it('uses financialStatus to unfreeze partner', async () => {
    mocks.unfreezePartnerFn.mockResolvedValue({ data: { success: true } })

    render(
      <MemoryRouter>
        <PartnerDetailPage />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByText('שחרר הקפאה'))

    await waitFor(() => {
      expect(mocks.unfreezePartnerFn).toHaveBeenCalledWith({ boatId: 'boat-1', partnerId: 'partner-1' })
      expect(mocks.freezePartnerFn).not.toHaveBeenCalled()
    })
  })

  it('blocks self-remove and does not call removeMemberFn', async () => {
    mocks.currentUid = 'user-2'

    render(
      <MemoryRouter>
        <PartnerDetailPage />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByText('הסר שותף מהסירה'))

    await waitFor(() => {
      expect(mocks.removeMemberFn).not.toHaveBeenCalled()
      expect(mocks.toastError).toHaveBeenCalledWith('לא ניתן להסיר את עצמך מהסירה ממסך זה')
    })
  })

  it('removes another member after confirmation', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
    mocks.removeMemberFn.mockResolvedValue({ data: { success: true } })

    render(
      <MemoryRouter>
        <PartnerDetailPage />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByText('הסר שותף מהסירה'))

    await waitFor(() => {
      expect(mocks.removeMemberFn).toHaveBeenCalledWith({ boatId: 'boat-1', userId: 'user-2' })
      expect(mocks.navigate).toHaveBeenCalledWith('/partners')
      expect(mocks.toastSuccess).toHaveBeenCalledWith('השותף הוסר בהצלחה')
    })

    confirmSpy.mockRestore()
  })
})
