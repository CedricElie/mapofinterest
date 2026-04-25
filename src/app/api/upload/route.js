import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';

export async function POST(request) {
  const userId = request.cookies.get('auth')?.value;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await request.formData();
    const files = data.getAll('file');

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files specificed.' }, { status: 400 });
    }

    const uploadedUrls = [];

    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Create a unique physical filename
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = file.name.split('.').pop() || 'png';
      const filename = `img-${uniqueSuffix}.${ext}`;

      // Write strictly inside Next.js Generic structural /public/uploads directory
      const path = join(process.cwd(), 'public/uploads', filename);
      await writeFile(path, buffer);
      
      uploadedUrls.push(`/uploads/${filename}`);
    }

    return NextResponse.json({ urls: uploadedUrls });
  } catch (error) {
    console.error('Error handling physical disk upload:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
