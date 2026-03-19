import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useBoat } from '@/context/BoatContext'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

export default function WelcomePage() {
  const navigate = useNavigate()
  const { signOut, user } = useAuth()
  const { activeBoatId, loading: boatLoading } = useBoat()
  const [joinToken, setJoinToken] = useState('')
  const [showJoinInput, setShowJoinInput] = useState(false)

  useEffect(() => {
    if (!boatLoading && activeBoatId) {
      navigate('/dashboard', { replace: true })
    }
  }, [activeBoatId, boatLoading, navigate])

  async function handleSignOut() {
    await signOut()
    navigate('/login', { replace: true })
  }

  function handleJoin() {
    const token = joinToken.trim()
    if (!token) return
    navigate(`/join/${encodeURIComponent(token)}`)
  }

  if (boatLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-navy-900 to-navy-950 flex items-center justify-center">
        <LoadingSpinner size="lg" className="border-white border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-900 to-navy-950 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-10">
          <img
            src="/obor_logo.png"
            alt="לוגו האפליקציה"
            className="w-32 h-32 object-contain rounded-2xl mx-auto mb-3 bg-white p-1"
          />
          <p className="text-white/60 text-sm">שלום, {user?.displayName ?? user?.email}</p>
        </div>

        <p className="text-center text-white/80 text-sm mb-6">
          עדיין אינך שייך לסירה. צור סירה חדשה או הצטרף לקיימת.
        </p>

        {/* Options */}
        <div className="space-y-4">
          <button
            onClick={() => navigate('/create-boat')}
            className="w-full flex items-center gap-4 bg-white/10 hover:bg-white/20 transition-colors rounded-2xl p-5 text-right"
          >
            <span className="text-3xl">🚤</span>
            <div>
              <div className="font-semibold text-white text-base">צור סירה חדשה</div>
              <div className="text-white/60 text-sm">אני בעל/ת הסירה ורוצה לנהל אותה</div>
            </div>
          </button>

          {!showJoinInput ? (
            <button
              onClick={() => setShowJoinInput(true)}
              className="w-full flex items-center gap-4 bg-white/10 hover:bg-white/20 transition-colors rounded-2xl p-5 text-right"
            >
              <span className="text-3xl">🔗</span>
              <div>
                <div className="font-semibold text-white text-base">הצטרף לסירה קיימת</div>
                <div className="text-white/60 text-sm">יש לי קוד הזמנה מהמנהל</div>
              </div>
            </button>
          ) : (
            <div className="bg-white/10 rounded-2xl p-5 space-y-3">
              <p className="text-white text-sm font-medium">הדבק את קוד ההזמנה שקיבלת:</p>
              <input
                type="text"
                value={joinToken}
                onChange={(e) => setJoinToken(e.target.value)}
                placeholder="הזן קוד הזמנה..."
                className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={handleJoin}
                  disabled={!joinToken.trim()}
                  className="flex-1 btn-primary disabled:opacity-50"
                >
                  הצטרף
                </button>
                <button
                  onClick={() => { setShowJoinInput(false); setJoinToken('') }}
                  className="px-4 py-3 text-sm text-white/70 hover:text-white transition-colors"
                >
                  ביטול
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          className="mt-8 w-full text-center text-sm text-white/40 hover:text-white/70 transition-colors py-2"
        >
          יציאה מהחשבון
        </button>
      </div>
    </div>
  )
}
