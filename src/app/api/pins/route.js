import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request) {
  const userId = request.cookies.get('auth')?.value;
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const pins = await prisma.poi.findMany({
      where: { userId },
      include: { category: true }
    });
    
    const formattedPins = pins.map(p => ({
      id: p.id,
      title: p.title,
      description: p.description,
      lat: p.latitude,
      lng: p.longitude,
      rating: p.rating,
      categoryId: p.categoryId,
      category: p.category,
      images: p.images ? JSON.parse(p.images) : []
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
    const { title, description, rating, lat, lng, categoryId, images } = body;

    if (!title || !lat || !lng || !categoryId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newPin = await prisma.poi.create({
      data: {
        title,
        description,
        rating,
        latitude: lat,
        longitude: lng,
        userId,
        categoryId,
        images: images && images.length > 0 ? JSON.stringify(images) : null
      },
      include: { category: true }
    });

    const formattedPin = {
      id: newPin.id,
      title: newPin.title,
      description: newPin.description,
      rating: newPin.rating,
      lat: newPin.latitude,
      lng: newPin.longitude,
      categoryId: newPin.categoryId,
      category: newPin.category,
      images: newPin.images ? JSON.parse(newPin.images) : [],
      created: true // flag helping UI mapping
    };

    return NextResponse.json(formattedPin);
  } catch (error) {
    console.error('Error creating pin:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
