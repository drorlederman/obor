import { z } from 'zod'

export const createChargeSchema = z.object({
  title: z.string().min(2, 'כותרת חובה (לפחות 2 תווים)'),
  description: z.string().optional(),
  category: z.enum(['maintenance', 'marina', 'insurance', 'equipment', 'general'], {
    required_error: 'יש לבחור קטגוריה',
  }),
  totalAmount: z
    .number({ invalid_type_error: 'יש להזין סכום' })
    .positive('הסכום חייב להיות חיובי'),
  dueDate: z.string().min(1, 'תאריך פירעון חובה'),
})

export type CreateChargeFormData = z.infer<typeof createChargeSchema>
