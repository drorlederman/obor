import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useBoat } from '@/context/BoatContext'

const PREF_KEY = (boatId: string) => `obor_notif_${boatId}`

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
  const [prefs, setPrefs] = useState<NotifPrefs>(DEFAULT_PREFS)

  useEffect(() => {
    if (!activeBoatId) return
    const saved = localStorage.getItem(PREF_KEY(activeBoatId))
    if (saved) {
      try { setPrefs({ ...DEFAULT_PREFS, ...JSON.parse(saved) }) } catch { /* ignore */ }
    }
  }, [activeBoatId])

  function toggle(key: keyof NotifPrefs) {
    const next = { ...prefs, [key]: !prefs[key] }
    setPrefs(next)
    if (activeBoatId) {
      localStorage.setItem(PREF_KEY(activeBoatId), JSON.stringify(next))
      toast.success('ההגדרה עודכנה')
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

      <div className="card divide-y divide-gray-100 dark:divide-gray-800 p-0 overflow-hidden">
        {OPTIONS.map(({ key, label, desc }) => (
          <div
            key={key}
            className="flex items-center justify-between px-4 py-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            onClick={() => toggle(key)}
          >
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{desc}</p>
            </div>
            {/* Toggle */}
            <div className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${prefs[key] ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}`}>
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${prefs[key] ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-center text-gray-400 dark:text-gray-500">
        ההגדרות נשמרות במכשיר זה בלבד
      </p>
    </div>
  )
}
