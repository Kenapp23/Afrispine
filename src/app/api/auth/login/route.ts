import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyPassword, signSenderToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const sender = await db.sender.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (!sender) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const valid = await verifyPassword(password, sender.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    if (sender.accountStatus !== 'active') {
      return NextResponse.json({ error: 'Account is not active' }, { status: 403 });
    }

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
    console.error('[senderLogin]', e);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}