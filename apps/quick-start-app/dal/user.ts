/**
 * 用户信息的DAL层
 */
'use server';
import { eq } from 'drizzle-orm';
import { db } from '~/db';
import { mmallUser } from '~/db/migrations/schema';
import { CustomError } from '~/lib/custom-error';
import { initServerTranslations } from '~/lib/i18n';
import { getLocale } from '~/utils/locale';
import { verifySession } from './session';

const getUserInfo = async () => {
  try {
    const locale = await getLocale();
    const i18n = await initServerTranslations(locale, ['common', 'auth']);
    const t = i18n.t.bind(i18n); // 使用服务器端翻译实例
    const session = await verifySession();

    if (!session.isAuth) {
      return {
        code: 10,
        msg: t('noLogin'),
      };
    }

    const { userId } = session;
    const user = await db
      .select()
      .from(mmallUser)
      .where(eq(mmallUser.id, Number(userId)))
      .execute();
    if (user[0]) {
      return {
        code: 0,
        data: { ...user[0], password: '' },
      };
    } else {
      return new CustomError(t('noUser'), 10);
    }
  } catch (error) {
    // 对于非自定义错误，抛出默认的 500 错误
    throw new Error('Internal Server Error');
  }
};

export default getUserInfo;
export { getUserInfo };
