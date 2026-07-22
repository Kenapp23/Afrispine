import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { fetchImageForStory } from '@/lib/services/openverse';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { storyId, countryFocus, relatedTicker, exchangeFocus, title, dryRun } = body;

    let country = countryFocus;
    let ticker = relatedTicker;
    let exchange = exchangeFocus;
    let storyTitle = title;

    if (storyId) {
      const story = await db.digestStory.findUnique({ where: { id: storyId } });
      if (story) {
        country = country || story.country || undefined;
        ticker = ticker || story.ticker || undefined;
        exchange = exchange || story.exchange || undefined;
        storyTitle = storyTitle || story.title || undefined;
      }
    }

    const image = await fetchImageForStory(country, ticker, exchange, storyTitle);

    if (!image) {
      return NextResponse.json({ found: false, message: 'No suitable image found' });
    }

    if (!dryRun && storyId) {
      await db.digestStory.update({
        where: { id: storyId },
        data: { imageUrl: image.url, imageCredit: image.creator, imageSource: 'openverse' },
      });
    }

    return NextResponse.json({
      found: true,
      dryRun: !!dryRun,
      image: { url: image.url, title: image.title, creator: image.creator },
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
