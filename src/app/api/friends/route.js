import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request) {
  const userId = request.cookies.get('auth')?.value;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 1. Get Incoming Pending Requests
    const pendingRequests = await prisma.friendship.findMany({
      where: {
        addresseeId: userId,
        status: 'PENDING'
      },
      include: {
        requester: { select: { id: true, name: true } }
      }
    });

    // 2. Get All Accepted Friends
    const acceptedBonds = await prisma.friendship.findMany({
      where: {
        status: 'ACCEPTED',
        OR: [
          { requesterId: userId },
          { addresseeId: userId }
        ]
      },
      include: {
        requester: { select: { id: true, name: true } },
        addressee: { select: { id: true, name: true } }
      }
    });

    // Map accepted into a clean user array normalizing who is the 'friend'
    const friends = acceptedBonds.map(bond => {
      if (bond.requesterId === userId) return { id: bond.addressee.id, name: bond.addressee.name };
      return { id: bond.requester.id, name: bond.requester.name };
    });

    return NextResponse.json({ pendingRequests, friends });
  } catch (error) {
    console.error('Friends Fetch Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
