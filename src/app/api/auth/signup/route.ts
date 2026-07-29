import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword, signSenderToken } from '@/lib/auth';
import { triggerDripSequence } from '@/lib/drip-engine';

export async function POST(req: NextRequest) {
  try {
    const { email, password, fullName, phone } = await req.json();
    if (!email || !password || !fullName) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    if (phone && !/^\+?\d{7,15}$/.test(phone.replace(/\s/g, ''))) {
      return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 });
    }
    const existing = await db.sender.findUnique({ where: { email } });
    if (existing) return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    const passwordHash = await hashPassword(password);
    const names = fullName.split(' ');
    const sender = await db.sender.create({
      data: {
        email, passwordHash,
        firstName: names[0] || '',
        lastName: names.slice(1).join(' ') || '',
        phone: phone ? phone.replace(/\s/g, '') : '',
        emailVerified: true,
      }
    });
    // Auto-login: issue token and set cookie so user is logged in immediately
    const token = signSenderToken({ id: sender.id, email: sender.email, role: 'sender' });
    const { passwordHash: _, ...safe } = sender;

    // Trigger onboarding drip sequence (fire-and-forget)
    triggerDripSequence(sender.id, 'onboarding', { firstName: names[0] || '' }).catch(() => {});

    const res = NextResponse.json({ success: true, sender: safe, token });
    res.cookies.set('afrispine_session', token, {
      httpOnly: true, sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60, path: '/',
    });
    return res;
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
