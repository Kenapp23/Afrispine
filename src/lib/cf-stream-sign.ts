/**
 * Cloudflare Stream Signed URL Generator
 *
 * Generates time-limited signed URLs for premium Cloudflare Stream content.
 * Requires CF_STREAM_SIGNING_KEY env var (hex-encoded 16-byte key).
 *
 * Usage:
 *   const url = signCfStreamUrl('abc123def', 3600); // expires in 1 hour
 */

import { createHmac } from 'crypto';

// Token lifetime in seconds (default 2 hours)
const DEFAULT_EXPIRY_SECONDS = 2 * 60 * 60;

// Cloudflare Stream base URL for manifest
const CF_STREAM_BASE = 'https://customer-c4f5c4f4.cloudflarestream.com';

/**
 * Generate a signed Cloudflare Stream manifest URL.
 *
 * @param streamId - Cloudflare Stream video ID
 * @param expirySeconds - How long the URL is valid (default 2 hours)
 * @returns Signed URL string, or null if signing key is not configured
 */
export function signCfStreamUrl(
  streamId: string,
  expirySeconds: number = DEFAULT_EXPIRY_SECONDS,
): string | null {
  const signingKey = process.env.CF_STREAM_SIGNING_KEY;
  if (!signingKey) {
    // If no signing key configured, return unsigned URL (dev mode)
    console.warn('[cf-stream-sign] CF_STREAM_SIGNING_KEY not set, returning unsigned URL');
    return null;
  }

  const keyBuffer = Buffer.from(signingKey, 'hex');
  const expiry = Math.floor(Date.now() / 1000) + expirySeconds;

  // Path to sign (the manifest path without query params)
  const path = `/${streamId}/manifest/video.m3u8`;

  // Cloudflare Stream token format:
  // token = hex( HMAC-SHA256(key, path + expiry_hex) ) + expiry_hex
  const expiryHex = expiry.toString(16);
  const hmacPayload = `${path}${expiryHex}`;

  const hmac = createHmac('sha256', keyBuffer);
  hmac.update(hmacPayload);
  const tokenDigest = hmac.digest('hex');

  const token = `${tokenDigest}${expiryHex}`;

  return `${CF_STREAM_BASE}${path}?token=${token}`;
}

/**
 * Check if Cloudflare Stream signing is configured.
 */
export function isCfStreamSigningConfigured(): boolean {
  return !!process.env.CF_STREAM_SIGNING_KEY;
}
