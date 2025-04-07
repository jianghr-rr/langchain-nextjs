import type { TFunction } from 'i18next';
import { z } from 'zod';

export const createSignupFormSchema = (t: TFunction) => {
  return z
    .object({
      password: z
        .string()
        .min(3, { message: t('passwordZError1') })
        // .regex(/[a-z]/i, { message: 'Contain at least one letter.' })
        // .regex(/\d/, { message: 'Contain at least one number.' })
        // .regex(/[^a-z0-9]/i, {
        //   message: 'Contain at least one special character.',
        // })
        .trim(),
      confirmPassword: z.string().trim(),
      phone: z.string().trim(),
      question: z.string().trim(),
      answer: z.string().trim(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t('confirmZError'),
      path: ['confirmPassword'], // 错误消息指向 `confirmPassword` 字段
    });
};

export type FormState<T = undefined> =
  | {
      errors?: {
        password?: string[];
        confirmPassword?: string[];
        phone?: string[];
        question?: string[];
        answer?: string[];
      };
      code: number;
      message?: string; // 异常返回的消息;
      formData?: T;
    }
  | undefined;
