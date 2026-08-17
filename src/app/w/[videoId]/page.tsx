import { Metadata } from 'next';
import { db, dbReady } from '@/lib/db';

// ─── OG Metadata for shared video links ─────────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ videoId: string }>;
}): Promise<Metadata> {
  const { videoId } = await params;

  let title = 'Watch on AfriSpine';
  let description = 'Premium African content — unlocked with M-Pesa.';
  let imageUrl = 'https://www.afri-spine.com/og-default.png';

  try {
    if (dbReady) {
      const video = await db.video.findUnique({
        where: { id: videoId },
        select: {
          title: true,
          description: true,
          ticketPriceKes: true,
          thumbnailUrl: true,
          releaseMode: true,
          premiereAt: true,
          premiereWindowEnds: true,
          creator: { select: { stageName: true, handle: true } },
        },
      });
      if (video) {
        const isPremiere = video.releaseMode === 'premiere' && video.premiereWindowEnds && new Date(video.premiereWindowEnds) > new Date();
        const modeLabel = isPremiere ? ' · Premiere' : '';
        title = `${video.title}${modeLabel} — ${video.creator.stageName} | AfriSpine`;
        description = video.description || `${video.creator.stageName} on AfriSpine${video.ticketPriceKes > 0 ? ` · KES ${video.ticketPriceKes}` : ' · Free'}`;
        if (video.thumbnailUrl) imageUrl = video.thumbnailUrl;
      }
    }
  } catch {}

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://www.afri-spine.com/w/${videoId}`,
      siteName: 'AfriSpine',
      type: 'video.other',
      images: [{ url: imageUrl, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  };
}

// ─── Page: Redirect to SPA watch view ────────────────────────────
export default async function VideoSharePage({
  params,
}: {
  params: Promise<{ videoId: string }>;
}) {
  const { videoId } = await params;
  const urlParams = new URLSearchParams({ v: videoId });

  return (
    <html lang="en">
      <head>
        <meta httpEquiv="refresh" content={`0;url=/?v=${videoId}`} />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.location.replace('/?v=${videoId}');`,
          }}
        />
      </head>
      <body className="bg-black flex items-center justify-center h-screen">
        <div className="text-center text-white/60">
          <div className="animate-spin h-8 w-8 border-2 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4" />\n          <p className="text-sm">Opening video...</p>
          <a href={`/?v=${videoId}`} className="mt-2 inline-block text-emerald-500 text-xs underline">
            Click here if not redirected
          </a>
        </div>
      </body>
    </html>
  );
}
