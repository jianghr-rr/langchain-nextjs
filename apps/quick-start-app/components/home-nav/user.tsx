/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
'use client';
import { Dropdown, Modal, Avatar, Toast } from 'flowbite-react';
import { ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { LoginForm } from '~components/login/form';
import { ResetPasswordForm } from '~components/reset-password';
import { SignupForm } from '~components/signup/form';
import { useUserStore, type UserState, type UserActions } from '~store/user';

const UserComponent = ({ locale }: { locale: string }) => {
  const { t } = useTranslation();
  const router = useRouter();
  const userStore = useUserStore((state: UserState & UserActions) => state);
  const { user, reset, updateUser } = userStore;
  const [openSignupModal, setOpenSignupModal] = useState(false);
  const [openLoginModal, setOpenLoginModal] = useState(false);
  const [openSignUpToast, setOpenSignUpToast] = useState(false);
  const [isForgetPassword, setIsForgetPassword] = useState(false);
  const [openResetPasswordToast, setOpenResetPasswordToast] = useState(false);

  const onHandlerLogout = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { logout } = await import('~/actions/user');
      const data = await logout(user.id, locale);
      if (data) {
        reset();
      }
      router.replace('/');
    } catch (error) {
      console.error('Error fetching user info:', error);
    }
  }, [user?.id, locale]);

  const fetchUserInfo = async () => {
    try {
      const { getUserInfo } = await import('~/actions/user');
      const { data } = await getUserInfo(locale);
      // if (code === 10) {
      //   setOpenToast(true);
      // }
      if (data) {
        updateUser(data);
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
    }
  };

  useEffect(() => {
    fetchUserInfo().catch((error) => {
      console.error('Error fetching user info in useEffect:', error);
    });
  }, []);

  return (
    <>
      {user ? (
        <Dropdown
          size="sm"
          arrowIcon={false}
          inline
          label={
            <Avatar
              placeholderInitials={user.username.charAt(0).toUpperCase()}
              rounded
            />
          }
        >
          <Dropdown.Item as={Link} href="/personal-center">
            {t('personalCenter')}
          </Dropdown.Item>
          <Dropdown.Item onClick={() => onHandlerLogout()}>
            {t('logout')}
          </Dropdown.Item>
        </Dropdown>
      ) : (
        <Dropdown
          size="sm"
          label={<Avatar alt={t('signUp')} rounded />}
          arrowIcon={false}
          inline
        >
          <Dropdown.Item onClick={() => setOpenSignupModal(true)}>
            {t('signUp')}
          </Dropdown.Item>
          <Dropdown.Item onClick={() => setOpenLoginModal(true)}>
            {t('login')}
          </Dropdown.Item>
        </Dropdown>
      )}

      <Modal show={openSignupModal} onClose={() => setOpenSignupModal(false)}>
        <Modal.Header>{t('signUp')}</Modal.Header>
        <Modal.Body>
          <div className="space-y-6">
            <SignupForm
              callBack={() => {
                setOpenSignupModal(false);
                setOpenSignUpToast(true);
                fetchUserInfo().catch((error) => {
                  console.error(
                    'Error fetching user info in useEffect:',
                    error
                  );
                });
              }}
              locale={locale}
            />
          </div>
        </Modal.Body>
      </Modal>

      <Modal
        show={openLoginModal}
        onClose={() => {
          setOpenLoginModal(false);
          setIsForgetPassword(false);
        }}
      >
        <Modal.Header>
          {isForgetPassword ? t('forgotPassword') : t('login')}
        </Modal.Header>
        <Modal.Body>
          <div className="space-y-6">
            {isForgetPassword ? (
              <ResetPasswordForm
                onSuccessCallBack={() => {
                  setOpenResetPasswordToast(true);
                  setOpenLoginModal(false);
                  setTimeout(() => {
                    setOpenResetPasswordToast(false);
                  }, 2000);
                }}
              />
            ) : (
              <LoginForm
                callBack={() => setOpenLoginModal(false)}
                locale={locale}
              />
            )}
          </div>
        </Modal.Body>
        <Modal.Footer>
          {isForgetPassword ? (
            <span onClick={() => setIsForgetPassword(false)}>返回登录</span>
          ) : (
            <span onClick={() => setIsForgetPassword(true)}>
              {t('forgotPassword')}?
            </span>
          )}
        </Modal.Footer>
      </Modal>

      {openSignUpToast && (
        <Toast className="fixed bottom-5 right-5 z-10">
          <div className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-green-100 text-green-500 dark:bg-green-700 dark:text-green-200">
            <ShieldAlert />
          </div>
          <div className="ml-3 text-sm font-normal">{t('signUpSuccess')}</div>
          <Toast.Toggle onClick={() => setOpenSignUpToast(false)} />
        </Toast>
      )}

      {openResetPasswordToast && (
        <Toast className="fixed bottom-5 right-5 z-10">
          <div className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-green-100 text-green-500 dark:bg-green-700 dark:text-green-200">
            <ShieldAlert />
          </div>
          <div className="ml-3 text-sm font-normal">
            {t('resetPasswordSuccess')}
          </div>
          <Toast.Toggle onClick={() => setOpenResetPasswordToast(false)} />
        </Toast>
      )}
    </>
  );
};

export default UserComponent;
export { UserComponent };
