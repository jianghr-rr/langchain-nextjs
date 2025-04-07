/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
'use server';
import CryptoJS from 'crypto-js';
import { eq, and } from 'drizzle-orm';
import { verifySession } from '~/dal/session';
import { db } from '~/db';
import { mmallUser } from '~/db/migrations/schema';
import { initServerTranslations } from '~/lib/i18n';
import { createSignupFormSchema, type FormState } from './definitions';

const updatePassword = async (
  state: FormState<FormData>,
  { formData, locale }: { formData: FormData; locale: string }
) => {
  // Validate form fields
  const i18n = await initServerTranslations(locale, ['common', 'auth']);
  const t = i18n.t.bind(i18n); // 使用服务器端翻译实例

  const SignupFormSchema = createSignupFormSchema(t);
  const validatedFields = SignupFormSchema.safeParse({
    oldPassword: formData.get('oldPassword'),
    newPassword: formData.get('newPassword'),
    confirmPassword: formData.get('confirmPassword'),
  });

  // If any form fields are invalid, return early
  if (!validatedFields.success) {
    return {
      code: 1,
      errors: validatedFields.error.flatten().fieldErrors,
      formData: formData,
    };
  }

  // 客户端校验通过后准备插入数据
  const { oldPassword, newPassword } = validatedFields.data;
  const hashedOldPassword = CryptoJS.MD5(
    oldPassword + process.env.SALT
  ).toString();
  const hashedNewPassword = CryptoJS.MD5(
    newPassword + process.env.SALT
  ).toString();

  try {
    // 鉴权用户
    const session = await verifySession();
    if (!session.isAuth || !session.userId) {
      return {
        code: 1,
        msg: t('noLogin'),
      };
    }
    const user = await db
      .select()
      .from(mmallUser)
      .where(
        and(
          eq(mmallUser.id, session.userId),
          eq(mmallUser.password, hashedOldPassword)
        )
      )
      .execute();

    // 如果用户不存在，返回错误信息
    if (user.length === 0) {
      return {
        code: 1,
        message: t('oldPasswordIncorrect'),
        formData: formData,
      };
    }

    // 更新密码
    await db
      .update(mmallUser)
      .set({ password: hashedNewPassword })
      .where(eq(mmallUser.id, session.userId))
      .execute();

    return {
      code: 0,
      message: t('updatePasswordSuccess'),
    };
  } catch (e) {
    return {
      code: 1,
      message:
        (e as Error).message ??
        'An error occurred while creating your account.',
      formData: formData,
    };
  }
};

const updatePasswordAdapter = async (
  state: FormState<FormData>,
  payload: { formData: FormData; locale: string }
): Promise<FormState<FormData>> => {
  const result = await updatePassword(state, payload);

  // 确保返回值符合类型
  return {
    ...result,
    message: result?.message ?? undefined, // message 必须是 string | undefined
  };
};

export { updatePasswordAdapter };
export default updatePasswordAdapter;
