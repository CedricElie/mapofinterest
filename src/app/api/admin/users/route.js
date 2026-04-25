import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request) {
  const userId = request.cookies.get('auth')?.value;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = await prisma.user.findUnique({ where: { id: userId } });
  if (!admin || admin.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';

  try {
    const users = await prisma.user.findMany({
      where: {
        name: { contains: q }
      },
      select: {
        id: true,
        name: true,
        role: true,
        disabled: true,
        createdAt: true,
        _count: {
          select: { pois: true, comments: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
