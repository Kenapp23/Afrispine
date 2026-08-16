import { NextRequest, NextResponse } from 'next/server';
import { db, dbReady } from '@/lib/db';
import { generateTrailer } from '@/lib/trailer-engine';

const CF_WEBHOOK_SECRET = process.env.CF_WEBHOOK_SECRET || '';
const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID || '';
const CF_API_TOKEN = process.env.CF_API_TOKEN || '';

/**
 * POST /api/webhooks/cloudflare-stream-ready
 *
 * Receives Cloudflare Stream webhook when a video upload completes.
 * Creates the Video row with status 'processing' and triggers
 * AI trailer generation if no custom trailer was provided.
 *
 * Webhook body: { uid: string, status: string, meta: { title, category, creatorId, ... } }
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Verify webhook signature (fail-closed, same pattern as eversend webhook)
    const sig = req.headers.get('webhook-signature') || req.headers.get('cf-webhook-signature') || '';
    if (CF_WEBHOOK_SECRET && sig !== CF_WEBHOOK_SECRET) {
      // If a secret is configured, require it. If not, allow (dev mode).
      console.warn('[cf-stream-webhook] Invalid or missing signature.');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
    }

    if (!dbReady) {
      return NextResponse.json({ error: 'Database not ready' }, { status: 503 });
    }

    const body = await req.json();
    const { uid, status, meta } = body;

    if (!uid || status !== 'ready') {
      return NextResponse.json({ ok: true, message: 'Ignoring non-ready event' });
    }

    if (!meta?.creatorId || !meta?.title) {
      console.error('[cf-stream-webhook] Missing meta.creatorId or meta.title:', JSON.stringify(meta));
      return NextResponse.json({ error: 'Missing required metadata' }, { status: 400 });
    }

    // 2. Fetch video details from Cloudflare to get thumbnail/duration
    let thumbnailUrl: string | null = null;
    let duration: number | null = null;
    try {
      if (CF_ACCOUNT_ID && CF_API_TOKEN) {
        const videoRes = await fetch(
          `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/stream/${uid}`,
          { headers: { Authorization: `Bearer ${CF_API_TOKEN}` } },
        );
        if (videoRes.ok) {
          const videoData = await videoRes.json();
          thumbnailUrl = videoData.result?.thumbnail || videoData.result?.poster || null;
          duration = videoData.result?.duration ?? videoData.result?.durationSeconds ?? null;
        }
      }
    } catch (e) {
      console.warn('[cf-stream-webhook] Could not fetch video details from CF:', e);
    }

    // 3. Create Video row
    const video = await db.video.create({
      data: {
        creatorId: meta.creatorId,
        title: meta.title,
        description: meta.description || null,
        category: meta.category,
        ticketPriceKes: meta.ticketPriceKes ?? 0,
        cfPremiumStreamId: uid,
        cfPreviewStreamId: null,
        trailerSource: meta.trailerUrl ? 'creator' : 'ai',
        thumbnailUrl,
        durationSeconds: duration ? Math.round(duration) : null,
        status: 'processing',
      },
    });

    console.log(`[cf-stream-webhook] Created Video ${video.id} (cfUID: ${uid}) with status=processing`);

    // 4. If creator supplied a custom trailer URL, use it directly
    if (meta.trailerUrl) {
      await db.video.update({
        where: { id: video.id },
        data: { cfPreviewStreamId: meta.trailerUrl, status: 'live' },
      });
      console.log(`[cf-stream-webhook] Video ${video.id} set live with creator-supplied trailer`);
      return NextResponse.json({ ok: true, videoId: video.id, trailerSource: 'creator' });
    }

    // 5. Trigger AI trailer generation (fire-and-forget)
    if (CF_ACCOUNT_ID && CF_API_TOKEN) {
      generateTrailer(video.id, uid, CF_ACCOUNT_ID, CF_API_TOKEN)
        .then(async (previewStreamId) => {
          if (previewStreamId) {
            await db.video.update({
              where: { id: video.id },
              data: { cfPreviewStreamId: previewStreamId, status: 'live' },
            });
            console.log(`[cf-stream-webhook] Video ${video.id} is now LIVE with AI trailer`);
          } else {
            // Even without trailer, make it live so it's not stuck forever
            await db.video.update({
              where: { id: video.id },
              data: { status: 'live' },
            });
            console.warn(`[cf-stream-webhook] Video ${video.id} went live without trailer (generation failed)`);
          }
        })
        .catch(async (err) => {
          console.error(`[cf-stream-webhook] Trailer generation failed for ${video.id}:`, err);
          await db.video.update({
            where: { id: video.id },
            data: { status: 'live' },
          });
        });
    } else {
      // No CF creds — just go live without trailer
      await db.video.update({
        where: { id: video.id },
        data: { status: 'live' },
      });
    }

    return NextResponse.json({ ok: true, videoId: video.id, status: 'processing' });
  } catch (error: any) {
    console.error('[cf-stream-webhook] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
