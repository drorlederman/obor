import { z } from 'zod'

function isHalfHourAligned(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return false
  const minutes = date.getMinutes()
  return minutes === 0 || minutes === 30
}

export const bookingSchema = z
  .object({
    type: z.enum(['private_sail', 'partner_sail', 'marina_use', 'maintenance_block'], {
      required_error: 'חובה לבחור סוג הזמנה',
    }),
    title: z
      .string()
      .min(1, 'חובה להזין כותרת')
      .max(100, 'הכותרת ארוכה מדי (עד 100 תווים)'),
    notes: z.string().max(500, 'ההערות ארוכות מדי (עד 500 תווים)').optional().nullable(),
    startTime: z.string().min(1, 'חובה לבחור זמן התחלה'),
    endTime: z.string().min(1, 'חובה לבחור זמן סיום'),
  })
  .refine((d) => isHalfHourAligned(d.startTime), {
    message: 'זמן ההתחלה חייב להיות בשעה עגולה או בחצי שעה',
    path: ['startTime'],
  })
  .refine((d) => isHalfHourAligned(d.endTime), {
    message: 'זמן הסיום חייב להיות בשעה עגולה או בחצי שעה',
    path: ['endTime'],
  })
  .refine((d) => new Date(d.endTime) > new Date(d.startTime), {
    message: 'זמן הסיום חייב להיות אחרי זמן ההתחלה',
    path: ['endTime'],
  })

export type BookingFormData = z.infer<typeof bookingSchema>
