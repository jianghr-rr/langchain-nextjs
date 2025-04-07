'use client';
import { Button, Label, TextInput, Toast } from 'flowbite-react';
import { ShieldAlert } from 'lucide-react';
import { useActionState, useEffect, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import type { IUserInfo } from '~/types/user.types';
import { updateUserInfoAdapter } from './action';

const UpdateUserInfoForm: FC<{
  initFormData: IUserInfo;
  onCallback: () => void;
}> = ({ initFormData, onCallback }) => {
  const { t } = useTranslation();
  const [state, action, pending] = useActionState(
    updateUserInfoAdapter,
    undefined
  );

  useEffect(() => {
    if (state?.code === 0) {
      onCallback?.();
    }
  }, [state, onCallback]);

  return (
    <>
      <form
        action={(formData) =>
          action({
            formData,
          })
        }
      >
        <div className="mb-2 block">
          <Label htmlFor="username" value={t('username')} />
          <TextInput
            disabled
            id="username"
            name="username"
            placeholder={`${t('input')} ${t('username')}`}
            defaultValue={
              (state?.formData?.get('username') as string) ??
              initFormData.username ??
              ''
            }
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
          <Label htmlFor="email" value={t('email')} />
          <TextInput
            id="email"
            name="email"
            placeholder={`${t('input')} ${t('email')}`}
            defaultValue={
              (state?.formData?.get('email') as string) ??
              initFormData.email ??
              ''
            }
            color={state?.errors?.email ? 'failure' : 'gray'}
          />
        </div>
        {state?.errors?.email && (
          <ul>
            {state.errors.email.map((error) => (
              <li className="text-sm text-red-500" key={error}>
                {error}
              </li>
            ))}
          </ul>
        )}

        <div className="mb-2 block">
          <Label htmlFor="phone" value={t('phone')} />
          <TextInput
            id="phone"
            name="phone"
            placeholder={`${t('input')} ${t('phone')}`}
            defaultValue={
              (state?.formData?.get('phone') as string) ??
              initFormData.phone ??
              ''
            }
            color={state?.errors?.phone ? 'failure' : 'gray'}
          />
        </div>
        {state?.errors?.phone && (
          <ul>
            {state.errors.phone.map((error) => (
              <li className="text-sm text-red-500" key={error}>
                {error}
              </li>
            ))}
          </ul>
        )}

        <div className="mb-2 block">
          <Label htmlFor="question" value={t('question')} />
          <TextInput
            id="question"
            name="question"
            placeholder={`${t('input')} ${t('question')}`}
            defaultValue={
              (state?.formData?.get('question') as string) ??
              initFormData.question ??
              ''
            }
            color={state?.errors?.question ? 'failure' : 'gray'}
          />
        </div>
        {state?.errors?.question && (
          <ul>
            {state.errors.question.map((error) => (
              <li className="text-sm text-red-500" key={error}>
                {error}
              </li>
            ))}
          </ul>
        )}

        <div className="mb-2 block">
          <Label htmlFor="answer" value={t('answer')} />
          <TextInput
            id="answer"
            name="answer"
            placeholder={`${t('input')} ${t('answer')}`}
            defaultValue={
              (state?.formData?.get('answer') as string) ??
              initFormData.answer ??
              ''
            }
            color={state?.errors?.answer ? 'failure' : 'gray'}
          />
        </div>
        {state?.errors?.answer && (
          <ul>
            {state.errors.answer.map((error) => (
              <li className="text-sm text-red-500" key={error}>
                {error}
              </li>
            ))}
          </ul>
        )}

        <Button disabled={pending} type="submit">
          {t('update')}
        </Button>
      </form>

      {state?.message && (
        <Toast className="fixed bottom-5 right-5 z-10">
          <div className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-orange-100 text-orange-500 dark:bg-orange-700 dark:text-orange-200">
            <ShieldAlert />
          </div>
          <div className="ml-3 text-sm font-normal">{state?.message}</div>
          <Toast.Toggle onClick={() => (state.message = '')} />
        </Toast>
      )}
    </>
  );
};

export default UpdateUserInfoForm;
export { UpdateUserInfoForm };
