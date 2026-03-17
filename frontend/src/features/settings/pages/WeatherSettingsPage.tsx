import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import toast from 'react-hot-toast'
import { useBoat } from '@/context/BoatContext'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

export default function WeatherSettingsPage() {
  const { activeBoatId } = useBoat()
  const queryClient = useQueryClient()
  const [marina, setMarina] = useState('')
  const [initialized, setInitialized] = useState(false)
  const [saving, setSaving] = useState(false)

  const { data: boat, isLoading } = useQuery<{ name: string; homeMarina: string | null } | null>({
    queryKey: ['boat-weather', activeBoatId],
    queryFn: async () => {
      const snap = await getDoc(doc(db, 'boats', activeBoatId!))
      if (!snap.exists()) return null
      const data = snap.data()
      return { name: data.name as string, homeMarina: (data.homeMarina as string) ?? null }
    },
    enabled: !!activeBoatId,
  })

  if (boat && !initialized) {
    setMarina(boat.homeMarina ?? '')
    setInitialized(true)
  }

  async function handleSave() {
    if (!activeBoatId) return
    setSaving(true)
    try {
      await updateDoc(doc(db, 'boats', activeBoatId), {
        homeMarina: marina.trim() || null,
        updatedAt: serverTimestamp(),
      })
      toast.success('מיקום המרינה עודכן')
      queryClient.invalidateQueries({ queryKey: ['boat-weather', activeBoatId] })
      queryClient.invalidateQueries({ queryKey: ['boat-settings', activeBoatId] })
    } catch {
      toast.error('שגיאה בשמירת המיקום')
    } finally {
      setSaving(false)
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
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">הגדרות מזג אוויר</h1>
      </div>

      {isLoading && <div className="flex justify-center py-12"><LoadingSpinner /></div>}

      {!isLoading && (
        <>
          <div className="card bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 space-y-1">
            <p className="text-sm font-medium text-blue-800 dark:text-blue-300">🌤️ תחזית מזג אוויר</p>
            <p className="text-xs text-blue-700 dark:text-blue-400">
              תחזית מזג האוויר בלוח הבקרה מבוססת על מיקום המרינה שתוגדר כאן.
              הזן שם עיר או מרינה לצורך חיפוש.
            </p>
          </div>

          <div className="card space-y-4">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">מרינה / מיקום</p>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                שם מרינה או עיר
              </label>
              <input
                value={marina}
                onChange={(e) => setMarina(e.target.value)}
                className="input"
                placeholder="לדוגמה: הרצליה, חיפה, תל אביב"
              />
            </div>
            {boat?.homeMarina && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                מוגדר כעת: <span className="font-medium">{boat.homeMarina}</span>
              </p>
            )}
            <button onClick={handleSave} disabled={saving} className="btn-primary w-full">
              {saving ? <span className="flex items-center justify-center gap-2"><LoadingSpinner size="sm" />שומר...</span> : 'שמור מיקום'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
