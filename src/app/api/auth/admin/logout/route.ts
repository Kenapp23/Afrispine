import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const res = NextResponse.json({ success: true });
  res.cookies.set('afrispine_admin_session', '', { maxAge: 0, path: '/' });
  return res;
}