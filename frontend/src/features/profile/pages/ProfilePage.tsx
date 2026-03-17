import { useState } from 'react'
import { updateProfile } from 'firebase/auth'
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import toast from 'react-hot-toast'
import { useAuth } from '@/context/AuthContext'
import { useBoat } from '@/context/BoatContext'
import { db, auth } from '@/lib/firebase'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

const ROLE_LABELS: Record<string, string> = {
  partner: 'שותף', scheduler: 'מתזמן', treasurer: 'גזבר',
  maintenanceManager: 'מנהל תחזוקה', admin: 'מנהל',
}

export default function ProfilePage() {
  const { user, signOut } = useAuth()
  const { memberships, activeBoatId } = useBoat()

  const [displayName, setDisplayName] = useState(user?.displayName ?? '')
  const [phone, setPhone] = useState('')
  const [saving, setSaving] = useState(false)

  const activeMembership = memberships.find((m) => m.boatId === activeBoatId)
  const isGoogleUser = user?.providerData.some((p) => p.providerId === 'google.com')

  async function handleSave() {
    if (!user || !displayName.trim()) return
    setSaving(true)
    try {
      await updateProfile(auth.currentUser!, { displayName: displayName.trim() })
      await updateDoc(doc(db, 'users', user.uid), {
        fullName: displayName.trim(),
        ...(phone.trim() ? { phone: phone.trim() } : {}),
        updatedAt: serverTimestamp(),
      })
      toast.success('הפרופיל עודכן')
    } catch {
      toast.error('שגיאה בעדכון הפרופיל')
    } finally {
      setSaving(false)
    }
  }

  async function handleSignOut() {
    await signOut()
  }

  const initials = (user?.displayName ?? user?.email ?? '?')
    .split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div className="p-4 space-y-5 max-w-lg mx-auto">
      <h1 className="text-xl font-bold text-gray-900 dark:text-white pt-2">הפרופיל שלי</h1>

      {/* Avatar + name */}
      <div className="card flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-blue-600 text-white text-xl font-bold flex items-center justify-center flex-shrink-0">
          {user?.photoURL
            ? <img src={user.photoURL} alt="" className="w-full h-full rounded-full object-cover" />
            : initials}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 dark:text-white">{user?.displayName ?? '—'}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
          {isGoogleUser && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">מחובר עם Google</p>
          )}
        </div>
      </div>

      {/* Current boat membership */}
      {activeMembership && (
        <div className="card">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">סירה פעילה</p>
          <div className="flex items-center justify-between">
            <p className="font-medium text-gray-900 dark:text-white">{activeMembership.boatName}</p>
            <span className="text-sm text-blue-600 dark:text-blue-400">{ROLE_LABELS[activeMembership.role] ?? activeMembership.role}</span>
          </div>
        </div>
      )}

      {/* All memberships */}
      {memberships.filter((m) => m.status === 'active').length > 1 && (
        <div className="card">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">כל הסירות</p>
          <div className="space-y-2">
            {memberships.filter((m) => m.status === 'active').map((m) => (
              <div key={m.boatId} className="flex justify-between text-sm">
                <span className="text-gray-700 dark:text-gray-300">{m.boatName}</span>
                <span className="text-gray-500 dark:text-gray-400">{ROLE_LABELS[m.role] ?? m.role}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit form */}
      <div className="card space-y-4">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">עריכת פרטים</p>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">שם מלא</label>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="input"
            placeholder="שם מלא"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">טלפון (אופציונלי)</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            type="tel"
            className="input"
            placeholder="050-0000000"
          />
        </div>
        <button onClick={handleSave} disabled={saving || !displayName.trim()} className="btn-primary w-full">
          {saving ? <span className="flex items-center justify-center gap-2"><LoadingSpinner size="sm" />שומר...</span> : 'שמור שינויים'}
        </button>
      </div>

      {/* Sign out */}
      <button
        onClick={handleSignOut}
        className="w-full text-center text-sm text-red-500 dark:text-red-400 hover:underline py-2"
      >
        יציאה מהחשבון
      </button>
    </div>
  )
}
