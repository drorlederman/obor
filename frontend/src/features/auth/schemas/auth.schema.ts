import { z } from 'zod'

export const signInSchema = z.object({
  email: z
    .string()
    .min(1, 'כתובת אימייל היא שדה חובה')
    .email('כתובת אימייל לא תקינה'),
  password: z
    .string()
    .min(1, 'סיסמה היא שדה חובה'),
})

export const signUpSchema = z.object({
  fullName: z
    .string()
    .min(2, 'שם מלא חייב להכיל לפחות 2 תווים')
    .max(60, 'שם מלא ארוך מדי'),
  email: z
    .string()
    .min(1, 'כתובת אימייל היא שדה חובה')
    .email('כתובת אימייל לא תקינה'),
  password: z
    .string()
    .min(6, 'הסיסמה חייבת להכיל לפחות 6 תווים')
    .max(100, 'סיסמה ארוכה מדי'),
  confirmPassword: z.string().min(1, 'אשר את הסיסמה'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'הסיסמאות אינן תואמות',
  path: ['confirmPassword'],
})

export type SignInFormData = z.infer<typeof signInSchema>
export type SignUpFormData = z.infer<typeof signUpSchema>
