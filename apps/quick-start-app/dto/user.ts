'use server';
import type { InferSelectModel } from 'drizzle-orm';
import { getUserInfo } from '~/dal/get-user-info';
import type { mmallUser } from '~/db/migrations/schema';
import type { CustomAxiosResponse } from '~/types/request.types';
import type { IUserInfo } from '~/types/user.types';

const getUserInfoDTO = async (
  locale: string
): Promise<CustomAxiosResponse<IUserInfo>> => {
  try {
    const res = await getUserInfo(locale);

    if ('data' in res && res.data) {
      const { id, username, email, phone, question, answer, role } = res.data;
      return {
        code: 1,
        data: {
          id,
          username,
          email,
          phone,
          question,
          answer,
          role,
        },
      };
    }

    return {
      msg: res.msg,
      code: 10,
    };
  } catch (err) {
    // return err;
    return {
      msg: (err as Error)?.message ?? '',
      code: 1001,
    };
  }
};

export default getUserInfoDTO;
export { getUserInfoDTO };

/** ******** 上面的代码直接用的DAL层，这里区分，下面只是DTO层 ********** **/

const userInfoDTO = (
  data: InferSelectModel<typeof mmallUser> | undefined
): Promise<IUserInfo | undefined> => {
  if (!data) {
    return Promise.resolve(undefined);
  }
  const { id, username, email, phone, question, answer, role } = data;
  return Promise.resolve({
    id,
    username,
    email,
    phone,
    question,
    answer,
    role,
  });
};

export { userInfoDTO };
