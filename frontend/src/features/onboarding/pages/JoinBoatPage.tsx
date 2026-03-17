import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useBoat } from '@/context/BoatContext'
import { acceptInvitationFn } from '@/services/functions'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

type State = 'loading' | 'success' | 'error'

export default function JoinBoatPage() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const { refreshMemberships } = useBoat()
  const [state, setState] = useState<State>('loading')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    // Wait for auth to resolve
    if (authLoading) return

    // Not logged in — redirect to login with returnTo
    if (!user) {
      navigate('/login', {
        replace: true,
        state: { returnTo: `/join/${token}` },
      })
      return
    }

    if (!token) {
      setState('error')
      setErrorMessage('קישור ההזמנה אינו תקין')
      return
    }

    // Auto-accept
    acceptInvitationFn({ token })
      .then(async () => {
        await refreshMemberships()
        setState('success')
        setTimeout(() => navigate('/dashboard', { replace: true }), 1500)
      })
      .catch((err: unknown) => {
        const message =
          err && typeof err === 'object' && 'message' in err
            ? (err as { message: string }).message
            : 'שגיאה בקבלת ההזמנה'
        setState('error')
        setErrorMessage(message)
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user])

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-900 to-navy-950 flex items-center justify-center p-6">
      <div className="w-full max-w-sm text-center">
        <img
          src="/obor_logo.png"
          alt="OBOR"
          className="w-24 h-24 object-contain rounded-2xl mx-auto mb-6 bg-white p-1"
        />

        {state === 'loading' && (
          <>
            <LoadingSpinner size="lg" className="mx-auto mb-4 border-white border-t-transparent" />
            <h2 className="text-xl font-semibold text-white mb-2">מצטרף לסירה...</h2>
            <p className="text-white/60 text-sm">אנא המתן</p>
          </>
        )}

        {state === 'success' && (
          <>
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-xl font-semibold text-white mb-2">הצטרפת בהצלחה!</h2>
            <p className="text-white/60 text-sm">מועבר ללוח הבקרה...</p>
          </>
        )}

        {state === 'error' && (
          <>
            <div className="text-5xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-white mb-2">שגיאה בהצטרפות</h2>
            <p className="text-white/60 text-sm mb-6">{errorMessage}</p>
            <button
              onClick={() => navigate('/welcome', { replace: true })}
              className="btn-primary"
            >
              חזרה לעמוד הראשי
            </button>
          </>
        )}
      </div>
    </div>
  )
}
