import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

// GET /api/digest/issues/[slug] — get a single issue by slug with stories, sponsors, and analytics
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;

    const issue = await db.digestIssue.findUnique({
      where: { slug },
      include: {
        stories: {
          orderBy: { sortOrder: 'asc' },
        },
        sponsorSlots: true,
      },
    });

    if (!issue) {
      return NextResponse.json(
        { error: 'Issue not found' },
        { status: 404 },
      );
    }

    // Aggregate analytics
    const analytics = await db.digestAnalytics.groupBy({
      by: ['eventType'],
      where: { issueId: issue.id },
      _count: true,
    });

    const analyticsMap: Record<string, number> = {};
    for (const a of analytics) {
      analyticsMap[a.eventType] = a._count;
    }

    return NextResponse.json({
      ...issue,
      analyticsSummary: {
        totalImpressions: analyticsMap['impression'] || 0,
        totalClicks: analyticsMap['click'] || 0,
        totalShares: analyticsMap['share'] || 0,
        totalSubscribes: analyticsMap['subscribe'] || 0,
      },
    });
  } catch (e: any) {
    console.error('[digest/issues/[slug]] GET', e);
    return NextResponse.json(
      { error: e.message || 'Internal server error' },
      { status: 500 },
    );
  }
}

// PATCH /api/digest/issues/[slug] — update issue fields (admin only)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { error, res: authRes, admin } = await requireAdmin(req);
    if (error || authRes) return authRes!;

    const { slug } = await params;
    const body = await req.json();
    const { status, subject, coverHeadline, coverImageUrl, podcastUrl } =
      body as {
        status?: string;
        subject?: string;
        coverHeadline?: string;
        coverImageUrl?: string;
        podcastUrl?: string;
      };

    const existing = await db.digestIssue.findUnique({ where: { slug } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Issue not found' },
        { status: 404 },
      );
    }

    const updateData: Record<string, unknown> = {};
    if (subject !== undefined) updateData.subject = subject;
    if (coverHeadline !== undefined) updateData.coverHeadline = coverHeadline;
    if (coverImageUrl !== undefined) updateData.coverImageUrl = coverImageUrl;
    if (podcastUrl !== undefined) updateData.podcastUrl = podcastUrl;

    // If status changes to published, set publishedAt
    if (status !== undefined) {
      updateData.status = status;
      if (status === 'published' && !existing.publishedAt) {
        updateData.publishedAt = new Date();
      }
      // If unpublishing, clear publishedAt
      if (status === 'draft') {
        updateData.publishedAt = null;
      }
    }

    const updated = await db.digestIssue.update({
      where: { slug },
      data: updateData,
    });

    console.log(
      `[digest/issues/${slug}] Admin ${admin!.email} updated issue`,
    );

    return NextResponse.json(updated);
  } catch (e: any) {
    console.error('[digest/issues/[slug]] PATCH', e);
    return NextResponse.json(
      { error: e.message || 'Internal server error' },
      { status: 500 },
    );
  }
}

// DELETE /api/digest/issues/[slug] — delete issue (admin only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { error, res: authRes, admin } = await requireAdmin(req);
    if (error || authRes) return authRes!;

    const { slug } = await params;

    const existing = await db.digestIssue.findUnique({
      where: { slug },
      include: {
        _count: { select: { stories: true } },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Issue not found' },
        { status: 404 },
      );
    }

    // Hard delete if no stories, soft delete (set status to draft and clear data) otherwise
    if (existing._count.stories === 0) {
      await db.digestIssue.delete({ where: { slug } });
      console.log(
        `[digest/issues/${slug}] Admin ${admin!.email} hard-deleted issue (no stories)`,
      );
    } else {
      await db.digestIssue.update({
        where: { slug },
        data: {
          status: 'draft',
          htmlContent: '',
          emailHtml: '',
          whatsappText: '',
          coverImageUrl: '',
          podcastUrl: '',
          publishedAt: null,
        },
      });
      console.log(
        `[digest/issues/${slug}] Admin ${admin!.email} soft-deleted issue (had ${existing._count.stories} stories)`,
      );
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error('[digest/issues/[slug]] DELETE', e);
    return NextResponse.json(
      { error: e.message || 'Internal server error' },
      { status: 500 },
    );
  }
}