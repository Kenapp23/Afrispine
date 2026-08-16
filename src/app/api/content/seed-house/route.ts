import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    // Find or create AfriSpine Studios creator profile
    let creator = await db.creatorProfile.findFirst({ where: { handle: 'afrispine_studios' } });
    if (!creator) {
      creator = await db.creatorProfile.create({
        data: {
          stageName: 'AfriSpine Studios',
          handle: 'afrispine_studios',
          bio: 'Official demo content from AfriSpine',
          verified: true,
          followerCount: 120000,
        },
      });
    }

    const houseVideos = [
      {
        title: 'Nairobi Nights — A Short Film',
        description: 'A cinematic journey through the vibrant streets of Nairobi after dark.',
        category: 'film',
        ticketPriceKes: 150,
        thumbnailUrl: '/demo-poster-nairobi.png',
        demoVideoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        durationSeconds: 15,
        viewCount: 4200, likeCount: 1800, shareCount: 320,
      },
      {
        title: 'Sounds of the Savanna',
        description: 'An immersive audio-visual experience blending traditional Kenyan music with modern beats.',
        category: 'music',
        ticketPriceKes: 100,
        thumbnailUrl: '/demo-poster-savanna.png',
        demoVideoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
        durationSeconds: 15,
        viewCount: 8900, likeCount: 4300, shareCount: 890,
      },
      {
        title: 'Ankara Dreams — Fashion Forward',
        description: 'A celebration of Kenyan fashion design and the artisans behind it.',
        category: 'fashion',
        ticketPriceKes: 0,
        thumbnailUrl: '/demo-poster-fashion.png',
        demoVideoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
        durationSeconds: 60,
        viewCount: 15000, likeCount: 7200, shareCount: 1200,
      },
    ];

    const results = [];
    for (const v of houseVideos) {
      const existing = await db.video.findFirst({ where: { title: v.title, creatorId: creator.id } });
      if (existing) {
        results.push({ ...v, id: existing.id, status: 'already_exists' });
        continue;
      }
      const video = await db.video.create({
        data: {
          ...v,
          creatorId: creator.id,
          status: 'live',
          isHouseContent: true,
          trailerSource: 'ai',
        },
      });
      results.push({ ...v, id: video.id, status: 'created' });
    }

    return NextResponse.json({ success: true, seeded: results });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
