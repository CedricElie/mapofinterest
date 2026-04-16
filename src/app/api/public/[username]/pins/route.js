import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request, { params }) {
  try {
    // Await params object if Next.js version requires it, destructure safely
    const { username } = params; 
    
    const targetUser = await prisma.user.findUnique({ where: { name: username } });
    if (!targetUser) return NextResponse.json({ error: 'Map Not Found' }, { status: 404 });

    const pins = await prisma.poi.findMany({
      where: { userId: targetUser.id },
      include: { category: true }
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
      category: p.category ? { color: p.category.color, label: p.category.label } : null,
      images: p.images ? JSON.parse(p.images) : []
    }));

    return NextResponse.json(formattedPins);
  } catch (error) {
    console.error('Public Map Share Fetch Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
