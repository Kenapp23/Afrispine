import { NextRequest, NextResponse } from 'next/server';

// GET: Meta WhatsApp webhook verification
export async function GET(req: NextRequest) {
  const mode = req.nextUrl.searchParams.get('hub.mode');
  const token = req.nextUrl.searchParams.get('hub.verify_token');
  const challenge = req.nextUrl.searchParams.get('hub.challenge');
  
  if (mode === 'subscribe' && token === (process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'afri_spine_whatsapp_verify_2024')) {
    return new NextResponse(challenge, { status: 200 });
  }
  return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
}

// POST: Receive WhatsApp messages (future use for Chama bot etc.)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // Log incoming messages for future Chama bot / customer support
    console.log('[WhatsApp Webhook] Received:', JSON.stringify(body).slice(0, 500));
    
    // TODO: Implement Chama bot responses, customer support routing
    
    return NextResponse.json({ status: 'received' });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}