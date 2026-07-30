import { NextResponse } from 'next/server';

export async function POST() {
  const res = NextResponse.json({ success: true });
  res.cookies.set('afrispine_admin_session', '', { httpOnly: true, sameSite: 'lax', maxAge: 0, path: '/' });
  return res;
}
