import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import toast from 'react-hot-toast'
import { useBoat } from '@/context/BoatContext'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

interface BoatSettings {
  dayCreditCost: number
  weekendCreditCost: number
}

export default function CreditsSettingsPage() {
  const { activeBoatId } = useBoat()
  const queryClient = useQueryClient()
  const [saving, setSaving] = useState(false)
  const [weekday, setWeekday] = useState('')
  const [weekend, setWeekend] = useState('')
  const [initialized, setInitialized] = useState(false)

  const { data: creditsSettings, isLoading } = useQuery<BoatSettings | null>({
    queryKey: ['credits-settings', activeBoatId],
    queryFn: async () => {
      const snap = await getDoc(doc(db, 'system_settings', `${activeBoatId!}_credits`))
      if (!snap.exists()) return null
      const data = snap.data()
      return {
        dayCreditCost: (data.dayCreditCost as number) ?? 1,
        weekendCreditCost: (data.weekendCreditCost as number) ?? 2,
      }
    },
    enabled: !!activeBoatId,
  })

  if (creditsSettings && !initialized) {
    setWeekday(String(creditsSettings.dayCreditCost))
    setWeekend(String(creditsSettings.weekendCreditCost))
    setInitialized(true)
  }

  async function handleSave() {
    if (!activeBoatId) return
    const wd = parseFloat(weekday)
    const we = parseFloat(weekend)
    if (isNaN(wd) || wd <= 0 || isNaN(we) || we <= 0) {
      toast.error('יש להזין ערכים חיוביים')
      return
    }
    setSaving(true)
    try {
      await updateDoc(doc(db, 'system_settings', `${activeBoatId}_credits`), {
        dayCreditCost: wd,
        weekendCreditCost: we,
        updatedAt: serverTimestamp(),
      })
      toast.success('הגדרות המטבעות עודכנו')
      queryClient.invalidateQueries({ queryKey: ['credits-settings', activeBoatId] })
    } catch {
      toast.error('שגיאה בשמירת ההגדרות')
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
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">הגדרות מטבעות</h1>
      </div>

      {isLoading && <div className="flex justify-center py-12"><LoadingSpinner /></div>}

      {!isLoading && creditsSettings && (
        <>
          <div className="card bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 space-y-1">
            <p className="text-sm font-medium text-blue-800 dark:text-blue-300">🪙 על המטבעות</p>
            <p className="text-xs text-blue-700 dark:text-blue-400">
              מטבעות הם יחידות הסחר בסירה. כל הפלגה עולה מספר מטבעות לפי יום חול או סוף שבוע.
              השותף צריך לצבור מטבעות מספיקים לפני ביצוע הזמנה.
            </p>
          </div>

          <div className="card space-y-4">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">עלות הפלגה</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  יום חול (מטבעות)
                </label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={weekday}
                  onChange={(e) => setWeekday(e.target.value)}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  סוף שבוע (מטבעות)
                </label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={weekend}
                  onChange={(e) => setWeekend(e.target.value)}
                  className="input"
                />
              </div>
            </div>
            <button onClick={handleSave} disabled={saving} className="btn-primary w-full">
              {saving ? <span className="flex items-center justify-center gap-2"><LoadingSpinner size="sm" />שומר...</span> : 'שמור שינויים'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
