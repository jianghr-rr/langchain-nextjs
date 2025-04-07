'use server';
import { getUserInfoDTO } from '~/dto/user';
import { deleteSession } from '~/lib/auth/session';
import { CustomError } from '~/lib/custom-error';
import { initServerTranslations } from '~/lib/i18n';

const getUserInfo = async (locale: string) => {
  try {
    return await getUserInfoDTO(locale);
  } catch (error) {
    // 对于非自定义错误，抛出默认的 500 错误
    throw new Error('Internal Server Error');
  }
};

export default getUserInfo;
export { getUserInfo };

const logout = async (id: number | string, locale: string) => {
  try {
    const i18n = await initServerTranslations(locale, ['common', 'auth']);
    const t = i18n.t.bind(i18n); // 使用服务器端翻译实例
    await deleteSession(String(id));
    return {
      data: {
        message: t('logoutSuccessMsg'),
      },
    };
  } catch (error) {
    if (error instanceof CustomError) {
      throw error;
    } else {
      throw new Error('Internal Server Error');
    }
  }
};
export { logout };
