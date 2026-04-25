import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

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
    const user = await prisma.user.update({
      where: { id },
      data: { disabled }
    });
    return NextResponse.json(user);
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
    // Delete related entities first (cascading emulation)
    await prisma.comment.deleteMany({ where: { userId: id } });
    await prisma.notification.deleteMany({ where: { userId: id } });
    await prisma.friendship.deleteMany({ where: { OR: [{ requesterId: id }, { addresseeId: id }] } });
    await prisma.poi.deleteMany({ where: { userId: id } });
    await prisma.category.deleteMany({ where: { userId: id } });

    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
