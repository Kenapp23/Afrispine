/**
 * Content Signed Stream URL API
 *
 * GET: Returns a signed Cloudflare Stream URL for a video.
 *      Checks that the viewer has a valid ticket (ContentTicket) for premium content.
 *      Falls back to unsigned URL if signing key is not configured.
 *
 * Query params:
 *   videoId  - Required. The video to get a stream URL for.
 *   phone    - Viewer's M-Pesa phone (for ticket verification).
 */

import { NextRequest, NextResponse } from 'next/server';
import { db, dbReady } from '@/lib/db';
import { signCfStreamUrl, isCfStreamSigningConfigured } from '@/lib/cf-stream-sign';

const CF_STREAM_BASE = 'https://customer-c4f5c4f4.cloudflarestream.com';

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
    // Fetch video with premium stream ID
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

    // For demo/free content (no premium stream), return as-is
    if (!video.cfPremiumStreamId) {
      if (video.demoVideoUrl) {
        return NextResponse.json({ url: video.demoVideoUrl, signed: false });
      }
      if (video.cfPreviewStreamId) {
        const url = isCfStreamSigningConfigured()
          ? signCfStreamUrl(video.cfPreviewStreamId) ?? `${CF_STREAM_BASE}/${video.cfPreviewStreamId}/manifest/video.m3u8`
          : `${CF_STREAM_BASE}/${video.cfPreviewStreamId}/manifest/video.m3u8`;
        return NextResponse.json({ url, signed: isCfStreamSigningConfigured() });
      }
      return NextResponse.json({ error: 'No stream available' }, { status: 404 });
    }

    // For premium content, verify ticket if phone is provided
    if (phone && video.ticketPriceKes > 0) {
      const hasTicket = await db.contentTicket.findFirst({
        where: { videoId, viewerPhone: phone },
        select: { id: true },
      });

      if (!hasTicket) {
        // Return preview stream instead
        if (video.cfPreviewStreamId) {
          const url = isCfStreamSigningConfigured()
            ? signCfStreamUrl(video.cfPreviewStreamId) ?? `${CF_STREAM_BASE}/${video.cfPreviewStreamId}/manifest/video.m3u8`
            : `${CF_STREAM_BASE}/${video.cfPreviewStreamId}/manifest/video.m3u8`;
          return NextResponse.json({ url, signed: isCfStreamSigningConfigured(), premium: false });
        }
        return NextResponse.json({ error: 'Ticket required for premium content' }, { status: 403 });
      }
    }

    // Generate signed URL for premium stream
    const signedUrl = signCfStreamUrl(video.cfPremiumStreamId);
    const url = signedUrl ?? `${CF_STREAM_BASE}/${video.cfPremiumStreamId}/manifest/video.m3u8`;

    return NextResponse.json({ url, signed: isCfStreamSigningConfigured(), premium: true });
  } catch (err) {
    console.error('[content/signed-stream] GET error:', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
