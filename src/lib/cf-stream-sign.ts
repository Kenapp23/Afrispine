/**
 * Cloudflare Stream Signed URL Generator
 *
 * Generates time-limited signed URLs for Cloudflare Stream content using
 * the official JWT-based signing mechanism (RS256).
 *
 * Three modes:
 * 1. Signing key mode (recommended): Uses a PEM private key + key ID from env.
 *    Set CF_STREAM_SIGNING_KEY_ID and CF_STREAM_SIGNING_KEY (PEM) in env.
 * 2. API token mode (fallback): Calls Cloudflare /token endpoint per request.
 *    Set CF_API_TOKEN and CF_ACCOUNT_ID in env.
 * 3. Dev mode: Returns unsigned URLs if no credentials configured.
 *
 * Usage:
 *   const url = await signCfStreamUrl('abc123def', 3600);
 */

import { SignJWT } from 'jose';

const CF_STREAM_BASE = 'https://customer-c4f5c4f4.cloudflarestream.com';

// Token lifetime in seconds (default 2 hours)
const DEFAULT_EXPIRY_SECONDS = 2 * 60 * 60;

/**
 * Check if Cloudflare Stream signing is configured (key mode).
 */
export function isCfStreamSigningConfigured(): boolean {
  return !!(process.env.CF_STREAM_SIGNING_KEY_ID && process.env.CF_STREAM_SIGNING_KEY);
}

/**
 * Check if API token mode is available (fallback).
 */
function isCfApiTokenConfigured(): boolean {
  return !!(process.env.CF_API_TOKEN && process.env.CF_ACCOUNT_ID);
}

/**
 * Generate a signed Cloudflare Stream manifest URL using the signing key (RS256 JWT).
 *
 * @param streamId - Cloudflare Stream video ID
 * @param expirySeconds - How long the URL is valid (default 2 hours)
 * @returns Signed URL string, or null if signing key is not configured
 */
async function signWithKey(streamId: string, expirySeconds: number): Promise<string | null> {
  const keyId = process.env.CF_STREAM_SIGNING_KEY_ID;
  const keyPem = process.env.CF_STREAM_SIGNING_KEY;

  if (!keyId || !keyPem) return null;

  try {
    const privateKey = await importJWKFromPEM(keyPem);
    const now = Math.floor(Date.now() / 1000);

    const token = await new SignJWT({ kid: keyId })
      .setProtectedHeader({ alg: 'RS256', kid: keyId })
      .setIssuedAt(now)
      .setExpirationTime(now + expirySeconds)
      .setNotBefore(now)
      .sign(privateKey);

    const path = `/${streamId}/manifest/video.m3u8`;
    return `${CF_STREAM_BASE}${path}?token=${token}`;
  } catch (err) {
    console.error('[cf-stream-sign] JWT signing failed:', err);
    return null;
  }
}

/**
 * Generate a signed URL using the Cloudflare API /token endpoint.
 * Rate-limited by Cloudflare (~1000/day). Used as fallback when no signing key.
 */
async function signWithApi(streamId: string): Promise<string | null> {
  const apiToken = process.env.CF_API_TOKEN;
  const accountId = process.env.CF_ACCOUNT_ID;

  if (!apiToken || !accountId) return null;

  try {
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/${streamId}/token`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
      },
    );

    if (!res.ok) {
      console.error(`[cf-stream-sign] /token endpoint returned ${res.status}`);
      return null;
    }

    const data = await res.json();
    if (!data.success || !data.result?.token) {
      console.error('[cf-stream-sign] /token response missing token');
      return null;
    }

    const path = `/${streamId}/manifest/video.m3u8`;
    return `${CF_STREAM_BASE}${path}?token=${data.result.token}`;
  } catch (err) {
    console.error('[cf-stream-sign] API token request failed:', err);
    return null;
  }
}

/**
 * Import a PEM-encoded RSA private key as a JWK for use with jose.
 */
async function importJWKFromPEM(pem: string): Promise<crypto.KeyObject> {
  // Node.js crypto can import PEM directly
  return crypto.createPrivateKey({ key: pem, format: 'pem' });
}

/**
 * Generate a signed Cloudflare Stream manifest URL.
 * Tries signing key first (JWT RS256), then API token fallback, then unsigned dev mode.
 *
 * @param streamId - Cloudflare Stream video ID
 * @param expirySeconds - How long the URL is valid (default 2 hours)
 * @returns Object with url and signed status
 */
export async function signCfStreamUrl(
  streamId: string,
  expirySeconds: number = DEFAULT_EXPIRY_SECONDS,
): Promise<{ url: string; signed: boolean }> {
  // Try signing key mode first (recommended, no rate limit)
  if (isCfStreamSigningConfigured()) {
    const signedUrl = await signWithKey(streamId, expirySeconds);
    if (signedUrl) return { url: signedUrl, signed: true };
  }

  // Fallback to API token mode (rate limited)
  if (isCfApiTokenConfigured()) {
    const signedUrl = await signWithApi(streamId);
    if (signedUrl) return { url: signedUrl, signed: true };
  }

  // Dev mode: unsigned URL
  console.warn('[cf-stream-sign] No signing credentials configured, returning unsigned URL');
  return {
    url: `${CF_STREAM_BASE}/${streamId}/manifest/video.m3u8`,
    signed: false,
  };
}
