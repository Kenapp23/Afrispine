import { NextRequest, NextResponse } from 'next/server';
import { db, dbReady } from '@/lib/db';
import { generateTrailer } from '@/lib/trailer-engine';

const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID || '';
const CF_API_TOKEN = process.env.CF_API_TOKEN || '';

/**
 * POST /api/creator/videos/[videoId]/trailer
 *
 * Triggers trailer regeneration for an existing video.
 * Body: { action: 'regenerate_ai' | 'set_custom', customStreamId?: string }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ videoId: string }> },
) {
  try {
    const { videoId } = await params;
    if (!dbReady) return NextResponse.json({ error: 'Database not ready' }, { status: 503 });

    const video = await db.video.findUnique({ where: { id: videoId } });
    if (!video) return NextResponse.json({ error: 'Video not found' }, { status: 404 });

    const body = await req.json();
    const { action, customStreamId } = body;

    if (action === 'set_custom' && customStreamId) {
      // Creator uploaded their own trailer
      await db.video.update({
        where: { id: videoId },
        data: { cfPreviewStreamId: customStreamId, trailerSource: 'creator', status: 'live' },
      });
      return NextResponse.json({ ok: true, trailerSource: 'creator' });
    }

    if (action === 'regenerate_ai') {
      if (!video.cfPremiumStreamId || !CF_ACCOUNT_ID || !CF_API_TOKEN) {
        return NextResponse.json({ error: 'Cannot regenerate: missing stream ID or CF credentials' }, { status: 400 });
      }

      // Set processing status
      await db.video.update({
        where: { id: videoId },
        data: { status: 'processing', cfPreviewStreamId: null, trailerSource: 'ai' },
      });

      // Fire-and-forget generation
      generateTrailer(videoId, video.cfPremiumStreamId, CF_ACCOUNT_ID, CF_API_TOKEN)
        .then(async (previewStreamId) => {
          await db.video.update({
            where: { id: videoId },
            data: {
              cfPreviewStreamId: previewStreamId,
              status: 'live',
              trailerSource: 'ai',
            },
          });
        })
        .catch(async () => {
          await db.video.update({ where: { id: videoId }, data: { status: 'live' } });
        });

      return NextResponse.json({ ok: true, status: 'processing', message: 'Trailer generation started' });
    }

    return NextResponse.json({ error: 'Invalid action. Use "regenerate_ai" or "set_custom".' }, { status: 400 });
  } catch (error: any) {
    console.error('[video/trailer] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
