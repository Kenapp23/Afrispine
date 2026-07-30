import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory rate limiter for Next.js Edge runtime
const rateLimits = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(
  key: string,
  windowMs: number,
  maxRequests: number
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = rateLimits.get(key);

  if (!entry || now > entry.resetAt) {
    const resetAt = now + windowMs;
    rateLimits.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: maxRequests - 1, resetAt };
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return { allowed: true, remaining: maxRequests - entry.count, resetAt: entry.resetAt };
}

// Clean up expired entries every 5 minutes
if (typeof globalThis !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimits.entries()) {
      if (now > entry.resetAt) rateLimits.delete(key);
    }
  }, 5 * 60 * 1000);
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

  // Rate limit: auth endpoints — 20 requests per 15 minutes
  if (pathname.startsWith('/api/auth/')) {
    // Admin login: stricter — 5 per 15 minutes
    const isAdminLogin = pathname.includes('/admin/login');
    const limit = isAdminLogin ? 5 : 20;
    const result = checkRateLimit(`auth:${ip}`, 15 * 60 * 1000, limit);
    if (!result.allowed) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((result.resetAt - Date.now()) / 1000)) } }
      );
    }
  }

  // Rate limit: payment initialization — 3 requests per minute per sender
  if (pathname.startsWith('/api/payments/initialize') || pathname.startsWith('/api/wealth/order/pay')) {
    const senderId = request.headers.get('x-sender-id') || ip;
    const result = checkRateLimit(`pay:${senderId}`, 60 * 1000, 5);
    if (!result.allowed) {
      return NextResponse.json(
        { error: 'Too many payment attempts. Please wait.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((result.resetAt - Date.now()) / 1000)) } }
      );
    }
  }

  // Rate limit: all other API routes — 300 requests per minute
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth/') && !pathname.startsWith('/api/payments/')) {
    const result = checkRateLimit(`api:${ip}`, 60 * 1000, 300);
    if (!result.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please slow down.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((result.resetAt - Date.now()) / 1000)) } }
      );
    }
  }

  // Security headers
  const response = NextResponse.next();
  // Allow framing from Z.ai preview and same-origin
  response.headers.set('X-Frame-Options', 'ALLOW-FROM https://z.ai https://space-z.ai');
  response.headers.append('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('Content-Security-Policy', "frame-ancestors 'self' https://z.ai https://*.space-z.ai");
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  return response;
}

export const config = {
  matcher: ['/api/:path*'],
};