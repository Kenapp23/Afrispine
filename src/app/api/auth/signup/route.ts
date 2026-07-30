import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword, signSenderToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { fullName, email, phone, password } = await req.json();

    if (!fullName || !email || !password) {
      return NextResponse.json({ error: 'Full name, email, and password are required' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existing = await db.sender.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
    }

    const parts = fullName.trim().split(/\s+/);
    const firstName = parts[0] || '';
    const lastName = parts.slice(1).join(' ') || '';

    const passwordHash = await hashPassword(password);

    const sender = await db.sender.create({
      data: {
        email: normalizedEmail,
        firstName,
        lastName,
        phone: phone?.trim() || null,
        passwordHash,
        kycStatus: 'pending',
        accountStatus: 'active',
      },
    });

    const token = signSenderToken({ id: sender.id, email: sender.email, role: 'sender' });
    const { passwordHash: _, ...safe } = sender;

    const res = NextResponse.json({ success: true, sender: safe, token });
    res.cookies.set('afrispine_session', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });
    return res;
  } catch (e: any) {
    console.error('[senderSignup]', e);
    return NextResponse.json({ error: 'Signup failed' }, { status: 500 });
  }
}
