import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAdminFromRequest } from '@/lib/auth';
import { ensureDb } from '@/lib/ensure-db';

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string[] }> }) {
  await ensureDb();
  const { slug } = await params;
  const path = slug.join('/');

  // Auth check for admin routes
  if (path.startsWith('admin/')) {
    const admin = getAdminFromRequest(req);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    // ─── /api/digest/admin/stats ───
    if (path === 'admin/stats') {
      const totalSubscribers = await db.digestSubscription.count();
      const activeSubscribers = await db.digestSubscription.count({ where: { isActive: true } });
      const proSubscribers = await db.digestSubscription.count({ where: { isActive: true } });
      const totalIssues = await db.digestIssue.count({ where: { status: 'published' } });
      const totalDrafts = await db.digestIssue.count({ where: { status: 'draft' } });

      return NextResponse.json({
        totalSubscribers,
        activeSubscribers,
        proSubscribers,
        totalIssues,
        totalDrafts,
        totalStories: 0,
        totalAdRevenue: 0,
        avgOpenRate: 0,
        recentAds: [],
      });
    }

    // ─── /api/digest/issues ───
    if (path === 'issues') {
      const searchParams = req.nextUrl.searchParams;
      const status = searchParams.get('status') || 'all';
      const limit = parseInt(searchParams.get('limit') || '50', 10);

      const where: Record<string, any> = {};
      if (status !== 'all') {
        where.status = status;
      }

      const issues = await db.digestIssue.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

      return NextResponse.json(
        issues.map((iss, i) => ({
          id: iss.id,
          title: iss.title,
          headline: iss.title,
          slug: iss.slug,
          issueNumber: issues.length - i,
          storyCount: 0,
          status: iss.status,
          publishedAt: iss.publishedAt,
          createdAt: iss.createdAt,
        }))
      );
    }

    // ─── /api/digest/stories ───
    if (path === 'stories') {
      const searchParams = req.nextUrl.searchParams;
      const limit = parseInt(searchParams.get('limit') || '50', 10);

      // DigestStory model doesn't exist yet, return empty array
      return NextResponse.json([]);
    }

    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  } catch (e: any) {
    console.error('[digest-api GET] Error:', path, e.message);
    return NextResponse.json({ error: e.message || 'Internal error' }, { status: 500 });
  }
}
