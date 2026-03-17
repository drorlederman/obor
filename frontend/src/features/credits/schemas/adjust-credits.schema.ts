import { z } from 'zod'

export const adjustCreditsSchema = z.object({
  partnerId: z.string().min(1, 'חובה לבחור שותף'),
  creditType: z.enum(['weekday', 'weekend'], {
    required_error: 'חובה לבחור סוג מטבע',
  }),
  operation: z.enum(['add', 'subtract'], {
    required_error: 'חובה לבחור פעולה',
  }),
  amount: z
    .number({ invalid_type_error: 'חובה להזין מספר' })
    .int('הסכום חייב להיות מספר שלם')
    .positive('הסכום חייב להיות גדול מאפס'),
  description: z
    .string()
    .min(1, 'חובה להזין תיאור')
    .max(200, 'התיאור ארוך מדי (עד 200 תווים)'),
})

export type AdjustCreditsFormData = z.infer<typeof adjustCreditsSchema>
