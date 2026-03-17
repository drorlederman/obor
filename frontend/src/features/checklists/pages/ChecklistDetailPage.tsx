import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import toast from 'react-hot-toast'
import { useChecklist } from '@/hooks/useChecklists'
import { useAuth } from '@/context/AuthContext'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import type { ChecklistResponse } from '@/types'

export default function ChecklistDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const { data: checklist, isLoading } = useChecklist(id)

  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)

  function toggle(itemId: string) {
    setChecked((prev) => ({ ...prev, [itemId]: !prev[itemId] }))
  }

  const requiredUnchecked = checklist?.items.filter((i) => i.required && !checked[i.id]) ?? []
  const canSave = requiredUnchecked.length === 0

  async function handleSave() {
    if (!checklist || !user) return
    setSaving(true)
    try {
      const responses: ChecklistResponse[] = checklist.items.map((item) => ({
        itemId: item.id,
        checked: checked[item.id] ?? false,
        note: notes[item.id]?.trim() || null,
      }))
      await addDoc(collection(db, 'checklist_runs'), {
        boatId: checklist.boatId,
        checklistId: checklist.id,
        bookingId: null,
        completedByUserId: user.uid,
        responses,
        completedAt: serverTimestamp(),
      })
      toast.success('הצ׳קליסט הושלם בהצלחה')
      setDone(true)
    } catch {
      toast.error('שגיאה בשמירת הצ׳קליסט')
    } finally {
      setSaving(false)
    }
  }

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-[60vh]"><LoadingSpinner size="lg" /></div>
  }

  if (!checklist) {
    return (
      <div className="p-4 text-center">
        <p className="text-gray-500 dark:text-gray-400">הצ׳קליסט לא נמצא</p>
        <Link to="/checklists" className="mt-2 inline-block text-sm text-blue-600 hover:underline">חזרה</Link>
      </div>
    )
  }

  if (done) {
    return (
      <div className="p-4 max-w-lg mx-auto text-center">
        <div className="card py-12 space-y-3">
          <p className="text-5xl">✅</p>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">הצ׳קליסט הושלם!</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{checklist.title}</p>
          <Link to="/checklists" className="inline-block mt-4 btn-primary px-6">
            חזרה לרשימה
          </Link>
        </div>
      </div>
    )
  }

  const completedCount = checklist.items.filter((i) => checked[i.id]).length

  return (
    <div className="p-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 pt-2 mb-4">
        <Link to="/checklists" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors">
          <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M9 18l6-6-6-6" />
          </svg>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">{checklist.title}</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {completedCount} / {checklist.items.length} סעיפים
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full mb-5 overflow-hidden">
        <div
          className="h-full bg-green-500 rounded-full transition-all duration-300"
          style={{ width: `${checklist.items.length > 0 ? (completedCount / checklist.items.length) * 100 : 0}%` }}
        />
      </div>

      {/* Items */}
      <div className="space-y-2 mb-6">
        {checklist.items.map((item) => (
          <div
            key={item.id}
            className={`card cursor-pointer transition-colors ${
              checked[item.id]
                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
            }`}
            onClick={() => toggle(item.id)}
          >
            <div className="flex items-start gap-3">
              <div className={`mt-0.5 w-5 h-5 rounded flex-shrink-0 border-2 flex items-center justify-center transition-colors ${
                checked[item.id]
                  ? 'bg-green-500 border-green-500 text-white'
                  : 'border-gray-300 dark:border-gray-600'
              }`}>
                {checked[item.id] && (
                  <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${checked[item.id] ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-white'}`}>
                  {item.text}
                  {item.required && <span className="text-red-500 mr-1">*</span>}
                </p>
              </div>
            </div>
            {checked[item.id] && (
              <div className="mt-2 pr-8">
                <input
                  value={notes[item.id] ?? ''}
                  onChange={(e) => {
                    e.stopPropagation()
                    setNotes((prev) => ({ ...prev, [item.id]: e.target.value }))
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="input text-xs py-1"
                  placeholder="הערה (אופציונלי)"
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {requiredUnchecked.length > 0 && (
        <p className="text-xs text-center text-amber-600 dark:text-amber-400 mb-3">
          נותרו {requiredUnchecked.length} סעיפים חובה (*) לסימון
        </p>
      )}

      <button
        onClick={handleSave}
        disabled={saving || !canSave}
        className="btn-primary w-full"
      >
        {saving
          ? <span className="flex items-center justify-center gap-2"><LoadingSpinner size="sm" />שומר...</span>
          : 'סיום וסגירת צ׳קליסט'}
      </button>
    </div>
  )
}
