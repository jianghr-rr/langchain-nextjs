/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
'use server';
import CryptoJS from 'crypto-js';
import { eq, and } from 'drizzle-orm';
import NodeCache from 'node-cache';
import { db } from '~/db';
import { mmallUser } from '~/db/migrations/schema';
import { initServerTranslations } from '~/lib/i18n';
import { getLocale } from '~/utils/locale';
import { createSignupFormSchema, type FormState } from './definitions';

const generateRandomBytes = (length: number) => {
  // `CryptoJS.lib.WordArray.random` 会生成指定字节的随机数据
  const randomWordArray = CryptoJS.lib.WordArray.random(length);
  return randomWordArray.toString(); // 转换为字符串格式
};

const updatePassword = async (
  state: FormState<FormData>,
  { formData }: { formData: FormData }
) => {
  const locale = await getLocale();
  const i18n = await initServerTranslations(locale, ['common', 'auth']);
  const t = i18n.t.bind(i18n); // 使用服务器端翻译实例

  const SignupFormSchema = createSignupFormSchema(t);
  const validatedFields = SignupFormSchema.safeParse({
    phone: formData.get('phone'),
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
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

  // 客户端校验通过后准备插入数据
  const { password } = validatedFields.data;
  const hashedOldPassword = CryptoJS.MD5(
    password + process.env.SALT
  ).toString();

  try {
    const { phone, question, answer } = validatedFields.data;
    // 判断手机号是否存在
    const user = await db
      .select()
      .from(mmallUser)
      .where(and(eq(mmallUser.phone, phone)))
      .execute();
    if (user.length === 0) {
      return {
        code: 1,
        errors: {
          phone: [t('phoneNotExist')],
        },
        formData: formData,
      };
    }

    // 判断问题和答案是否正确
    // 如果问题和答案正确，生成一个随机密码
    // 后端存储这个随机码，匹配正确后，重置密码
    const checkedUser = await db
      .select()
      .from(mmallUser)
      .where(
        and(
          eq(mmallUser.phone, phone),
          eq(mmallUser.question, question),
          eq(mmallUser.answer, answer)
        )
      )
      .execute();
    if (checkedUser.length === 0) {
      return {
        code: 1,
        errors: {
          question: [t('questionAnswerNotMatch')],
          answer: [t('questionAnswerNotMatch')],
        },
        formData: formData,
      };
    }

    // 生成随机密码
    const cache = new NodeCache({ stdTTL: 60, checkperiod: 30, maxKeys: 100 });
    const randomValue = generateRandomBytes(16);
    cache.set(phone, randomValue);

    // 更新用户密码
    // 模拟匹配
    if (cache.get(phone) === randomValue) {
      await db
        .update(mmallUser)
        .set({ password: hashedOldPassword })
        .where(eq(mmallUser.phone, phone))
        .execute();
    }

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
  payload: { formData: FormData }
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
