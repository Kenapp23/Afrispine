import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

// GET /api/digest/issues — list issues with story and sponsor counts
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'published';
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
    const year = searchParams.get('year');

    const where: Record<string, unknown> = {};
    if (status && status !== 'all') {
      where.status = status;
    }
    if (year) {
      const startOfYear = new Date(`${parseInt(year, 10)}-01-01T00:00:00.000Z`);
      const endOfYear = new Date(`${parseInt(year, 10) + 1}-01-01T00:00:00.000Z`);
      where.issueDate = { gte: startOfYear, lt: endOfYear };
    }

    const issues = await db.digestIssue.findMany({
      where,
      orderBy: { issueDate: 'desc' },
      take: limit,
      include: {
        _count: {
          select: {
            stories: true,
            sponsorSlots: true,
          },
        },
      },
    });

    // Find the latest published issue to flag it
    const latestPublished = await db.digestIssue.findFirst({
      where: { status: 'published' },
      orderBy: { publishedAt: 'desc' },
      select: { id: true },
    });

    const issuesWithLatestFlag = issues.map((issue) => ({
      ...issue,
      isLatest: issue.id === latestPublished?.id,
    }));

    return NextResponse.json(issuesWithLatestFlag);
  } catch (e: any) {
    console.error('[digest/issues] GET', e);
    return NextResponse.json(
      { error: e.message || 'Internal server error' },
      { status: 500 },
    );
  }
}

// POST /api/digest/issues — create a new issue (admin only)
export async function POST(req: NextRequest) {
  try {
    const { error, res: authRes, admin } = await requireAdmin(req);
    if (error || authRes) return authRes!;

    const body = await req.json();
    const { issueNumber, slug, subject, coverHeadline } = body as {
      issueNumber?: number;
      slug?: string;
      subject?: string;
      coverHeadline?: string;
    };

    if (!issueNumber || !slug || !subject) {
      return NextResponse.json(
        { error: 'Missing required fields: issueNumber, slug, subject' },
        { status: 400 },
      );
    }

    // Check slug uniqueness
    const existing = await db.digestIssue.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json(
        { error: 'An issue with this slug already exists' },
        { status: 409 },
      );
    }

    // Auto-generate issueDate from issueNumber (next Thursday for weekly digest)
    const issueDate = new Date();
    issueDate.setDate(issueDate.getDate() + (4 - issueDate.getDay() + 7) % 7); // next Thursday

    const issue = await db.digestIssue.create({
      data: {
        issueNumber,
        slug,
        subject,
        coverHeadline: coverHeadline || '',
        status: 'draft',
        issueDate,
      },
    });

    console.log(
      `[digest/issues] Admin ${admin!.email} created issue #${issueNumber} "${slug}"`,
    );

    return NextResponse.json(issue, { status: 201 });
  } catch (e: any) {
    console.error('[digest/issues] POST', e);
    return NextResponse.json(
      { error: e.message || 'Internal server error' },
      { status: 500 },
    );
  }
}