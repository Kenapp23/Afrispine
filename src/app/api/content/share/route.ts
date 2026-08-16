/**
 * Content Share — Share a video
 *
 * POST: Creates a ShareEvent, generates/reuses a referralCode, increments shareCount.
 * Returns the referralCode and a shareable URL.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db, dbReady } from '@/lib/db';

function generateReferralCode(): string {
  return `REF_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function POST(req: NextRequest) {
  try {
    if (!dbReady) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 });
    }

    const body = await req.json();
    const { videoId, channel, userId } = body as {
      videoId?: string;
      channel?: string;
      userId?: string;
    };

    if (!videoId || typeof videoId !== 'string') {
      return NextResponse.json({ error: 'videoId is required' }, { status: 400 });
    }

    if (!channel || typeof channel !== 'string') {
      return NextResponse.json(
        { error: 'Channel is required (whatsapp, instagram, tiktok, x, copy_link)' },
        { status: 400 },
      );
    }

    const user = userId ?? null;

    // Check if there's already a share event for this video from this user
    // If so, reuse the referral code
    const existingShare = await db.shareEvent.findFirst({
      where: { videoId, userId: user ?? '' },
      select: { referralCode: true },
    });

    const referralCode = existingShare?.referralCode ?? generateReferralCode();

    // Create ShareEvent
    try {
      await db.shareEvent.create({
        data: {
          videoId,
          userId: user,
          channel,
          referralCode,
        },
      });
    } catch (err: unknown) {
      const prismaErr = err as { code?: string };
      // Don't fail if there's an issue — share tracking is best-effort
      console.error('[content/share] ShareEvent create error:', err);
    }

    // Increment video share count
    await db.video.update({
      where: { id: videoId },
      data: { shareCount: { increment: 1 } },
    }).catch(() => { /* ignore */ });

    const shareUrl = `https://www.afri-spine.com/w/${videoId}?ref=${referralCode}`;

    return NextResponse.json({ referralCode, shareUrl });
  } catch (err) {
    console.error('[content/share] POST error:', err);
    return NextResponse.json({ error: 'Failed to share video' }, { status: 500 });
  }
}
