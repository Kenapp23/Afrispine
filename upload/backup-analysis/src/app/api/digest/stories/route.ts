import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// POST /api/digest/stories — create a new story (admin only)
export async function POST(req: NextRequest) {
  try {
    const { error, res: authRes, admin } = await requireAdmin(req);
    if (error || authRes) return authRes!;

    const body = await req.json();
    const {
      issueId,
      section,
      title,
      subtitle,
      bodyHtml,
      bodyText,
      author,
      imageUrl,
      readTime,
      sortOrder,
      meta,
    } = body as {
      issueId?: string;
      section?: string;
      title?: string;
      subtitle?: string;
      bodyHtml?: string;
      bodyText?: string;
      author?: string;
      imageUrl?: string;
      readTime?: number;
      sortOrder?: number;
      meta?: Record<string, unknown>;
    };

    const requiredFields = ['issueId', 'section', 'title'];
    const missing = requiredFields.filter(
      (f) => !(body as Record<string, unknown>)[f],
    );
    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missing.join(', ')}` },
        { status: 400 },
      );
    }

    const validSections = [
      'cover_story',
      'market_pulse',
      'company_spotlight',
      'opportunity',
      'diaspora_story',
      'podcast',
    ];
    if (!validSections.includes(section!)) {
      return NextResponse.json(
        {
          error: `Invalid section. Must be one of: ${validSections.join(', ')}`,
        },
        { status: 400 },
      );
    }

    // Verify issue exists
    const issue = await db.digestIssue.findUnique({ where: { id: issueId! } });
    if (!issue) {
      return NextResponse.json(
        { error: 'Issue not found' },
        { status: 404 },
      );
    }

    const slug = generateSlug(title!);

    const story = await db.digestStory.create({
      data: {
        issueId: issueId!,
        slug,
        section: section!,
        title: title!,
        subtitle: subtitle || '',
        bodyHtml: bodyHtml || '',
        bodyText: bodyText || '',
        author: author || 'AfriSpine Digest AI',
        imageUrl: imageUrl || '',
        readTime: readTime || 5,
        sortOrder: sortOrder || 0,
        meta: meta ? JSON.stringify(meta) : '{}',
      },
    });

    console.log(
      `[digest/stories] Admin ${admin!.email} created story "${slug}" in issue ${issueId}`,
    );

    return NextResponse.json(story, { status: 201 });
  } catch (e: any) {
    console.error('[digest/stories] POST', e);
    return NextResponse.json(
      { error: e.message || 'Internal server error' },
      { status: 500 },
    );
  }
}