import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import PartnerDetailPage from '@/features/partners/pages/PartnerDetailPage'

const mocks = vi.hoisted(() => ({
  unfreezePartnerFn: vi.fn(),
  freezePartnerFn: vi.fn(),
  queryClientInvalidate: vi.fn(),
  navigate: vi.fn(),
}))

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: mocks.queryClientInvalidate }),
  useQuery: () => ({
    data: {
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
  useAuth: () => ({ user: { uid: 'admin-1' } }),
}))

vi.mock('@/services/functions', () => ({
  freezePartnerFn: mocks.freezePartnerFn,
  unfreezePartnerFn: mocks.unfreezePartnerFn,
  changeMemberRoleFn: vi.fn(),
  removeMemberFn: vi.fn(),
}))

vi.mock('react-hot-toast', () => ({
  __esModule: true,
  default: { success: vi.fn(), error: vi.fn() },
}))

vi.mock('@/components/ui/LoadingSpinner', () => ({
  __esModule: true,
  default: () => <span>טוען</span>,
}))

describe('PartnerDetailPage smoke', () => {
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
})
