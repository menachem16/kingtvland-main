import { z } from 'zod';

// Auth validation schemas
export const signUpSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, { message: 'נדרש אימייל' })
    .email({ message: 'כתובת אימייל לא תקינה' })
    .max(255, { message: 'האימייל ארוך מדי' }),
  password: z
    .string()
    .min(8, { message: 'הסיסמה חייבת להכיל לפחות 8 תווים' })
    .max(100, { message: 'הסיסמה ארוכה מדי' })
    .regex(/[A-Z]/, { message: 'הסיסמה חייבת להכיל לפחות אות גדולה אחת' })
    .regex(/[a-z]/, { message: 'הסיסמה חייבת להכיל לפחות אות קטנה אחת' })
    .regex(/[0-9]/, { message: 'הסיסמה חייבת להכיל לפחות ספרה אחת' }),
  firstName: z
    .string()
    .trim()
    .min(2, { message: 'השם הפרטי חייב להכיל לפחות 2 תווים' })
    .max(50, { message: 'השם הפרטי ארוך מדי' })
    .regex(/^[\u0590-\u05FFa-zA-Z\s]+$/, { message: 'השם יכול להכיל רק אותיות ורווחים' }),
  lastName: z
    .string()
    .trim()
    .min(2, { message: 'שם המשפחה חייב להכיל לפחות 2 תווים' })
    .max(50, { message: 'שם המשפחה ארוך מדי' })
    .regex(/^[\u0590-\u05FFa-zA-Z\s]+$/, { message: 'שם המשפחה יכול להכיל רק אותיות ורווחים' }),
});

export const signInSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, { message: 'נדרש אימייל' })
    .email({ message: 'כתובת אימייל לא תקינה' }),
  password: z
    .string()
    .min(1, { message: 'נדרשת סיסמה' }),
});

// Profile validation schema
export const profileSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(2, { message: 'השם הפרטי חייב להכיל לפחות 2 תווים' })
    .max(50, { message: 'השם הפרטי ארוך מדי' })
    .regex(/^[\u0590-\u05FFa-zA-Z\s]+$/, { message: 'השם יכול להכיל רק אותיות ורווחים' }),
  lastName: z
    .string()
    .trim()
    .min(2, { message: 'שם המשפחה חייב להכיל לפחות 2 תווים' })
    .max(50, { message: 'שם המשפחה ארוך מדי' })
    .regex(/^[\u0590-\u05FFa-zA-Z\s]+$/, { message: 'שם המשפחה יכול להכיל רק אותיות ורווחים' }),
  phone: z
    .string()
    .trim()
    .optional()
    .refine(
      (val) => !val || /^05\d{8}$/.test(val.replace(/[-\s]/g, '')),
      { message: 'מספר טלפון לא תקין (חייב להתחיל ב-05 ולהכיל 10 ספרות)' }
    ),
});

// Coupon validation schema
export const couponCodeSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, { message: 'נדרש קוד קופון' })
    .max(50, { message: 'קוד הקופון ארוך מדי' })
    .regex(/^[A-Z0-9_-]+$/i, { message: 'קוד קופון יכול להכיל רק אותיות, מספרים, מקף ומקף תחתון' }),
});

// Admin - Plan validation schema
export const planSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { message: 'שם החבילה חייב להכיל לפחות 2 תווים' })
    .max(100, { message: 'שם החבילה ארוך מדי' }),
  description: z
    .string()
    .trim()
    .max(500, { message: 'התיאור ארוך מדי' })
    .optional(),
  price: z
    .number()
    .positive({ message: 'המחיר חייב להיות גדול מ-0' })
    .max(999999, { message: 'המחיר גבוה מדי' }),
  duration_months: z
    .number()
    .int()
    .positive({ message: 'משך החבילה חייב להיות גדול מ-0' })
    .max(120, { message: 'משך החבילה ארוך מדי (מקסימום 120 חודשים)' }),
  features: z
    .array(z.string())
    .optional(),
});

// Admin - Coupon validation schema
export const adminCouponSchema = z.object({
  code: z
    .string()
    .trim()
    .min(3, { message: 'קוד הקופון חייב להכיל לפחות 3 תווים' })
    .max(50, { message: 'קוד הקופון ארוך מדי' })
    .regex(/^[A-Z0-9_-]+$/i, { message: 'קוד קופון יכול להכיל רק אותיות, מספרים, מקף ומקף תחתון' }),
  discount_type: z.union([z.literal('percentage'), z.literal('fixed')]),
  discount_value: z
    .number()
    .positive({ message: 'ערך ההנחה חייב להיות גדול מ-0' }),
  max_uses: z
    .number()
    .int()
    .positive({ message: 'מספר השימושים חייב להיות גדול מ-0' })
    .optional()
    .nullable(),
  valid_from: z.date(),
  valid_until: z.date().optional().nullable(),
}).refine(
  (data) => {
    if (data.discount_type === 'percentage') {
      return data.discount_value <= 100;
    }
    return true;
  },
  {
    message: 'הנחה באחוזים לא יכולה להיות יותר מ-100%',
    path: ['discount_value'],
  }
).refine(
  (data) => {
    if (data.valid_until) {
      return data.valid_until > data.valid_from;
    }
    return true;
  },
  {
    message: 'תאריך סיום חייב להיות אחרי תאריך התחלה',
    path: ['valid_until'],
  }
);

// Chat message validation
export const chatMessageSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, { message: 'ההודעה לא יכולה להיות ריקה' })
    .max(2000, { message: 'ההודעה ארוכה מדי (מקסימום 2000 תווים)' }),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type CouponCodeInput = z.infer<typeof couponCodeSchema>;
export type PlanInput = z.infer<typeof planSchema>;
export type AdminCouponInput = z.infer<typeof adminCouponSchema>;
export type ChatMessageInput = z.infer<typeof chatMessageSchema>;
