import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/digest/stories/[slug] — get a story by slug with issue context and related stories
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(req.url);
    const issueSlug = searchParams.get('issue');

    const story = await db.digestStory.findFirst({
      where: { slug },
      include: {
        issue: true,
      },
    });

    if (!story) {
      return NextResponse.json(
        { error: 'Story not found' },
        { status: 404 },
      );
    }

    // If issueSlug provided, verify context match
    if (issueSlug && story.issue.slug !== issueSlug) {
      return NextResponse.json(
        { error: 'Story does not belong to the specified issue' },
        { status: 400 },
      );
    }

    // Get related stories from the same issue (same section first, then other sections)
    const relatedStories = await db.digestStory.findMany({
      where: {
        issueId: story.issueId,
        id: { not: story.id },
      },
      orderBy: { sortOrder: 'asc' },
      take: 6,
    });

    // Track impression analytics
    await db.digestAnalytics.create({
      data: {
        issueId: story.issueId,
        eventType: 'impression',
        source: 'web',
        metadata: JSON.stringify({
          storyId: story.id,
          storySlug: story.slug,
          section: story.section,
        }),
      },
    });

    return NextResponse.json({
      ...story,
      meta: JSON.parse(story.meta || '{}'),
      issue: {
        id: story.issue.id,
        slug: story.issue.slug,
        issueNumber: story.issue.issueNumber,
        subject: story.issue.subject,
        status: story.issue.status,
      },
      relatedStories,
    });
  } catch (e: any) {
    console.error('[digest/stories/[slug]] GET', e);
    return NextResponse.json(
      { error: e.message || 'Internal server error' },
      { status: 500 },
    );
  }
}