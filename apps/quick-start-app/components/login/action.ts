/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
'use server';
import CryptoJS from 'crypto-js';
import { eq, and } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { db } from '~/db';
import { mmallUser } from '~/db/migrations/schema';
import { encrypt } from '~/lib/auth/session';
import { initServerTranslations } from '~/lib/i18n';
import type { IUserInfo } from '~/types/user.types';
import { logger } from '~utils/logger';
import { ServerResponse } from '~utils/server-response';
import { createLoginFormSchema, type FormState } from './definitions';

const login = async (
  state: FormState<FormData, IUserInfo>,
  { formData, locale }: { formData: FormData; locale: string }
) => {
  // const { t } = useTranslation();
  // Validate form fields
  const i18n = await initServerTranslations(locale, [
    'common',
    'response',
    'auth',
  ]);
  const t = i18n.t.bind(i18n); // 使用服务器端翻译实例

  ServerResponse.setT(t);

  const LoginFormSchema = createLoginFormSchema(t);

  const validatedFields = LoginFormSchema.safeParse({
    username: formData.get('username'),
    password: formData.get('password'),
  });

  // If any form fields are invalid, return early
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      msg: undefined,
      data: undefined,
      formData: formData,
    };
  }

  // 客户端校验通过后准备插入数据
  const { username, password } = validatedFields.data;
  const hashedPassword = CryptoJS.MD5(password + process.env.SALT).toString();

  try {
    const params = {
      username,
      password: hashedPassword,
    };
    // 查询数据, 匹配名字和密码
    const searchData = await db
      .select()
      .from(mmallUser)
      .where(
        and(
          eq(mmallUser.username, params.username),
          eq(mmallUser.password, params.password)
        )
      )
      .execute();

    if (searchData[0]) {
      const { id, username, email, phone, question, answer, role } =
        searchData[0];

      const maxAge = 24 * 60 * 60; // Cookie 存活时间为24小时

      const sessionToken = await encrypt({ userId: String(id), maxAge });
      const cookieStore = await cookies();
      cookieStore.set('Authentication', sessionToken, {
        httpOnly: true,
        secure: false,
        maxAge: maxAge,
        path: '/',
      });

      return ServerResponse.createSuccess<IUserInfo>({
        id,
        username,
        email,
        phone,
        question,
        answer,
        role,
      });
    } else {
      return {
        ...ServerResponse.createError(t('loginError')),
        data: undefined,
        formData: formData,
      };
    }
  } catch (e) {
    logger.error('登录失败，数据库查询错误', e);
    return {
      ...ServerResponse.createError(2001),
      formData: formData,
    };
  }
};

const loginAdapter = async (
  state: FormState<FormData, IUserInfo>,
  payload: { formData: FormData; locale: string }
): Promise<FormState<FormData, IUserInfo>> => {
  const result = await login(state, payload);

  // 确保返回值符合类型
  return {
    ...result,
    msg: result?.msg ?? '',
  };
};

export { loginAdapter };
export default loginAdapter;
