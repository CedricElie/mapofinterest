import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request) {
  const userId = request.cookies.get('auth')?.value;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { addresseeId } = await request.json();
    if (!addresseeId) {
      return NextResponse.json({ error: 'Missing addressee' }, { status: 400 });
    }

    // Check if bond exists
    const existingBond = await prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: userId, addresseeId: addresseeId },
          { requesterId: addresseeId, addresseeId: userId }
        ]
      }
    });

    if (existingBond) {
      return NextResponse.json({ error: 'Friendship inherently exists or is pending' }, { status: 400 });
    }

    const requestBond = await prisma.friendship.create({
      data: {
        requesterId: userId,
        addresseeId: addresseeId,
        status: 'PENDING'
      }
    });

    // Fire off Notification locally!
    const requesterUser = await prisma.user.findUnique({ where: { id: userId } });
    await prisma.notification.create({
      data: {
        userId: addresseeId,
        type: 'FRIEND_REQUEST',
        message: `${requesterUser.name} sent you a friend request!`
      }
    });

    return NextResponse.json(requestBond);
  } catch (error) {
    console.error('Friend Request Submit Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
