import { z } from 'zod'

export const registerPaymentSchema = z.object({
  amount: z
    .number({ invalid_type_error: 'יש להזין סכום' })
    .positive('הסכום חייב להיות חיובי'),
  method: z.enum(['cash', 'bank_transfer', 'card'], {
    required_error: 'יש לבחור אמצעי תשלום',
  }),
  reference: z.string().optional(),
  notes: z.string().optional(),
  paidAt: z.string().min(1, 'תאריך תשלום חובה'),
})

export type RegisterPaymentFormData = z.infer<typeof registerPaymentSchema>
