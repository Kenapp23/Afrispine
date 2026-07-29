import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireSenderAuth } from '@/lib/auth';
import { generateReferralCode } from '@/lib/whatsapp';

// GET: Get or create referral code for logged-in sender
export async function GET(req: NextRequest) {
  try {
    const payload = await requireSenderAuth(req);
    
    const sender = await db.sender.findUnique({ where: { id: payload.id } });
    if (!sender) return NextResponse.json({ error: 'Sender not found' }, { status: 404 });
    
    // Check for existing referral code
    let referral = await db.referral.findFirst({
      where: { referrerId: payload.id, status: { in: ['pending', 'converted', 'rewarded'] } },
    });
    
    if (!referral) {
      const code = generateReferralCode(sender.firstName || 'AFRI', sender.id);
      referral = await db.referral.create({
        data: { referrerId: payload.id, code, refereeEmail: '', status: 'pending' },
      });
    }
    
    return NextResponse.json({
      code: referral.code,
      status: referral.status,
      totalReferrals: await db.referral.count({ where: { referrerId: payload.id, status: 'converted' } }),
    });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST: Record a referral conversion (called when referee signs up)
export async function POST(req: NextRequest) {
  try {
    const { referralCode, refereeEmail } = await req.json();
    if (!referralCode || !refereeEmail) {
      return NextResponse.json({ error: 'Missing referral code or email' }, { status: 400 });
    }
    
    const referral = await db.referral.findUnique({ where: { code: referralCode } });
    if (!referral) return NextResponse.json({ error: 'Invalid referral code' }, { status: 404 });
    if (referral.status !== 'pending') return NextResponse.json({ error: 'Referral code already used' }, { status: 400 });
    
    const updated = await db.referral.update({
      where: { id: referral.id },
      data: { refereeEmail, status: 'converted', convertedAt: new Date() },
    });
    
    return NextResponse.json({ success: true, referral: updated });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}