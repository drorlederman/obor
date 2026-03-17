import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useBoat } from '@/context/BoatContext'
import { createBoatFn } from '@/services/functions'
import {
  createBoatSchema,
  type CreateBoatFormData,
} from '../schemas/onboarding.schema'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

export default function CreateBoatPage() {
  const navigate = useNavigate()
  const { refreshMemberships } = useBoat()

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateBoatFormData>({ resolver: zodResolver(createBoatSchema) })

  async function onSubmit(data: CreateBoatFormData) {
    try {
      await createBoatFn({
        name: data.name.trim(),
        code: data.code.trim().toUpperCase(),
        homeMarina: data.homeMarina?.trim() || null,
      })
      await refreshMemberships()
      toast.success(`הסירה "${data.name}" נוצרה בהצלחה!`)
      navigate('/dashboard', { replace: true })
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? (err as { message: string }).message
          : 'שגיאה ביצירת הסירה. נסה שוב'
      toast.error(message)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-900 to-navy-950 flex items-start justify-center p-6 pt-12">
      <div className="w-full max-w-sm">
        {/* Back */}
        <button
          onClick={() => navigate('/welcome')}
          className="flex items-center gap-1 text-white/60 hover:text-white text-sm mb-6 transition-colors"
        >
          ← חזרה
        </button>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 mb-4">
            <span className="text-3xl">🚤</span>
          </div>
          <h1 className="text-2xl font-bold text-white">סירה חדשה</h1>
          <p className="text-white/60 text-sm mt-1">הגדר את הסירה שלך</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                שם הסירה <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className="input"
                placeholder="לדוגמה: רוח ים"
                {...register('name')}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                קוד הסירה <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className="input"
                placeholder="לדוגמה: רוח-ים-אחת"
                {...register('code', {
                  onChange: (e) =>
                    setValue('code', e.target.value.toUpperCase(), { shouldValidate: true }),
                })}
              />
              <p className="mt-1 text-xs text-gray-400">קוד ייחודי — אותיות, ספרות ומקף בלבד</p>
              {errors.code && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.code.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                עגינה (אופציונלי)
              </label>
              <input
                type="text"
                className="input"
                placeholder="לדוגמה: מרינה הרצליה"
                {...register('homeMarina')}
              />
              {errors.homeMarina && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.homeMarina.message}</p>
              )}
            </div>

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full mt-2">
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <LoadingSpinner size="sm" />
                  יוצר סירה...
                </span>
              ) : (
                'צור סירה'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
