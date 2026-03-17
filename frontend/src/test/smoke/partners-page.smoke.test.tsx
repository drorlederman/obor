import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import PartnersPage from '@/features/partners/pages/PartnersPage'

const mocks = vi.hoisted(() => ({
  invitePartnerFn: vi.fn(),
  invalidateQueries: vi.fn(),
}))

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: mocks.invalidateQueries }),
}))

vi.mock('@/hooks/useAllPartners', () => ({
  useAllPartners: () => ({ data: [], isLoading: false, error: null }),
}))

vi.mock('@/hooks/useInvitations', () => ({
  useInvitations: () => ({ data: [], isLoading: false, error: null }),
}))

vi.mock('@/context/BoatContext', () => ({
  useBoat: () => ({ activeBoatId: 'boat-1' }),
}))

vi.mock('@/services/functions', () => ({
  invitePartnerFn: mocks.invitePartnerFn,
  revokeInvitationFn: vi.fn(),
}))

vi.mock('react-hot-toast', () => ({
  __esModule: true,
  default: { success: vi.fn(), error: vi.fn() },
}))

vi.mock('@/components/ui/LoadingSpinner', () => ({
  __esModule: true,
  default: () => <span>טוען</span>,
}))

describe('PartnersPage smoke', () => {
  it('submits invite with normalized email', async () => {
    mocks.invitePartnerFn.mockResolvedValue({ data: { success: true, invitationId: 'i1', token: 't1' } })

    render(
      <MemoryRouter>
        <PartnersPage />
      </MemoryRouter>,
    )

    fireEvent.change(screen.getByPlaceholderText('אימייל של השותף'), {
      target: { value: '  TEST@Example.com ' },
    })
    fireEvent.click(screen.getByText('שלח הזמנה'))

    await waitFor(() => {
      expect(mocks.invitePartnerFn).toHaveBeenCalledWith({
        boatId: 'boat-1',
        email: 'test@example.com',
        role: 'partner',
      })
    })
  })
})
