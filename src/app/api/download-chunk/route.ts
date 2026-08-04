import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';

export async function GET(request: NextRequest) {
  const chunk = request.nextUrl.searchParams.get('chunk');
  if (!chunk) return NextResponse.json({ error: 'Missing ?chunk= parameter' }, { status: 400 });
  try {
    const filePath = join(process.cwd(), 'public', `afrispine-chunk-${chunk}`);
    const buffer = await readFile(filePath);
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="afrispine-chunk-${chunk}"`,
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch {
    return NextResponse.json({ error: 'Chunk not found' }, { status: 404 });
  }
}
