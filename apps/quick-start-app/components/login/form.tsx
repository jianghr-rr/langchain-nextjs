'use client';
import { Button, Label, TextInput, Toast } from 'flowbite-react';
import { ShieldAlert } from 'lucide-react';
import { useActionState, useEffect, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { useUserStore, type UserState, type UserActions } from '~store/user';
import { loginAdapter } from './action';

const LoginForm: FC<{ callBack: () => void; locale: string }> = ({
  callBack,
  locale,
}) => {
  const userStore = useUserStore((state: UserState & UserActions) => state);
  const [state, action, pending] = useActionState(loginAdapter, undefined);
  const { updateUser } = userStore;
  const { t } = useTranslation();

  useEffect(() => {
    if (state?.data) {
      updateUser(state.data);
      callBack?.();
    }
  }, [state, updateUser, callBack]);

  return (
    <>
      <form
        action={(formData) =>
          action({
            formData,
            locale, // 将 locale 传递到 action
          })
        }
      >
        <div className="mb-2 block">
          <Label htmlFor="username" value={t('username')} />
          <TextInput
            id="username"
            name="username"
            placeholder={`${t('input')} ${t('username')}`}
            defaultValue={(state?.formData?.get('username') as string) || ''}
            color={state?.errors?.username ? 'failure' : 'gray'}
          />
        </div>
        {state?.errors?.username && (
          <ul>
            {state.errors.username.map((error) => (
              <li className="text-sm text-red-500" key={error}>
                {error}
              </li>
            ))}
          </ul>
        )}

        <div className="mb-2 block">
          <Label htmlFor="password" value={t('password')} />
          <TextInput
            id="password"
            name="password"
            type="password"
            placeholder={`${t('input')} ${t('password')}`}
            defaultValue={(state?.formData?.get('password') as string) || ''}
            color={state?.errors?.password ? 'failure' : 'gray'}
          />
        </div>
        {state?.errors?.password && (
          <div>
            <ul>
              {state.errors.password.map((error) => (
                <li className="text-sm text-red-500" key={error}>
                  {error}
                </li>
              ))}
            </ul>
          </div>
        )}

        <Button disabled={pending} type="submit">
          {t('login')}
        </Button>
      </form>

      {state?.msg && (
        <Toast className="fixed bottom-5 right-5 z-10">
          <div className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-orange-100 text-orange-500 dark:bg-orange-700 dark:text-orange-200">
            <ShieldAlert />
          </div>
          <div className="ml-3 text-sm font-normal">{state?.msg}</div>
          <Toast.Toggle onClick={() => (state.msg = '')} />
        </Toast>
      )}
    </>
  );
};

export default LoginForm;
export { LoginForm };
