/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { cookies } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';
import { i18nRouter } from 'next-i18n-router';
// import { decrypt } from '~/lib/auth/session';
import i18nConfig from './i18nConfig';

// 1. Specify protected and public routes
// const protectedRoutes = ['/personal-center', '/personal-center/*'];
// const publicRoutes = ['/'];

export function middleware(request: NextRequest) {
  // const response = i18nRouter(request as any, i18nConfig);
  // 获取当前路径
  // const { pathname } = request.nextUrl;

  // 匹配受保护路由
  // const isProtectedRoute = protectedRoutes.some((route) =>
  //   pathname.startsWith(route.replace('/*', ''))
  // );

  // const isPublicRoute = publicRoutes.includes(pathname);

  // 3. Decrypt the session from the cookie
  // const cookie = (await cookies()).get('Authentication')?.value;
  // const session = await decrypt(cookie);

  // if (isProtectedRoute && !session?.userId) {
  //   return NextResponse.redirect(new URL('/', request.nextUrl));
  // }

  // // 5. Redirect to /dashboard if the user is authenticated
  // if (
  //   isPublicRoute &&
  //   session?.userId &&
  //   !req.nextUrl.pathname.startsWith('/dashboard')
  // ) {
  //   return NextResponse.redirect(new URL('/dashboard', req.nextUrl));
  // }

  // 返回处理后的响应
  return i18nRouter(request as any, i18nConfig);
  // return NextResponse.next();
}

// only applies this middleware to files in the app directory
export const config = {
  matcher: '/((?!api|static|.*\\..*|_next).*)',
};
