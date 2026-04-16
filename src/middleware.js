import { NextResponse } from 'next/server';

export function middleware(request) {
  const authCookie = request.cookies.get('auth');
  const { pathname } = request.nextUrl;

  if (!authCookie && pathname === '/') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (authCookie && pathname === '/login') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/login'],
};
