import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request, { params }) {
  try {
    const { username } = params;
    const targetUser = await prisma.user.findUnique({ where: { name: username } });
    if (!targetUser) return NextResponse.json({ error: 'Map Not Found' }, { status: 404 });

    const categories = await prisma.category.findMany({
      where: {
        OR: [
          { userId: null },
          { userId: targetUser.id }
        ]
      }
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error('Public Category Fetch Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
