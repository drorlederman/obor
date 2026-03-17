import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { doc, getDoc, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import toast from 'react-hot-toast'
import {
  freezePartnerFn, unfreezePartnerFn, changeMemberRoleFn,
} from '@/services/functions'
import { useBoat } from '@/context/BoatContext'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import type { Partner, MemberRole, FinancialStatus } from '@/types'

const ROLE_LABELS: Record<MemberRole, string> = {
  partner: 'שותף', scheduler: 'מתזמן', treasurer: 'גזבר',
  maintenanceManager: 'מנהל תחזוקה', admin: 'מנהל',
}

const FINANCIAL_STATUS: Record<FinancialStatus, { label: string; classes: string }> = {
  active:  { label: 'תקין',   classes: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  overdue: { label: 'בחוב',   classes: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
  frozen:  { label: 'מוקפא',  classes: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
}

const ROLES: MemberRole[] = ['partner', 'scheduler', 'treasurer', 'maintenanceManager', 'admin']

function formatDate(date: Date) {
  return date.toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function PartnerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const { activeBoatId } = useBoat()

  const [freezing, setFreezing] = useState(false)
  const [changingRole, setChangingRole] = useState(false)
  const [selectedRole, setSelectedRole] = useState<MemberRole | ''>('')

  const { data: partner, isLoading } = useQuery<Partner | null>({
    queryKey: ['partner', id],
    queryFn: async () => {
      const snap = await getDoc(doc(db, 'partners', id!))
      if (!snap.exists()) return null
      const data = snap.data()
      return {
        id: snap.id,
        boatId: data.boatId as string,
        userId: (data.userId as string) ?? null,
        fullName: data.fullName as string,
        email: data.email as string,
        phone: (data.phone as string) ?? null,
        status: data.status as Partner['status'],
        weekdayCreditsBalance: (data.weekdayCreditsBalance as number) ?? 0,
        weekendCreditsBalance: (data.weekendCreditsBalance as number) ?? 0,
        financialStatus: (data.financialStatus as Partner['financialStatus']) ?? 'active',
        joinedAt: (data.joinedAt as Timestamp).toDate(),
        notes: (data.notes as string) ?? null,
      }
    },
    enabled: !!id,
  })

  async function handleFreezeToggle() {
    if (!partner || !activeBoatId) return
    setFreezing(true)
    try {
      if (partner.financialStatus === 'frozen') {
        await unfreezePartnerFn({ boatId: activeBoatId, partnerId: partner.id })
        toast.success('השותף שוחרר')
      } else {
        await freezePartnerFn({ boatId: activeBoatId, partnerId: partner.id })
        toast.success('השותף הוקפא')
      }
      queryClient.invalidateQueries({ queryKey: ['partner', id] })
      queryClient.invalidateQueries({ queryKey: ['partners-all', activeBoatId] })
    } catch {
      toast.error('שגיאה בפעולה')
    } finally {
      setFreezing(false)
    }
  }

  async function handleRoleChange() {
    if (!partner || !activeBoatId || !selectedRole || !partner.userId) return
    setChangingRole(true)
    try {
      await changeMemberRoleFn({ boatId: activeBoatId, userId: partner.userId, newRole: selectedRole })
      toast.success(`התפקיד שונה ל-${ROLE_LABELS[selectedRole]}`)
      setSelectedRole('')
      queryClient.invalidateQueries({ queryKey: ['partner', id] })
    } catch {
      toast.error('שגיאה בשינוי תפקיד')
    } finally {
      setChangingRole(false)
    }
  }

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-[60vh]"><LoadingSpinner size="lg" /></div>
  }

  if (!partner) {
    return (
      <div className="p-4 text-center">
        <p className="text-gray-500 dark:text-gray-400">השותף לא נמצא</p>
        <Link to="/partners" className="mt-2 inline-block text-sm text-blue-600 hover:underline">חזרה</Link>
      </div>
    )
  }

  const fin = FINANCIAL_STATUS[partner.financialStatus]
  const isFrozen = partner.financialStatus === 'frozen'

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 pt-2">
        <Link to="/partners" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors">
          <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M9 18l6-6-6-6" />
          </svg>
        </Link>
        <h1 className="text-lg font-bold text-gray-900 dark:text-white flex-1">{partner.fullName}</h1>
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${fin.classes}`}>{fin.label}</span>
      </div>

      {/* Info card */}
      <div className="card space-y-3">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">פרטים</p>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">אימייל</span>
            <span className="text-gray-900 dark:text-white">{partner.email}</span>
          </div>
          {partner.phone && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">טלפון</span>
              <a href={`tel:${partner.phone}`} className="text-blue-600 dark:text-blue-400">{partner.phone}</a>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">הצטרף</span>
            <span className="text-gray-900 dark:text-white">{formatDate(partner.joinedAt)}</span>
          </div>
        </div>
        {partner.notes && (
          <p className="text-sm text-gray-600 dark:text-gray-400 border-t border-gray-100 dark:border-gray-800 pt-3">{partner.notes}</p>
        )}
      </div>

      {/* Credits */}
      <div className="card">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">יתרת מטבעות</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{partner.weekdayCreditsBalance}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">ימי חול</p>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{partner.weekendCreditsBalance}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">סופי שבוע</p>
          </div>
        </div>
      </div>

      {/* Change role */}
      {partner.userId && (
        <div className="card space-y-3">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">שינוי תפקיד</p>
          <div className="flex gap-2">
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as MemberRole)}
              className="input flex-1"
            >
              <option value="">בחר תפקיד חדש...</option>
              {ROLES.map((r) => (
                <option key={r} value={r}>{ROLE_LABELS[r]}</option>
              ))}
            </select>
            <button
              onClick={handleRoleChange}
              disabled={!selectedRole || changingRole}
              className="btn-primary px-4 disabled:opacity-50"
            >
              {changingRole ? <LoadingSpinner size="sm" /> : 'שמור'}
            </button>
          </div>
        </div>
      )}

      {/* Freeze / Unfreeze */}
      <button
        onClick={handleFreezeToggle}
        disabled={freezing}
        className={`w-full py-3 rounded-xl font-medium text-sm transition-colors ${
          isFrozen
            ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800 hover:bg-green-100'
            : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 hover:bg-red-100'
        }`}
      >
        {freezing ? <LoadingSpinner size="sm" /> : (isFrozen ? 'שחרר הקפאה' : 'הקפא שותף')}
      </button>
    </div>
  )
}
