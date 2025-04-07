'use client';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { IUserInfo } from '~/types/user.types';
import { UpdateUserInfoForm } from '~components/update-userinfo/form';
import { getUserInfo } from '~dal/user';
import { userInfoDTO } from '~dto/user';
export default function Page() {
  const { t } = useTranslation();
  const [userInfo, setUserInfo] = useState<IUserInfo | undefined>();

  const getUserInfoTask = async () => {
    try {
      const res = await getUserInfo();
      if (res.code === 0) {
        const data = await userInfoDTO(res.data);
        console.log('data???', data);
        setUserInfo(data);
      }
    } catch (err) {
      console.log('err', err);
    }
  };

  useEffect(() => {
    getUserInfoTask().catch(console.error);
  }, []);

  return (
    <>
      <p className="main-title">{t('personalCenter')}</p>
      {userInfo && (
        <UpdateUserInfoForm
          key={JSON.stringify(userInfo)}
          initFormData={userInfo}
          onCallback={() => {
            getUserInfoTask().catch(console.error);
          }}
        />
      )}
    </>
  );
}
