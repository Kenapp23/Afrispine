/**
 * Content Signed Stream URL API
 *
 * GET: Returns a signed Cloudflare Stream URL for a video.
 *      Signs ALL streams (preview and premium) when signing is configured.
 *      For premium content, verifies the requester has a valid ContentTicket.
 *      Falls back to unsigned URL if no signing credentials are configured.
 *
 * Query params:
 *   videoId  - Required. The video to get a stream URL for.
 *   phone    - Viewer's M-Pesa phone (for ticket verification on premium content).
 */

import { NextRequest, NextResponse } from 'next/server';
import { db, dbReady } from '@/lib/db';
import { signCfStreamUrl } from '@/lib/cf-stream-sign';

const CF_STREAM_BASE = 'https://customer-c4f5c4f4.cloudflarestream.com';

function unsignedUrl(streamId: string): string {
  return `${CF_STREAM_BASE}/${streamId}/manifest/video.m3u8`;
}

export async function GET(req: NextRequest) {
  if (!dbReady) {
    return NextResponse.json({ error: 'Database not available' }, { status: 503 });
  }

  const { searchParams } = new URL(req.url);
  const videoId = searchParams.get('videoId');
  const phone = searchParams.get('phone') || '';

  if (!videoId) {
    return NextResponse.json({ error: 'videoId is required' }, { status: 400 });
  }

  try {
    // Fetch video details
    const video = await db.video.findUnique({
      where: { id: videoId },
      select: {
        cfPremiumStreamId: true,
        cfPreviewStreamId: true,
        ticketPriceKes: true,
        demoVideoUrl: true,
        status: true,
      },
    });

    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    if (video.status === 'takedown') {
      return NextResponse.json({ error: 'Video unavailable' }, { status: 403 });
    }

    // For demo/free content (no Cloudflare stream), return as-is
    if (!video.cfPremiumStreamId && !video.cfPreviewStreamId) {
      if (video.demoVideoUrl) {
        return NextResponse.json({ url: video.demoVideoUrl, signed: false });
      }
      return NextResponse.json({ error: 'No stream available' }, { status: 404 });
    }

    // Determine which stream ID to use
    let streamId: string | null = null;
    let isPremium = false;

    if (video.ticketPriceKes > 0 && video.cfPremiumStreamId) {
      // Premium content: verify ticket if phone provided
      if (phone) {
        const hasTicket = await db.contentTicket.findFirst({
          where: { videoId, viewerPhone: phone },
          select: { id: true },
        });
        if (hasTicket) {
          streamId = video.cfPremiumStreamId;
          isPremium = true;
        } else {
          // No ticket — fall to preview
          streamId = video.cfPreviewStreamId;
        }
      } else {
        // No phone provided but premium content — show preview
        streamId = video.cfPreviewStreamId;
      }
    } else if (video.cfPreviewStreamId) {
      // Free content with preview stream
      streamId = video.cfPreviewStreamId;
    } else if (video.cfPremiumStreamId) {
      // Premium stream but price is 0 — treat as free
      streamId = video.cfPremiumStreamId;
    }

    if (!streamId) {
      return NextResponse.json({ error: 'No stream available' }, { status: 404 });
    }

    // Generate signed URL
    const result = await signCfStreamUrl(streamId);
    return NextResponse.json({
      url: result.url,
      signed: result.signed,
      premium: isPremium,
    });
  } catch (err) {
    console.error('[content/signed-stream] GET error:', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
