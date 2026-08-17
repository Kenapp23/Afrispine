import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateVideoEmbedding } from '@/lib/embedding';
import { ensureFtsTable, rebuildFtsIndex } from '@/lib/fts-setup';

/**
 * POST /api/content/seed-house
 *
 * Creates (or skips) AfriSpine Studios house-content videos.
 * Uses local MP4 URLs and auto-generates LLM topic-fingerprint embeddings.
 * Idempotent — re-running is safe (existing videos are skipped).
 */
export async function POST(req: NextRequest) {
  try {
    // Find or create AfriSpine Studios creator profile
    let creator = await db.creatorProfile.findFirst({ where: { handle: 'afrispine_studios' } });
    if (!creator) {
      creator = await db.creatorProfile.create({
        data: {
          userId: 'house-content-system', // no real user — system-owned
          stageName: 'AfriSpine Studios',
          handle: 'afrispine_studios',
          bio: 'Official demo content from AfriSpine — showcasing the creator experience.',
          mpesaPayoutNumber: '254700000000',
          verified: true,
          followerCount: 120_000,
        },
      });
    }

    const houseVideos = [
      {
        title: 'Nairobi Nights — A Short Film',
        description: 'A cinematic journey through the vibrant streets of Nairobi after dark. Neon lights, matatu culture, and the pulse of Kenya\'s capital come alive in this visually stunning short film.',
        category: 'film',
        ticketPriceKes: 150,
        thumbnailUrl: '/demo-poster-nairobi.png',
        demoVideoUrl: '/demo-video-nairobi.mp4',
        durationSeconds: 10,
        viewCount: 4200, likeCount: 1800, shareCount: 320,
      },
      {
        title: 'Sounds of the Savanna',
        description: 'An immersive audio-visual experience blending traditional Kenyan music with modern beats. From the Maasai plains to Nairobi studios, this piece celebrates the evolution of East African sound.',
        category: 'music',
        ticketPriceKes: 100,
        thumbnailUrl: '/demo-poster-savanna.png',
        demoVideoUrl: '/demo-video-savanna.mp4',
        durationSeconds: 52,
        viewCount: 8900, likeCount: 4300, shareCount: 890,
      },
      {
        title: 'Ankara Dreams — Fashion Forward',
        description: 'A celebration of Kenyan fashion design and the artisans behind it. From Kitenge patterns to modern runway silhouettes, explore how African textiles are reshaping global fashion.',
        category: 'fashion',
        ticketPriceKes: 0,
        thumbnailUrl: '/demo-poster-fashion.png',
        demoVideoUrl: '/demo-video-fashion.mp4',
        durationSeconds: 10,
        viewCount: 15000, likeCount: 7200, shareCount: 1200,
      },
    ];

    const results = [];
    for (const v of houseVideos) {
      const existing = await db.video.findFirst({ where: { title: v.title, creatorId: creator.id } });
      if (existing) {
        // Update broken Google URLs to local paths if needed
        if (existing.demoVideoUrl?.includes('googleapis.com')) {
          await db.video.update({
            where: { id: existing.id },
            data: { demoVideoUrl: v.demoVideoUrl },
          });
          results.push({ ...v, id: existing.id, status: 'updated_url' });
        } else {
          results.push({ ...v, id: existing.id, status: 'already_exists' });
        }
        continue;
      }

      // Generate LLM topic-fingerprint embedding
      let embeddingVector: string | undefined;
      try {
        embeddingVector = await generateVideoEmbedding(v.title, v.description ?? '', v.category);
      } catch (e) {
        console.warn(`[seed-house] Embedding generation failed for "${v.title}":`, e);
      }

      const video = await db.video.create({
        data: {
          ...v,
          creatorId: creator.id,
          status: 'live',
          isHouseContent: true,
          trailerSource: 'ai',
          embeddingVector,
        },
      });
      results.push({ ...v, id: video.id, status: 'created', hasEmbedding: !!embeddingVector });
    }

    // Rebuild FTS index to include new videos
    await ensureFtsTable();
    await rebuildFtsIndex();

    return NextResponse.json({ success: true, creator: { id: creator.id, handle: creator.handle }, seeded: results, ftsRebuilt: true });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
