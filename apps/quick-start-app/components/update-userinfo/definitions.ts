import type { TFunction } from 'i18next';
import { z } from 'zod';

export const UpdatePasswordFormSchema = (t: TFunction) => {
  return z.object({
    // username: z
    //   .string()
    //   .min(2, {
    //     message: t('usernameZError'),
    //   })
    //   .trim(),
    email: z.string().trim(),
    phone: z.string().trim(),
    question: z.string().trim(),
    answer: z.string().trim(),
  });
};

export type FormState<T = undefined> =
  | {
      errors?: {
        username?: string[];
        email?: string[];
        phone?: string[];
        question?: string[];
        answer?: string[];
      };
      code: number;
      message?: string; // 异常返回的消息;
      formData?: T;
    }
  | undefined;
