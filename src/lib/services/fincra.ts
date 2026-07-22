import { fetchWithContentTypeGuard, errorResult, healthyResult, ApiError, ContentTypeGuardError } from './http-helpers';
import type { EndpointCheck } from './types';

const BASE_URLS = {
  sandbox: 'https://sandbox.fincra.com',
  production: 'https://api.fincra.com',
};

async function checkFincraEndpoint(
  baseUrl: string,
  apiKey: string,
  name: string,
  path: string,
  businessId?: string
): Promise<EndpointCheck> {
  const start = Date.now();
  try {
    const headers: Record<string, string> = {
      'api-key': apiKey.trim(),
      'Accept': 'application/json',
    };
    if (businessId) {
      headers['x-business-id'] = businessId.trim();
    }
    const url = `${baseUrl}${path}`;
    const response = await fetchWithContentTypeGuard(url, { headers, method: 'GET' });
    const latencyMs = Date.now() - start;
    return { name, result: healthyResult(latencyMs, `${name}: OK (${response.status})`) };
  } catch (err) {
    const latencyMs = Date.now() - start;
    if (err instanceof ContentTypeGuardError) {
      return { name, result: { status: 'error' as const, latencyMs, message: err.message } };
    }
    if (err instanceof ApiError) {
      if (err.status === 401 || err.status === 403) {
        return { name, result: { status: 'error' as const, latencyMs, message: `${name}: Auth failed (${err.status}). Check API key.` } };
      }
      return { name, result: errorResult('unhealthy', `${name}: ${err.message}`, latencyMs) };
    }
    return { name, result: errorResult('error', `${name}: ${(err as Error).message}`, latencyMs) };
  }
}

export async function checkFincraHealth(
  apiKey: string,
  environment: 'sandbox' | 'production',
  businessId?: string
): Promise<EndpointCheck[]> {
  const baseUrl = BASE_URLS[environment] || BASE_URLS.sandbox;
  const checks = [
    { name: 'Account Balance', path: '/accounts/balance' },
    { name: 'Verify Account', path: '/accounts/verify' },
    { name: 'Create Transfer', path: '/transfers' },
    { name: 'Transaction History', path: '/transactions' },
    { name: 'Exchange Rates', path: '/rates/exchange' },
  ];

  const results = await Promise.allSettled(
    checks.map(c => checkFincraEndpoint(baseUrl, apiKey, c.name, c.path, businessId))
  );

  return results.map((r, i) => {
    if (r.status === 'fulfilled') return r.value;
    return {
      name: checks[i].name,
      result: errorResult('error', `${checks[i].name}: ${(r.reason as Error).message}`),
    };
  });
}