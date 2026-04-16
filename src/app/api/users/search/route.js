import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request) {
  const userId = request.cookies.get('auth')?.value;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');

  if (!q || q.length < 2) {
    return NextResponse.json([]);
  }

  try {
    const users = await prisma.user.findMany({
      where: {
        name: { contains: q.toLowerCase() },
        id: { not: userId } // Don't return self
      },
      select: { id: true, name: true },
      take: 10
    });

    const userIds = users.map(u => u.id);
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { requesterId: userId, addresseeId: { in: userIds } },
          { requesterId: { in: userIds }, addresseeId: userId }
        ]
      }
    });

    const mappedUsers = users.map(u => {
       const bond = friendships.find(f => f.requesterId === u.id || f.addresseeId === u.id);
       // Track if the requesting user was specifically the sender, to properly label 'pending'
       const isSender = bond ? bond.requesterId === userId : false;
       return { ...u, friendshipStatus: bond ? bond.status : null, isSender };
    });

    return NextResponse.json(mappedUsers);
  } catch (error) {
    console.error('User Search Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
