import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request) {
  try {
    const { name, password, email, city, country, phone, bio } = await request.json();

    if (!name || !password) {
      return NextResponse.json({ error: 'Missing name or password' }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { name }
    });

    if (existingUser) {
      return NextResponse.json({ error: 'Username already taken' }, { status: 400 });
    }

    // Create new user (plain text password for now as per current project architecture)
    const user = await prisma.user.create({
      data: {
        name,
        password,
        email: email || null,
        city: city || null,
        country: country || null,
        phone: phone || null,
        bio: bio || null
      }
    });

    // Create default categories for the new user
    await prisma.category.createMany({
      data: [
        { id: `fav-${user.id}`, label: 'Favorites', color: '#ef4444', userId: user.id },
        { id: `work-${user.id}`, label: 'Work', color: '#3b82f6', userId: user.id },
        { id: `visit-${user.id}`, label: 'To Visit', color: '#10b981', userId: user.id }
      ]
    });

    const response = NextResponse.json({ success: true, user: { id: user.id, name: user.name } });

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
    console.error('Signup error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
