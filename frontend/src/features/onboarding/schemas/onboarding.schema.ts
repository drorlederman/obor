import { z } from 'zod'

export const createBoatSchema = z.object({
  name: z
    .string()
    .min(2, 'שם הסירה חייב להכיל לפחות 2 תווים')
    .max(60, 'שם הסירה ארוך מדי'),
  code: z
    .string()
    .min(2, 'קוד הסירה חייב להכיל לפחות 2 תווים')
    .max(20, 'קוד הסירה ארוך מדי')
    .regex(/^[A-Za-z0-9\-_]+$/, 'קוד הסירה יכול להכיל אותיות, ספרות, מקף ותחתון בלבד'),
  homeMarina: z.string().max(100, 'שם העגינה ארוך מדי').optional().or(z.literal('')),
})

export type CreateBoatFormData = z.infer<typeof createBoatSchema>
