import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/digest/issues/latest — return the latest published issue with stories and sponsors
export async function GET() {
  try {
    const issue = await db.digestIssue.findFirst({
      where: { status: 'published' },
      orderBy: { publishedAt: 'desc' },
      include: {
        stories: {
          orderBy: { sortOrder: 'asc' },
        },
        sponsorSlots: {
          where: { status: 'approved' },
        },
      },
    });

    if (!issue) {
      return NextResponse.json(
        { error: 'No published issue found' },
        { status: 404 },
      );
    }

    return NextResponse.json(issue);
  } catch (e: any) {
    console.error('[digest/issues/latest]', e);
    return NextResponse.json(
      { error: e.message || 'Internal server error' },
      { status: 500 },
    );
  }
}