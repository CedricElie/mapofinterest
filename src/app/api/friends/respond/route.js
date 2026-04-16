import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request) {
  const userId = request.cookies.get('auth')?.value;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { friendshipId, action } = await request.json(); // ACTION: 'ACCEPT' or 'DECLINE'
    
    if (!friendshipId || !action) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const friendship = await prisma.friendship.findUnique({ where: { id: friendshipId } });
    if (!friendship || friendship.addresseeId !== userId) {
      return NextResponse.json({ error: 'Invalid Friendship mapping' }, { status: 400 });
    }

    if (action === 'DECLINE') {
      await prisma.friendship.delete({ where: { id: friendshipId } });
      return NextResponse.json({ success: true, status: 'DELETED' });
    }

    if (action === 'ACCEPT') {
      await prisma.friendship.update({
        where: { id: friendshipId },
        data: { status: 'ACCEPTED' }
      });

      // Find my name to tell the requester who accepted it!
      const myUser = await prisma.user.findUnique({ where: { id: userId } });

      await prisma.notification.create({
        data: {
          userId: friendship.requesterId,
          type: 'FRIEND_ACCEPTED',
          message: `${myUser.name} accepted your friend request!`
        }
      });

      return NextResponse.json({ success: true, status: 'ACCEPTED' });
    }

    return NextResponse.json({ error: 'Invalid Action' }, { status: 400 });
  } catch (error) {
    console.error('Friend Respond Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
