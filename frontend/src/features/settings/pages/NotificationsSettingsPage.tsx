import { useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { useBoat } from '@/context/BoatContext'
import { db } from '@/lib/firebase'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ErrorState from '@/components/ui/ErrorState'

interface NotifPrefs {
  announcements: boolean
  maintenance: boolean
  invoices: boolean
  bookingReminders: boolean
}

const DEFAULT_PREFS: NotifPrefs = {
  announcements: true,
  maintenance: true,
  invoices: true,
  bookingReminders: true,
}

const OPTIONS: { key: keyof NotifPrefs; label: string; desc: string }[] = [
  { key: 'announcements',    label: 'הודעות חדשות',      desc: 'כשמתפרסמת הודעה חדשה בסירה' },
  { key: 'maintenance',      label: 'עדכוני תחזוקה',     desc: 'שינויים בקריאות תחזוקה' },
  { key: 'invoices',         label: 'חשבוניות חדשות',    desc: 'כשנוצרת חשבונית חדשה עבורך' },
  { key: 'bookingReminders', label: 'תזכורות הזמנות',    desc: 'תזכורת לפני הפלגה מתוכננת' },
]

export default function NotificationsSettingsPage() {
  const { activeBoatId } = useBoat()
  const queryClient = useQueryClient()
  const [savingKey, setSavingKey] = useState<keyof NotifPrefs | null>(null)

  const { data: prefs = DEFAULT_PREFS, isLoading, error } = useQuery<NotifPrefs>({
    queryKey: ['notifications-settings', activeBoatId],
    queryFn: async () => {
      const snap = await getDoc(doc(db, 'system_settings', `${activeBoatId!}_notifications`))
      if (!snap.exists()) return DEFAULT_PREFS
      const data = snap.data()
      return {
        announcements: (data.announcements as boolean | undefined) ?? true,
        maintenance: (data.maintenance as boolean | undefined) ?? true,
        invoices: (data.invoices as boolean | undefined) ?? true,
        bookingReminders: (data.bookingReminders as boolean | undefined) ?? true,
      }
    },
    enabled: !!activeBoatId,
  })

  async function toggle(key: keyof NotifPrefs) {
    if (!activeBoatId || savingKey) return
    const next = { ...prefs, [key]: !prefs[key] }
    setSavingKey(key)
    try {
      await setDoc(
        doc(db, 'system_settings', `${activeBoatId}_notifications`),
        {
          boatId: activeBoatId,
          type: 'notifications',
          ...next,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      )
      queryClient.setQueryData(['notifications-settings', activeBoatId], next)
      toast.success('ההגדרה עודכנה')
    } catch {
      toast.error('שגיאה בשמירת ההגדרה')
    } finally {
      setSavingKey(null)
    }
  }

  return (
    <div className="p-4 max-w-lg mx-auto space-y-5">
      <div className="flex items-center gap-3 pt-2">
        <Link to="/settings" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors">
          <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M9 18l6-6-6-6" />
          </svg>
        </Link>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">הגדרות התראות</h1>
      </div>

      {isLoading && (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      )}

      {error && (
        <div className="card">
          <ErrorState message="שגיאה בטעינת הגדרות ההתראות" />
        </div>
      )}

      {!isLoading && !error && (
        <div className="card divide-y divide-gray-100 dark:divide-gray-800 p-0 overflow-hidden">
          {OPTIONS.map(({ key, label, desc }) => (
            <button
              key={key}
              type="button"
              className="w-full flex items-center justify-between px-4 py-4 text-right cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors disabled:opacity-60"
              onClick={() => toggle(key)}
              disabled={!!savingKey}
            >
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{desc}</p>
              </div>
              {/* Toggle */}
              <div className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${prefs[key] ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}`}>
                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${prefs[key] ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </div>
            </button>
          ))}
        </div>
      )}

      <p className="text-xs text-center text-gray-400 dark:text-gray-500">
        ההגדרות נשמרות לכל הסירה ומסונכרנות בין המכשירים
      </p>
    </div>
  )
}
