import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import BackupsPage from '@/features/backups/pages/BackupsPage'

const mocks = vi.hoisted(() => ({
  invalidateQueries: vi.fn(),
  restoreBackupFn: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}))

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: mocks.invalidateQueries }),
}))

vi.mock('@/hooks/useBackups', () => ({
  useBackups: () => ({
    data: [
      {
        id: 'backup-1',
        status: 'completed',
        createdAt: new Date('2026-03-17T10:00:00Z'),
        totalDocuments: 120,
        notes: null,
      },
    ],
    isLoading: false,
    error: null,
  }),
}))

vi.mock('@/context/BoatContext', () => ({
  useBoat: () => ({ activeBoatId: 'boat-1' }),
}))

vi.mock('@/services/functions', () => ({
  createSystemBackupFn: vi.fn(),
  restoreBackupFn: mocks.restoreBackupFn,
}))

vi.mock('react-hot-toast', () => ({
  __esModule: true,
  default: { success: mocks.toastSuccess, error: mocks.toastError },
}))

vi.mock('@/components/ui/LoadingSpinner', () => ({
  __esModule: true,
  default: () => <span>טוען</span>,
}))

describe('BackupsPage smoke', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('sends confirm=true when restoring backup', async () => {
    mocks.restoreBackupFn.mockResolvedValue({ data: { totalRestored: 120, success: true } })

    render(<BackupsPage />)

    fireEvent.click(screen.getByText('שחזר גיבוי זה'))
    fireEvent.click(screen.getByText('כן, שחזר'))

    await waitFor(() => {
      expect(mocks.restoreBackupFn).toHaveBeenCalledWith({ backupId: 'backup-1', confirm: true })
    })
  })

  it('shows error toast when restore fails', async () => {
    mocks.restoreBackupFn.mockRejectedValue(new Error('restore failed'))

    render(<BackupsPage />)

    fireEvent.click(screen.getByText('שחזר גיבוי זה'))
    fireEvent.click(screen.getByText('כן, שחזר'))

    await waitFor(() => {
      expect(mocks.restoreBackupFn).toHaveBeenCalledWith({ backupId: 'backup-1', confirm: true })
      expect(mocks.toastError).toHaveBeenCalledWith('שגיאה בשחזור הגיבוי')
      expect(mocks.invalidateQueries).not.toHaveBeenCalled()
    })
  })
})
