import type { TFunction } from 'i18next';
import { z } from 'zod';

export const createLoginFormSchema = (t: TFunction) => {
  return z.object({
    username: z
      .string()
      .min(2, {
        message: t('usernameZError'),
      })
      .trim(),
    password: z
      .string()
      .min(3, { message: t('passwordZError1') })
      // .regex(/[a-z]/i, { message: 'Contain at least one letter.' })
      // .regex(/\d/, { message: 'Contain at least one number.' })
      // .regex(/[^a-z0-9]/i, {
      //   message: 'Contain at least one special character.',
      // })
      .trim(),
  });
};

export type FormState<T = undefined, D = undefined> =
  | {
      errors?: {
        username?: string[];
        password?: string[];
      };
      code?: number; // 异常返回的错误码;
      msg?: string; // 异常返回的消息;
      formData?: T;
      data?: D;
    }
  | undefined;

export type SessionPayload = {
  userId: string;
  expiresAt: Date;
};
