import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import crypto from 'crypto';

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

    // 2. Fetch Receiver's existing Category constraints
    const friendCategories = await prisma.category.findMany({
      where: { OR: [{ userId: friendId }, { userId: null }] }
    });

    let sharedCount = 0;

    for (const pin of pinsToShare) {
      let targetCategoryId = pin.category.id;
      
      // If the Category belongs to the Sender implicitly, Receiver cannot utilize it! 
      // We check if they have a visually similar category, or we construct a new clone!
      if (pin.category.userId === userId) {
         const existingMatch = friendCategories.find(c => c.label.toLowerCase() === pin.category.label.toLowerCase());
         if (existingMatch) {
            targetCategoryId = existingMatch.id;
         } else {
            // Mints a localized custom category exclusively for Receiver
            const newCatId = `cat-${crypto.randomUUID()}`;
            const newCat = await prisma.category.create({
               data: {
                 id: newCatId,
                 label: pin.category.label,
                 color: pin.category.color,
                 userId: friendId
               }
            });
            // Persist the new array to avoid reminting duplicate categories during loops!
            friendCategories.push(newCat);
            targetCategoryId = newCat.id;
         }
      }

      // 3. Systematically clone exactly the POI structure logically mapping Receiver ID globally!
      await prisma.poi.create({
         data: {
            title: pin.title,
            description: pin.description,
            address: pin.address,
            rating: pin.rating,
            images: pin.images,
            latitude: pin.latitude,
            longitude: pin.longitude,
            userId: friendId,
            categoryId: targetCategoryId
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
