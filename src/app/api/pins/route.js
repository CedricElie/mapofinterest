import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request) {
  const userId = request.cookies.get('auth')?.value;
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const pins = await prisma.poi.findMany({
      where: {
        disabled: false,
        OR: [
          { userId },
          { sharedWith: { some: { id: userId } } }
        ]
      },
      include: { category: true, user: true }
    });
    
    const formattedPins = pins.map(p => ({
      id: p.id,
      title: p.title,
      description: p.description,
      address: p.address,
      lat: p.latitude,
      lng: p.longitude,
      rating: p.rating,
      categoryId: p.categoryId,
      category: p.category,
      images: p.images ? JSON.parse(p.images) : [],
      createdAt: p.createdAt,
      creatorName: p.creatorName || (p.user ? p.user.name : 'Unknown'),
      sharedPoiId: p.sharedPoiId
    }));

    return NextResponse.json(formattedPins);
  } catch (error) {
    console.error('Error fetching pins:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  const userId = request.cookies.get('auth')?.value;
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, description, address, rating, lat, lng, categoryId, images } = body;

    if (!title || !lat || !lng || !categoryId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const currentUser = await prisma.user.findUnique({ where: { id: userId } });

    const newPin = await prisma.poi.create({
      data: {
        title,
        description,
        address,
        rating,
        latitude: lat,
        longitude: lng,
        userId,
        creatorName: currentUser?.name || 'Unknown',
        categoryId,
        images: images && images.length > 0 ? JSON.stringify(images) : null
      },
      include: { category: true }
    });

    const formattedPin = {
      id: newPin.id,
      title: newPin.title,
      description: newPin.description,
      address: newPin.address,
      rating: newPin.rating,
      lat: newPin.latitude,
      lng: newPin.longitude,
      categoryId: newPin.categoryId,
      category: newPin.category,
      images: newPin.images ? JSON.parse(newPin.images) : [],
      created: true, // flag helping UI mapping
      createdAt: newPin.createdAt,
      creatorName: newPin.creatorName,
      sharedPoiId: newPin.sharedPoiId
    };

    return NextResponse.json(formattedPin);
  } catch (error) {
    console.error('Error creating pin:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
