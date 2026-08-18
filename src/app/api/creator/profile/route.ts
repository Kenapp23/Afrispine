/**
 * Creator Profile API
 *
 * GET ?handle=xxx  — public, published profiles only. Returns profile + video count + live videos.
 * GET ?id=xxx     — fetch own profile (including unpublished) by profile id.
 * PUT            — authenticated creator update (partial fields).
 */

import { NextRequest, NextResponse } from 'next/server';
import { db, dbReady } from '@/lib/db';

export async function GET(req: NextRequest) {
  if (!dbReady) {
    return NextResponse.json({ error: 'Database not available' }, { status: 503 });
  }

  const { searchParams } = new URL(req.url);
  const handle = searchParams.get('handle');
  const id = searchParams.get('id');

  if (!handle && !id) {
    return NextResponse.json({ error: 'handle or id required' }, { status: 400 });
  }

  try {
    const where: Record<string, string> = id ? { id } : { handle: handle! };

    const creator = await db.creatorProfile.findUnique({
      where,
      select: {
        id: true,
        userId: true,
        stageName: true,
        handle: true,
        bio: true,
        avatarUrl: true,
        mpesaPayoutNumber: true,
        verified: true,
        followerCount: true,
        balanceKes: true,
        category: true,
        location: true,
        languages: true,
        coverImageUrl: true,
        availabilityStatus: true,
        whatsappNumber: true,
        socialLinks: true,
        brandPricingVisible: true,
        bookingInquiryEmail: true,
        profilePublished: true,
        onboardingStep: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { videos: true } },
        videos: {
          where: { status: 'live' },
          select: {
            id: true,
            title: true,
            thumbnailUrl: true,
            ticketPriceKes: true,
            viewCount: true,
            category: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!creator) {
      return NextResponse.json({ error: 'creator_not_found' }, { status: 404 });
    }

    // When querying by handle, only return published profiles
    if (handle && !creator.profilePublished) {
      return NextResponse.json({ error: 'creator_not_found' }, { status: 404 });
    }

    // Transform _count to videoCount
    const { _count, videos, ...profileFields } = creator;

    return NextResponse.json({
      ...profileFields,
      videoCount: _count.videos,
      liveVideos: videos,
    });
  } catch (err) {
    console.error('[creator/profile] GET error:', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  if (!dbReady) {
    return NextResponse.json({ error: 'Database not available' }, { status: 503 });
  }

  try {
    const body = await req.json();
    const {
      id,
      stageName,
      bio,
      category,
      location,
      languages,
      coverImageUrl,
      availabilityStatus,
      whatsappNumber,
      socialLinks,
      brandPricingVisible,
      bookingInquiryEmail,
    } = body as {
      id?: string;
      stageName?: string;
      bio?: string;
      category?: string;
      location?: string;
      languages?: string;
      coverImageUrl?: string;
      availabilityStatus?: string;
      whatsappNumber?: string;
      socialLinks?: string;
      brandPricingVisible?: boolean;
      bookingInquiryEmail?: string;
    };

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    // Build update data — only include provided fields
    const updateData: Record<string, unknown> = {};
    if (stageName !== undefined) updateData.stageName = stageName;
    if (bio !== undefined) updateData.bio = bio;
    if (category !== undefined) updateData.category = category;
    if (location !== undefined) updateData.location = location;
    if (languages !== undefined) updateData.languages = languages;
    if (coverImageUrl !== undefined) updateData.coverImageUrl = coverImageUrl;
    if (availabilityStatus !== undefined) updateData.availabilityStatus = availabilityStatus;
    if (whatsappNumber !== undefined) updateData.whatsappNumber = whatsappNumber;
    if (socialLinks !== undefined) updateData.socialLinks = socialLinks;
    if (brandPricingVisible !== undefined) updateData.brandPricingVisible = brandPricingVisible;
    if (bookingInquiryEmail !== undefined) updateData.bookingInquiryEmail = bookingInquiryEmail;

    // updatedAt is handled by Prisma @updatedAt

    const updated = await db.creatorProfile.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error('[creator/profile] PUT error:', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
