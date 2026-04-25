import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request) {
  const userId = request.cookies.get('auth')?.value;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const sharedPoiId = searchParams.get('sharedPoiId');

  if (!sharedPoiId) {
    return NextResponse.json({ error: 'sharedPoiId is required' }, { status: 400 });
  }

  try {
    const comments = await prisma.comment.findMany({
      where: { sharedPoiId },
      include: { user: { select: { name: true, avatar: true } } },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(comments);
  } catch (error) {
    console.error('Fetch comments error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  const userId = request.cookies.get('auth')?.value;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { sharedPoiId, text } = await request.json();
    
    if (!sharedPoiId || !text || text.trim() === '') {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }

    // Verify user actually has access to this POI family (they have a pinned copy)
    const access = await prisma.poi.findFirst({
       where: { sharedPoiId, userId }
    });

    if (!access) {
       return NextResponse.json({ error: 'You do not have access to comment on this place' }, { status: 403 });
    }

    const comment = await prisma.comment.create({
      data: {
        text: text.trim(),
        sharedPoiId,
        userId
      },
      include: { user: { select: { name: true, avatar: true } } }
    });

    // Notify all participants who have a copy of this POI
    const linkedPois = await prisma.poi.findMany({
      where: { sharedPoiId },
      select: { userId: true, title: true }
    });

    const userIdsToNotify = Array.from(new Set(linkedPois.map(p => p.userId))).filter(id => id !== userId);
    const poiTitle = linkedPois[0]?.title || 'a place';

    if (userIdsToNotify.length > 0) {
      await Promise.all(userIdsToNotify.map(id => 
        prisma.notification.create({
          data: {
            userId: id,
            type: 'NEW_COMMENT',
            message: `${comment.user.name} commented on "${poiTitle}".`
          }
        })
      ));
    }

    return NextResponse.json(comment);
  } catch (error) {
    console.error('Create comment error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
