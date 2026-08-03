import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ensureDb } from '@/lib/ensure-db';
import { requireAdmin } from '@/lib/auth';

// Very light rate/shape guard — this endpoint is public (pre-auth interest capture),
// so keep validation strict and never trust client-supplied amounts as financial commitments.
function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** POST — Register diaspora interest in the Dangote Refinery IPO (waitlist, not a live order) */
export async function POST(req: NextRequest) {
  try {
    await ensureDb();

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { email, fullName, country, phone, interestAmountUsd } = body as {
      email?: string;
      fullName?: string;
      country?: string;
      phone?: string;
      interestAmountUsd?: string | number;
    };

    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: 'A valid email address is required.' }, { status: 400 });
    }

    const parsedAmount =
      interestAmountUsd === undefined || interestAmountUsd === null || interestAmountUsd === ''
        ? null
        : Number(interestAmountUsd);

    if (parsedAmount !== null && (!Number.isFinite(parsedAmount) || parsedAmount < 0)) {
      return NextResponse.json({ error: 'Interest amount must be a positive number.' }, { status: 400 });
    }

    const registration = await db.ipoRegistration.create({
      data: {
        email: email.trim().toLowerCase(),
        fullName: fullName?.trim() || null,
        country: country?.trim() || null,
        phone: phone?.trim() || null,
        interestAmountUsd: parsedAmount,
        ipoSlug: 'dangote-refinery',
        status: 'waitlisted',
      },
    });

    // Fire WhatsApp confirmation (fire-and-forget)
    try {
      const { sendWhatsAppAsync } = await import('@/lib/whatsapp');
      if (phone?.trim() && fullName?.trim()) {
        sendWhatsAppAsync(phone.trim(), 'ipo_confirmation', {
          name: fullName.trim(),
          ipoName: 'Dangote Refinery',
        });
      }
    } catch (waErr) {
      console.warn('[dangote-ipo/register] WhatsApp failed:', waErr);
    }

    return NextResponse.json({
      success: true,
      id: registration.id,
      message: "You're on the list. We'll notify you when the Dangote Refinery IPO opens for subscription.",
    });
  } catch (error: any) {
    console.error('[dangote-ipo/register] Error:', error);
    return NextResponse.json({ error: 'Registration failed. Please try again.' }, { status: 500 });
  }
}

/** GET — Admin-facing list of registered interest (used by the admin dashboard, not the public site) */
export async function GET(req: NextRequest) {
  try {
    const { error, res } = await requireAdmin(req);
    if (error) return res;

    await ensureDb();

    const { searchParams } = new URL(req.url);
    const limit = Math.min(Number(searchParams.get('limit')) || 100, 500);

    const registrations = await db.ipoRegistration.findMany({
      where: { ipoSlug: 'dangote-refinery' },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    const totalInterestUsd = registrations.reduce(
      (sum, r) => sum + (r.interestAmountUsd ?? 0),
      0
    );

    return NextResponse.json({
      success: true,
      count: registrations.length,
      totalInterestUsd,
      registrations,
    });
  } catch (error: any) {
    console.error('[dangote-ipo/register] GET error:', error);
    return NextResponse.json({ error: 'Failed to load registrations' }, { status: 500 });
  }
}
