import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function DELETE(request, { params }) {
  const userId = request.cookies.get('auth')?.value;
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    // Verify ownership before deletion securely
    const targetPin = await prisma.poi.findUnique({ where: { id } });
    if (!targetPin || targetPin.userId !== userId) {
      return NextResponse.json({ error: 'Not Found or Unauthorized' }, { status: 403 });
    }

    const currentUser = await prisma.user.findUnique({ where: { id: userId } });
    const isCreator = !targetPin.creatorName || targetPin.creatorName === currentUser.name;
    if (!isCreator) {
      return NextResponse.json({ error: 'Only the creator of a saved place can delete it' }, { status: 403 });
    }

    // Delete all linked comments globally
    await prisma.comment.deleteMany({
      where: { sharedPoiId: targetPin.sharedPoiId }
    });

    // Delete all cloned copies of this POI globally
    await prisma.poi.deleteMany({
       where: { sharedPoiId: targetPin.sharedPoiId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting pin:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  const userId = request.cookies.get('auth')?.value;

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const targetPin = await prisma.poi.findUnique({ where: { id } });
    if (!targetPin || targetPin.userId !== userId) {
      return NextResponse.json({ error: 'Not Found or Unauthorized' }, { status: 403 });
    }

    const currentUser = await prisma.user.findUnique({ where: { id: userId } });
    const isCreator = !targetPin.creatorName || targetPin.creatorName === currentUser.name;
    if (!isCreator) {
      return NextResponse.json({ error: 'Only the creator of a saved place can edit it' }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, address, rating, categoryId, images } = body;

    const updatedPin = await prisma.poi.update({
      where: { id },
      data: {
        title: title || undefined,
        description: description !== undefined ? description : undefined,
        address: address !== undefined ? address : undefined,
        rating: rating !== undefined ? rating : undefined,
        categoryId: categoryId || undefined,
        images: images !== undefined ? (images.length > 0 ? JSON.stringify(images) : null) : undefined
      },
      include: { category: true, user: true }
    });

    const formattedPin = {
      id: updatedPin.id,
      title: updatedPin.title,
      description: updatedPin.description,
      address: updatedPin.address,
      rating: updatedPin.rating,
      lat: updatedPin.latitude,
      lng: updatedPin.longitude,
      categoryId: updatedPin.categoryId,
      category: updatedPin.category,
      images: updatedPin.images ? JSON.parse(updatedPin.images) : [],
      createdAt: updatedPin.createdAt,
      creatorName: updatedPin.creatorName || (updatedPin.user ? updatedPin.user.name : 'Unknown')
    };

    return NextResponse.json(formattedPin);
  } catch (error) {
    console.error('Error updating pin:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
