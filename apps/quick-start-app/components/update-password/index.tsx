'use client';
import { Button, Label, TextInput, Toast } from 'flowbite-react';
import { ShieldAlert, ShieldCheck } from 'lucide-react';
import { useActionState, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { updatePasswordAdapter } from './action';

const UpdatePasswordForm: FC<{ callBack: () => void; locale: string }> = ({
  callBack,
  locale,
}) => {
  const { t } = useTranslation();
  const [state, action, pending] = useActionState(
    updatePasswordAdapter,
    undefined
  );

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
          <Label htmlFor="oldPassword" value={t('oldPassword')} />
          <TextInput
            id="oldPassword"
            name="oldPassword"
            placeholder={`${t('input')} ${t('oldPassword')}`}
            defaultValue={(state?.formData?.get('oldPassword') as string) || ''}
            color={state?.errors?.oldPassword ? 'failure' : 'gray'}
          />
        </div>
        {state?.errors?.oldPassword && (
          <div>
            <ul>
              {state.errors.oldPassword.map((error) => (
                <li className="text-sm text-red-500" key={error}>
                  {error}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mb-2 block">
          <Label htmlFor="newPassword" value={t('newPassword')} />
          <TextInput
            id="newPassword"
            name="newPassword"
            placeholder={`${t('input')} ${t('newPassword')}`}
            defaultValue={(state?.formData?.get('newPassword') as string) || ''}
            color={state?.errors?.newPassword ? 'failure' : 'gray'}
          />
        </div>
        {state?.errors?.newPassword && (
          <div>
            <ul>
              {state.errors.newPassword.map((error) => (
                <li className="text-sm text-red-500" key={error}>
                  {error}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mb-2 block">
          <Label htmlFor="confirmPassword" value={t('confirmPassword')} />
          <TextInput
            id="confirmPassword"
            name="confirmPassword"
            placeholder={`${t('input')} ${t('confirmPassword')}`}
            defaultValue={
              (state?.formData?.get('confirmPassword') as string) || ''
            }
            color={state?.errors?.confirmPassword ? 'failure' : 'gray'}
          />
        </div>
        {state?.errors?.confirmPassword && (
          <ul>
            {state.errors.confirmPassword.map((error) => (
              <li className="text-sm text-red-500" key={error}>
                {error}
              </li>
            ))}
          </ul>
        )}

        <Button disabled={pending} type="submit">
          {t('ok')}
        </Button>
      </form>

      {state?.message && (
        <Toast className="fixed bottom-5 right-5 z-10">
          {state?.code === 0 ? (
            <div className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-green-100 text-green-500 dark:bg-green-800 dark:text-green-200">
              <ShieldCheck />
            </div>
          ) : (
            <div className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-orange-100 text-orange-500 dark:bg-orange-700 dark:text-orange-200">
              <ShieldAlert />
            </div>
          )}
          <div className="ml-3 text-sm font-normal">{state?.message}</div>
          <Toast.Toggle onClick={() => (state.message = '')} />
        </Toast>
      )}
    </>
  );
};

export default UpdatePasswordForm;
export { UpdatePasswordForm };
