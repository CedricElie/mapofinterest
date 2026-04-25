import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request, { params }) {
  const adminId = request.cookies.get('auth')?.value;
  if (!adminId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = await prisma.user.findUnique({ where: { id: adminId } });
  if (!admin || admin.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;

  try {
    const poi = await prisma.poi.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        category: true
      }
    });

    if (!poi) return NextResponse.json({ error: 'POI not found' }, { status: 404 });

    return NextResponse.json(poi);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  const adminId = request.cookies.get('auth')?.value;
  if (!adminId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = await prisma.user.findUnique({ where: { id: adminId } });
  if (!admin || admin.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const { disabled } = await request.json();

  try {
    const poi = await prisma.poi.update({
      where: { id },
      data: { disabled }
    });
    return NextResponse.json(poi);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const adminId = request.cookies.get('auth')?.value;
  if (!adminId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = await prisma.user.findUnique({ where: { id: adminId } });
  if (!admin || admin.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;

  try {
    const targetPin = await prisma.poi.findUnique({ where: { id } });
    if (!targetPin) return NextResponse.json({ error: 'Not Found' }, { status: 404 });

    // Admin wiping globally wipes comments too
    await prisma.comment.deleteMany({
      where: { sharedPoiId: targetPin.sharedPoiId }
    });

    await prisma.poi.deleteMany({
       where: { sharedPoiId: targetPin.sharedPoiId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
