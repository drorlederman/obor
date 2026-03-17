import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, useLocation } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '@/context/AuthContext'
import {
  signInSchema,
  signUpSchema,
  type SignInFormData,
  type SignUpFormData,
} from '../schemas/auth.schema'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

const AUTH_ERRORS: Record<string, string> = {
  'auth/user-not-found': 'המשתמש לא נמצא',
  'auth/wrong-password': 'סיסמה שגויה',
  'auth/email-already-in-use': 'כתובת האימייל כבר רשומה במערכת',
  'auth/weak-password': 'הסיסמה חלשה מדי (לפחות 6 תווים)',
  'auth/invalid-email': 'כתובת אימייל לא תקינה',
  'auth/too-many-requests': 'יותר מדי ניסיונות. נסה שוב מאוחר יותר',
  'auth/invalid-credential': 'אימייל או סיסמה שגויים',
  'auth/network-request-failed': 'שגיאת רשת. בדוק את החיבור שלך',
  'auth/popup-closed-by-user': 'החלון נסגר לפני השלמת ההתחברות',
  'auth/popup-blocked': 'הדפדפן חסם את חלון ההתחברות. אפשר חלונות קופצים ונסה שוב',
}

function getAuthErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'code' in err) {
    const code = (err as { code: string }).code
    return AUTH_ERRORS[code] ?? 'שגיאה בהתחברות. נסה שוב'
  }
  return 'שגיאה לא צפויה. נסה שוב'
}

type Tab = 'signin' | 'signup'

function GoogleButton({ onSuccess }: { onSuccess: () => void }) {
  const { signInWithGoogle } = useAuth()
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)
    try {
      await signInWithGoogle()
      onSuccess()
    } catch (err) {
      const code = err && typeof err === 'object' && 'code' in err
        ? (err as { code: string }).code
        : ''
      if (code !== 'auth/popup-closed-by-user') {
        toast.error(getAuthErrorMessage(err))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
    >
      {loading ? (
        <LoadingSpinner size="sm" />
      ) : (
        <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
        </svg>
      )}
      המשך עם Google
    </button>
  )
}

function SignInForm({ onSuccess }: { onSuccess: () => void }) {
  const { signIn } = useAuth()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInFormData>({ resolver: zodResolver(signInSchema) })

  async function onSubmit(data: SignInFormData) {
    try {
      await signIn(data.email, data.password)
      onSuccess()
    } catch (err) {
      toast.error(getAuthErrorMessage(err))
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          כתובת אימייל
        </label>
        <input type="email" autoComplete="email" inputMode="email" className="input"
          placeholder="you@example.com" {...register('email')} />
        {errors.email && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          סיסמה
        </label>
        <input type="password" autoComplete="current-password" className="input"
          placeholder="••••••••" {...register('password')} />
        {errors.password && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password.message}</p>}
      </div>
      <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
        {isSubmitting
          ? <span className="flex items-center justify-center gap-2"><LoadingSpinner size="sm" />מתחבר...</span>
          : 'כניסה'}
      </button>
    </form>
  )
}

function SignUpForm({ onSuccess }: { onSuccess: () => void }) {
  const { signUp } = useAuth()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpFormData>({ resolver: zodResolver(signUpSchema) })

  async function onSubmit(data: SignUpFormData) {
    try {
      await signUp(data.email, data.password, data.fullName)
      onSuccess()
      toast.success('ברוכים הבאים ל-OBOR!')
    } catch (err) {
      toast.error(getAuthErrorMessage(err))
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">שם מלא</label>
        <input type="text" autoComplete="name" className="input" placeholder="ישראל ישראלי" {...register('fullName')} />
        {errors.fullName && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.fullName.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">כתובת אימייל</label>
        <input type="email" autoComplete="email" inputMode="email" className="input"
          placeholder="you@example.com" {...register('email')} />
        {errors.email && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">סיסמה</label>
        <input type="password" autoComplete="new-password" className="input"
          placeholder="לפחות 6 תווים" {...register('password')} />
        {errors.password && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">אימות סיסמה</label>
        <input type="password" autoComplete="new-password" className="input"
          placeholder="הזן שוב את הסיסמה" {...register('confirmPassword')} />
        {errors.confirmPassword && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.confirmPassword.message}</p>}
      </div>
      <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
        {isSubmitting
          ? <span className="flex items-center justify-center gap-2"><LoadingSpinner size="sm" />יוצר חשבון...</span>
          : 'יצירת חשבון'}
      </button>
    </form>
  )
}

export default function LoginPage() {
  const [tab, setTab] = useState<Tab>('signin')
  const navigate = useNavigate()
  const location = useLocation()

  const returnTo = (location.state as { returnTo?: string } | null)?.returnTo ?? '/dashboard'

  function handleSuccess() {
    navigate(returnTo, { replace: true })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-900 to-navy-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img
            src="/obor_logo.png"
            alt="OBOR"
            className="w-32 h-32 object-contain rounded-2xl mx-auto mb-2 bg-white p-1"
          />
          <p className="text-white/60 text-sm">ניהול סירת מפרש משותפת</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6">
          <div className="flex rounded-xl bg-gray-100 dark:bg-gray-800 p-1 mb-6">
            <button type="button" onClick={() => setTab('signin')}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                tab === 'signin'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400'
              }`}>
              כניסה
            </button>
            <button type="button" onClick={() => setTab('signup')}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                tab === 'signup'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400'
              }`}>
              הרשמה
            </button>
          </div>

          {tab === 'signin'
            ? <SignInForm onSuccess={handleSuccess} />
            : <SignUpForm onSuccess={handleSuccess} />}

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-gray-700" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white dark:bg-gray-900 px-2 text-gray-400">או</span>
            </div>
          </div>

          <GoogleButton onSuccess={handleSuccess} />
        </div>
      </div>
    </div>
  )
}
