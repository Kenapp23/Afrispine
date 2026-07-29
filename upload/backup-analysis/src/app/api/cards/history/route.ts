import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSenderFromRequest } from '@/lib/auth';

// ─── GET /api/cards/history ────────────────────────────────────
// Lists the authenticated sender's past achievement cards.

export async function GET(req: NextRequest) {
  try {
    const sender = getSenderFromRequest(req);
    if (!sender) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 },
      );
    }

    const limit = Math.min(Math.max(Number(req.nextUrl.searchParams.get('limit')) || 20, 1), 100);
    const cursor = req.nextUrl.searchParams.get('cursor') || undefined;

    const cards = await db.achievementCard.findMany({
      where: { senderId: sender.id },
      orderBy: { createdAt: 'desc' },
      take: limit,
      ...(cursor
        ? {
            cursor: { id: cursor },
            skip: 1, // skip the cursor itself
          }
        : {}),
    });

    // Parse the JSON cardData for each card
    const parsed = cards.map((card) => {
      let data: Record<string, string> = {};
      try {
        data = JSON.parse(card.cardData);
      } catch {
        // keep empty
      }
      return {
        id: card.id,
        cardType: card.cardType,
        cardData: data,
        imageUrl: card.imageUrl,
        sharedCount: card.sharedCount,
        createdAt: card.createdAt.toISOString(),
      };
    });

    // Determine next cursor
    const nextCursor = parsed.length === limit ? parsed[parsed.length - 1].id : null;

    return NextResponse.json({
      cards: parsed,
      nextCursor,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status = message === 'Authentication required' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}