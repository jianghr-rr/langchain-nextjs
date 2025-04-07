import 'server-only';
import { cookies } from 'next/headers';
import { cache } from 'react';
import { decrypt } from '~/lib/auth/session';

// 验证session
export const verifySession = cache(async () => {
  const cookie = (await cookies()).get('Authentication')?.value;
  const session = await decrypt(cookie);

  if (!session?.userId) {
    return { isAuth: false, userId: null };
  }

  return { isAuth: true, userId: session?.userId as number };
});

export const getUserId = cache(async () => {
  const { userId } = await verifySession();
  return userId;
});
