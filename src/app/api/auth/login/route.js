import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request) {
  try {
    const { name, password } = await request.json();

    if (!name || !password) {
      return NextResponse.json({ error: 'Missing name or password' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { name }
    });

    if (!user || user.password !== password) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    if (user.disabled) {
      return NextResponse.json({ error: 'Your account has been disabled by an administrator' }, { status: 403 });
    }

    const response = NextResponse.json({ success: true, user: { id: user.id, name: user.name, role: user.role } });

    // Enable insecure cookies for dev network access (mobile devices)
    const isProd = process.env.NODE_ENV === 'production';

    response.cookies.set({
      name: 'auth',
      value: user.id,
      httpOnly: true,
      path: '/',
      secure: isProd,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 1 week
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
