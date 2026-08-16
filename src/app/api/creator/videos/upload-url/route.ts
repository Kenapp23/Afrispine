import { NextRequest, NextResponse } from 'next/server';

// Cloudflare Stream credentials (set in .env)
const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID || '';
const CF_API_TOKEN = process.env.CF_API_TOKEN || '';

/**
 * POST /api/creator/videos/upload-url
 *
 * Returns a Cloudflare Stream direct-upload URL so the client can
 * upload the video directly to Cloudflare (TUS protocol), avoiding
 * large file round-trips through our server.
 *
 * Body: { creatorId: string, title: string, category: string, description?: string, ticketPriceKes?: number, trailerUrl?: string }
 */
export async function POST(req: NextRequest) {
  try {
    if (!CF_ACCOUNT_ID || !CF_API_TOKEN) {
      return NextResponse.json(
        { error: 'Cloudflare Stream is not configured. Set CF_ACCOUNT_ID and CF_API_TOKEN.' },
        { status: 503 },
      );
    }

    const body = await req.json();
    const { title, category, creatorId, description, ticketPriceKes, trailerUrl } = body;

    if (!title || !category || !creatorId) {
      return NextResponse.json(
        { error: 'title, category, and creatorId are required.' },
        { status: 400 },
      );
    }

    // 1. Request a direct-upload URL from Cloudflare Stream
    const cfRes = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/stream/direct_upload`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CF_API_TOKEN}`,
          'Tus-Resumable': '1.0.0',
          'Upload-Length': '0',
          'Upload-Metadata': `filename ${encodeURIComponent(title.replace(/[^a-zA-Z0-9._-]/g, '_'))}.mp4`,
        },
      },
    );

    if (!cfRes.ok) {
      const errText = await cfRes.text();
      console.error('[upload-url] Cloudflare error:', errText);
      return NextResponse.json(
        { error: 'Failed to get upload URL from Cloudflare.' },
        { status: 502 },
      );
    }

    const cfData = await cfRes.json();
    const uploadUrl = cfData.result?.uploadURL || cfData.uploadURL;
    const uid = cfData.result?.uid || cfData.uid;

    if (!uploadUrl || !uid) {
      console.error('[upload-url] Unexpected Cloudflare response:', JSON.stringify(cfData));
      return NextResponse.json(
        { error: 'Unexpected response from Cloudflare Stream.' },
        { status: 502 },
      );
    }

    // 2. Return the upload URL + metadata to the client
    // Client will: upload to uploadUrl, then we handle the webhook
    return NextResponse.json({
      uploadUrl,
      uid,
      // Pass these back so the webhook can create the Video row
      meta: { title, category, creatorId, description, ticketPriceKes: ticketPriceKes ?? 0, trailerUrl: trailerUrl || null },
    });
  } catch (error: any) {
    console.error('[upload-url] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 },
    );
  }
}
