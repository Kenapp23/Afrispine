/**
 * Creator Onboarding API
 *
 * POST: Save individual onboarding steps 1-10.
 * Looks up CreatorProfile by userId (passed as creatorId in body).
 */

import { NextRequest, NextResponse } from 'next/server';
import { db, dbReady } from '@/lib/db';

export async function POST(req: NextRequest) {
  if (!dbReady) {
    return NextResponse.json({ error: 'Database not available' }, { status: 503 });
  }

  try {
    const body = await req.json();
    const { step, data, creatorId } = body as {
      step?: number;
      data?: Record<string, unknown>;
      creatorId?: string;
    };

    if (!step || step < 1 || step > 10) {
      return NextResponse.json({ error: 'step must be 1-10' }, { status: 400 });
    }

    if (!creatorId) {
      return NextResponse.json({ error: 'creatorId is required' }, { status: 400 });
    }

    // Look up profile by userId
    const profile = await db.creatorProfile.findUnique({
      where: { userId: creatorId },
    });

    if (!profile) {
      return NextResponse.json({ error: 'Creator profile not found' }, { status: 404 });
    }

    // Build update data based on step
    const updateData: Record<string, unknown> = { onboardingStep: step };

    switch (step) {
      case 1: // category
        if (data?.category && typeof data.category === 'string') {
          updateData.category = data.category;
        }
        break;
      case 2: // avatarUrl
        if (data?.avatarUrl && typeof data.avatarUrl === 'string') {
          updateData.avatarUrl = data.avatarUrl;
        }
        break;
      case 3: // stageName
        if (data?.stageName && typeof data.stageName === 'string') {
          updateData.stageName = data.stageName;
        }
        break;
      case 4: // location, languages
        if (data?.location && typeof data.location === 'string') {
          updateData.location = data.location;
        }
        if (data?.languages && typeof data.languages === 'string') {
          updateData.languages = data.languages;
        }
        break;
      case 5: // bio
        if (data?.bio && typeof data.bio === 'string') {
          updateData.bio = data.bio;
        }
        break;
      case 6: // services — skip for v1
        break;
      case 7: // sampleContent — skip for v1
        break;
      case 8: // mpesaPayoutNumber
        if (data?.mpesaPayoutNumber && typeof data.mpesaPayoutNumber === 'string') {
          updateData.mpesaPayoutNumber = data.mpesaPayoutNumber;
        }
        break;
      case 9: // publish
        updateData.profilePublished = true;
        updateData.onboardingStep = 10;
        break;
      case 10: // share — no-op
        break;
    }

    const updated = await db.creatorProfile.update({
      where: { id: profile.id },
      data: updateData,
    });

    return NextResponse.json({ success: true, onboardingStep: updated.onboardingStep });
  } catch (err) {
    console.error('[creator/onboard] POST error:', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
