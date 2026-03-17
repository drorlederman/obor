import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { useAllPartners } from '@/hooks/useAllPartners'
import { useInvitations } from '@/hooks/useInvitations'
import { useBoat } from '@/context/BoatContext'
import { invitePartnerFn, revokeInvitationFn } from '@/services/functions'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import type { FinancialStatus, MemberRole } from '@/types'

const FINANCIAL_STATUS: Record<FinancialStatus, { label: string; classes: string }> = {
  active:  { label: 'תקין',   classes: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  overdue: { label: 'חוב',    classes: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
  frozen:  { label: 'מוקפא',  classes: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
}

const ROLE_LABELS: Record<MemberRole, string> = {
  partner: 'שותף',
  scheduler: 'מתזמן',
  treasurer: 'גזבר',
  maintenanceManager: 'מנהל תחזוקה',
  admin: 'מנהל',
}

function formatDate(date: Date) {
  return date.toLocaleDateString('he-IL', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function PartnersPage() {
  const queryClient = useQueryClient()
  const { activeBoatId } = useBoat()
  const { data: partners, isLoading, error } = useAllPartners()
  const { data: invitations, isLoading: invitationsLoading } = useInvitations()

  const [email, setEmail] = useState('')
  const [role, setRole] = useState<MemberRole>('partner')
  const [inviting, setInviting] = useState(false)
  const [revokingId, setRevokingId] = useState<string | null>(null)

  async function handleInvite() {
    if (!activeBoatId) return
    const normalizedEmail = email.trim().toLowerCase()
    if (!normalizedEmail) {
      toast.error('יש להזין כתובת אימייל')
      return
    }

    setInviting(true)
    try {
      await invitePartnerFn({ boatId: activeBoatId, email: normalizedEmail, role })
      toast.success('הזמנה נשלחה בהצלחה')
      setEmail('')
      setRole('partner')
      queryClient.invalidateQueries({ queryKey: ['invitations', activeBoatId] })
    } catch {
      toast.error('שגיאה בשליחת ההזמנה')
    } finally {
      setInviting(false)
    }
  }

  async function handleRevoke(invitationId: string) {
    if (!activeBoatId) return
    if (!window.confirm('לבטל את ההזמנה הזו?')) return

    setRevokingId(invitationId)
    try {
      await revokeInvitationFn({ invitationId })
      toast.success('ההזמנה בוטלה')
      queryClient.invalidateQueries({ queryKey: ['invitations', activeBoatId] })
    } catch {
      toast.error('שגיאה בביטול ההזמנה')
    } finally {
      setRevokingId(null)
    }
  }

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">ניהול שותפים</h1>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {partners?.length ?? 0} שותפים
        </span>
      </div>

      <div className="card space-y-3">
        <p className="text-sm font-semibold text-gray-900 dark:text-white">הזמנת שותף חדש</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="אימייל של השותף"
            className="input md:col-span-2"
          />
          <select value={role} onChange={(e) => setRole(e.target.value as MemberRole)} className="input">
            <option value="partner">שותף</option>
            <option value="scheduler">מתזמן</option>
            <option value="treasurer">גזבר</option>
            <option value="maintenanceManager">מנהל תחזוקה</option>
            <option value="admin">מנהל</option>
          </select>
        </div>
        <button onClick={handleInvite} disabled={inviting} className="btn-primary w-full">
          {inviting ? 'שולח הזמנה...' : 'שלח הזמנה'}
        </button>
      </div>

      <div className="card space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">הזמנות ממתינות</p>
          <span className="text-xs text-gray-500 dark:text-gray-400">{invitations?.length ?? 0}</span>
        </div>
        {invitationsLoading && <div className="flex justify-center py-4"><LoadingSpinner size="sm" /></div>}
        {!invitationsLoading && (!invitations || invitations.length === 0) && (
          <p className="text-sm text-gray-500 dark:text-gray-400">אין הזמנות ממתינות</p>
        )}
        {invitations && invitations.length > 0 && (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {invitations.map((inv) => (
              <div key={inv.id} className="py-2.5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm text-gray-900 dark:text-white truncate">{inv.email}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    תפקיד: {ROLE_LABELS[inv.role]} | נשלח: {formatDate(inv.createdAt)}
                  </p>
                </div>
                <button
                  onClick={() => handleRevoke(inv.id)}
                  disabled={revokingId === inv.id}
                  className="text-xs px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50"
                >
                  {revokingId === inv.id ? 'מבטל...' : 'בטל הזמנה'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {isLoading && <div className="flex justify-center py-12"><LoadingSpinner /></div>}
      {error && <div className="card text-center text-red-500">שגיאה בטעינת השותפים</div>}

      {!isLoading && !error && (!partners || partners.length === 0) && (
        <div className="card text-center py-10">
          <p className="text-gray-500 dark:text-gray-400">אין שותפים פעילים</p>
        </div>
      )}

      {partners && partners.length > 0 && (
        <div className="card divide-y divide-gray-100 dark:divide-gray-800 p-0 overflow-hidden">
          {partners.map((p) => {
            const fin = FINANCIAL_STATUS[p.financialStatus]
            const totalCredits = p.weekdayCreditsBalance + p.weekendCreditsBalance
            return (
              <Link
                key={p.id}
                to={`/partners/${p.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900 dark:text-white text-sm">{p.fullName}</p>
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${fin.classes}`}>
                      {fin.label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{p.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-left">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{totalCredits}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">מטבעות</p>
                  </div>
                  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="text-gray-400 rotate-180">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {/* Summary stats */}
      {partners && partners.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="card text-center py-3">
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {partners.filter((p) => p.financialStatus === 'active').length}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">תקינים</p>
          </div>
          <div className="card text-center py-3">
            <p className="text-lg font-bold text-red-600 dark:text-red-400">
              {partners.filter((p) => p.financialStatus === 'overdue').length}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">בחוב</p>
          </div>
          <div className="card text-center py-3">
            <p className="text-lg font-bold text-gray-600 dark:text-gray-400">
              {partners.filter((p) => p.financialStatus === 'frozen').length}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">מוקפאים</p>
          </div>
        </div>
      )}
    </div>
  )
}
