/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
'use server';
import CryptoJS from 'crypto-js';
import { eq, and, ne } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { verifySession } from '~/dal/session';
import { db } from '~/db';
import { mmallUser, sessions } from '~/db/migrations/schema';
import { encrypt } from '~/lib/auth/session';
import { initServerTranslations } from '~/lib/i18n';
import { getLocale } from '~/utils/locale';
import { UpdatePasswordFormSchema, type FormState } from './definitions';

const updateUserInfo = async (
  state: FormState<FormData>,
  { formData }: { formData: FormData }
) => {
  const locale = await getLocale();
  const i18n = await initServerTranslations(locale, ['common', 'auth']);
  const t = i18n.t.bind(i18n); // 使用服务器端翻译实例

  const UpdatePasswordSchema = UpdatePasswordFormSchema(t);
  const validatedFields = UpdatePasswordSchema.safeParse({
    email: formData.get('email'),
    phone: formData.get('phone'),
    question: formData.get('question'),
    answer: formData.get('answer'),
  });

  // If any form fields are invalid, return early
  if (!validatedFields.success) {
    return {
      code: 1,
      errors: validatedFields.error.flatten().fieldErrors,
      formData: formData,
    };
  }
  try {
    const session = await verifySession();
    if (!session.isAuth || !session.userId) {
      return {
        code: 1,
        msg: t('noLogin'),
      };
    }
    const { email, phone, question, answer } = validatedFields.data;

    const user = await db
      .select()
      .from(mmallUser)
      .where(eq(mmallUser.id, session.userId));
    if (user.length === 0) {
      return {
        code: 1,
        msg: t('noLogin'),
      };
    }

    // 校验邮箱，不需要校验自己的邮箱，因为邮箱可以更改
    const emailExists = await db
      .select()
      .from(mmallUser)
      .where(
        and(
          eq(mmallUser.email, email), // 校验邮箱是否匹配
          ne(mmallUser.id, session.userId) // 排除当前用户的记录
        )
      );
    if (emailExists.length > 0) {
      return {
        code: 1,
        errors: { email: [t('existingEmail')] },
        formData: formData,
      };
    }

    // 校验手机号，不需要校验自己的手机号，因为手机号可以更改
    const phoneExists = await db
      .select()
      .from(mmallUser)
      .where(
        and(
          eq(mmallUser.phone, phone), // 校验手机号是否匹配
          ne(mmallUser.id, session.userId) // 排除当前用户的记录
        )
      );
    if (phoneExists.length > 0) {
      return {
        code: 1,
        errors: {
          phone: [t('existingPhone')],
        },
        formData: formData,
      };
    }

    // 更新数据
    await db
      .update(mmallUser)
      .set({ email, phone, question, answer })
      .where(eq(mmallUser.id, session.userId));

    return {
      code: 0,
      msg: t('updateSuccess'),
      formData: formData,
    };
  } catch (e) {
    return {
      code: 1,
      message: (e as Error).message ?? '更新用户信息失败.',
      formData: formData,
    };
  }
};

const updateUserInfoAdapter = async (
  state: FormState<FormData>,
  payload: { formData: FormData }
): Promise<FormState<FormData>> => {
  const result = await updateUserInfo(state, payload);

  // 确保返回值符合类型
  return {
    ...result,
    message: result?.message ?? undefined, // message 必须是 string | undefined
  };
};

export { updateUserInfoAdapter };
export default updateUserInfoAdapter;
