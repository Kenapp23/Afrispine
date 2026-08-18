import { Metadata } from 'next';
import { db, dbReady } from '@/lib/db';

// ─── OG Metadata for shared creator profile links ───────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const { handle } = await params;

  let title = 'Creator on AfriSpine';
  let description = 'Premium African content — live premieres, VOD, and more on AfriSpine.';
  let imageUrl = 'https://www.afri-spine.com/og-default.png';

  try {
    if (dbReady) {
      const creator = await db.creatorProfile.findUnique({
        where: { handle },
        select: {
          stageName: true,
          bio: true,
          avatarUrl: true,
          followerCount: true,
          verified: true,
        },
      });
      if (creator) {
        const badge = creator.verified ? ' ✓' : '';
        title = `${creator.stageName}${badge} | AfriSpine`;
        description = creator.bio || `${creator.stageName} on AfriSpine · ${creator.followerCount.toLocaleString()} followers`;
        if (creator.avatarUrl) imageUrl = creator.avatarUrl;
      }
    }
  } catch {}

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://www.afri-spine.com/c/${handle}`,
      siteName: 'AfriSpine',
      type: 'profile',
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
export default async function CreatorSharePage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;

  return (
    <html lang="en">
      <head>
        <meta httpEquiv="refresh" content={`0;url=/#c/profile?handle=${handle}`} />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.location.replace('/#c/profile?handle=${handle}');`,
          }}
        />
      </head>
      <body className="bg-black flex items-center justify-center h-screen">
        <div className="text-center text-white/60">
          <div className="animate-spin h-8 w-8 border-2 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-sm">Opening creator profile...</p>
          <a href={`/#c/profile?handle=${handle}`} className="mt-2 inline-block text-emerald-500 text-xs underline">
            Click here if not redirected
          </a>
        </div>
      </body>
    </html>
  );
}
