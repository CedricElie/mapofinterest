import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request) {
  const userId = request.cookies.get('auth')?.value;
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Fetch global standard categories + any user-created custom ones
    const categories = await prisma.category.findMany({
      where: {
        OR: [
          { userId: null },
          { userId: userId }
        ]
      }
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
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
    const { label, color } = body;

    if (!label || !color) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const id = label.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const newCat = await prisma.category.create({
      data: {
        id: `${userId}-${id}`,
        label,
        color,
        userId
      }
    });

    return NextResponse.json(newCat);
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
