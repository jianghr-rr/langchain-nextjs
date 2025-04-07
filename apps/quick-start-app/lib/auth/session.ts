import 'server-only';
import { eq } from 'drizzle-orm';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import type { SessionPayload } from '~/components/signup/definitions';
import { db } from '~/db';
import { sessions } from '~/db/migrations/schema';

const secretKey = process.env.SESSION_SECRET;
if (!secretKey) {
  throw new Error('SESSION_SECRET is not defined in environment variables');
}
const encodedKey = new TextEncoder().encode(secretKey);

export async function encrypt(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(encodedKey);
}

export async function decrypt(session: string | undefined = '') {
  try {
    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ['HS256'],
    });
    return payload;
  } catch (error: unknown) {
    console.error('Failed to verify session:', (error as Error).message);
    return null;
  }
}

export async function createSession(userId: string): Promise<boolean> {
  // const expiresAt = new Date(Date.now() + 1 * 1 * 60 * 60 * 1000);
  const maxAge = 24 * 60 * 60; // Cookie 存活时间为24小时
  try {
    // await db.insert(sessions).values({ userId, maxAge });
    const sessionToken = await encrypt({ userId, maxAge });
    const cookieStore = await cookies();
    cookieStore.set('Authentication', sessionToken, {
      httpOnly: true,
      secure: true,
      maxAge: maxAge,
      path: '/',
    });

    return true;
  } catch (error) {
    console.error('Failed to create session:', error);
    return false;
  }
}

export async function deleteSession(userId: string) {
  try {
    await db.delete(sessions).where(eq(sessions.userId, userId)).execute();
  } catch (error) {
    console.error('Failed to delete session from database:', error);
  }

  const cookieStore = await cookies();
  cookieStore.delete('Authentication');
}
