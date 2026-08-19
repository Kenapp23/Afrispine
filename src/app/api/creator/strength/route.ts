/**
 * Creator Strength API
 *
 * GET /api/creator/strength?creatorId=xxx
 *
 * Returns the creator's profile completeness score (0-100),
 * individual check results, video count, and suggested actions.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db, dbReady } from '@/lib/db';

interface SuggestedAction {
  key: string;
  label: string;
  description: string;
  action: string;
}

export async function GET(req: NextRequest) {
  if (!dbReady) {
    return NextResponse.json({ error: 'Database not available' }, { status: 503 });
  }

  const { searchParams } = new URL(req.url);
  const creatorId = searchParams.get('creatorId');

  if (!creatorId) {
    return NextResponse.json({ error: 'creatorId is required' }, { status: 400 });
  }

  try {
    const creator = await db.creatorProfile.findUnique({
      where: { id: creatorId },
      select: {
        id: true,
        bio: true,
        avatarUrl: true,
        category: true,
        location: true,
        mpesaPayoutNumber: true,
        profilePublished: true,
      },
    });

    if (!creator) {
      return NextResponse.json({ error: 'creator_not_found' }, { status: 404 });
    }

    const videoCount = await db.video.count({
      where: { creatorId, status: 'live' },
    });

    // Compute checks
    const checks = {
      hasBio: !!creator.bio && creator.bio.trim().length > 0,
      hasAvatar: !!creator.avatarUrl && creator.avatarUrl.trim().length > 0,
      hasVideo: videoCount > 0,
      hasCategory: !!creator.category && creator.category.trim().length > 0,
      hasLocation: !!creator.location && creator.location.trim().length > 0,
      hasPayoutNumber: !!creator.mpesaPayoutNumber && creator.mpesaPayoutNumber.trim().length > 0,
      isPublished: !!creator.profilePublished,
    };

    // Weighted score
    const score =
      (checks.hasBio ? 20 : 0) +
      (checks.hasAvatar ? 15 : 0) +
      (checks.hasVideo ? 25 : 0) +
      (checks.hasCategory ? 10 : 0) +
      (checks.hasLocation ? 10 : 0) +
      (checks.hasPayoutNumber ? 10 : 0) +
      (checks.isPublished ? 10 : 0);

    // Build suggested actions
    const actions: SuggestedAction[] = [];

    if (!checks.hasBio) {
      actions.push({
        key: 'bio',
        label: 'Add a bio to your profile',
        description: 'Creators with bios get 2x more follows',
        action: 'creator-profile',
      });
    }
    if (!checks.hasAvatar) {
      actions.push({
        key: 'avatar',
        label: 'Upload a profile photo',
        description: "It's the first thing fans see",
        action: 'creator-profile',
      });
    }
    if (!checks.hasVideo) {
      actions.push({
        key: 'video',
        label: 'Upload your first video',
        description: 'Start earning from your content',
        action: 'watch',
      });
    }
    if (!checks.hasCategory) {
      actions.push({
        key: 'category',
        label: 'Set your content category',
        description: 'So fans can find you',
        action: 'creator-profile',
      });
    }
    if (!checks.isPublished) {
      actions.push({
        key: 'publish',
        label: 'Publish your profile',
        description: 'Go live so fans can discover you',
        action: 'creator-profile',
      });
    }
    if (score < 80 && actions.length < 3) {
      // Only add generic if we have room and score is low
      const alreadyHasGeneric = actions.some((a) => a.key === 'incomplete');
      if (!alreadyHasGeneric) {
        actions.push({
          key: 'incomplete',
          label: 'Complete your profile',
          description: 'To attract more fans',
          action: 'creator-profile',
        });
      }
    }

    // Limit to max 3 actions
    const suggestedActions = actions.slice(0, 3);

    return NextResponse.json({
      creatorId: creator.id,
      score,
      checks,
      videoCount,
      suggestedActions,
    });
  } catch (err) {
    console.error('[creator/strength] GET error:', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
