import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request) {
  const userId = request.cookies.get('auth')?.value;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { friendId, pinIds } = await request.json();
    
    if (!friendId || !pinIds || !Array.isArray(pinIds) || pinIds.length === 0) {
      return NextResponse.json({ error: 'Missing parameters or invalid pin array' }, { status: 400 });
    }

    const currentUser = await prisma.user.findUnique({ where: { id: userId } });
    const friendUser = await prisma.user.findUnique({ where: { id: friendId } });

    if (!currentUser || !friendUser) {
      return NextResponse.json({ error: 'User mapping failed' }, { status: 404 });
    }

    // 1. Fetch exact source Maps checking authentication limits implicitly!
    const pinsToShare = await prisma.poi.findMany({
      where: {
        id: { in: pinIds },
        userId: userId
      },
      include: { category: true }
    });

    if (pinsToShare.length === 0) {
       return NextResponse.json({ error: 'No validated pins transferred' }, { status: 400 });
    }

    let sharedCount = 0;

    for (const pin of pinsToShare) {
      // Systematically connect the POI to the Receiver without duplicating entries
      await prisma.poi.update({
        where: { id: pin.id },
        data: {
          sharedWith: {
            connect: { id: friendId }
          }
        }
      });
      sharedCount++;
    }

    // 4. Dispatch Notifications Bi-Directionally!
    await prisma.notification.create({
      data: {
        userId: friendId,
        type: 'PINS_SHARED',
        message: `${currentUser.name} shared ${sharedCount} saved places with you!`
      }
    });

    await prisma.notification.create({
      data: {
        userId: userId,
        type: 'PINS_SENT',
        message: `You shared ${sharedCount} ${sharedCount === 1 ? 'place' : 'places'} with ${friendUser.name}.`
      }
    });

    return NextResponse.json({ success: true, count: sharedCount });

  } catch (error) {
    console.error('Data Transfer Engine Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
