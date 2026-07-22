import { fetchWithContentTypeGuard, errorResult, healthyResult, ApiError, ContentTypeGuardError } from './http-helpers';
import type { EndpointCheck } from './types';

const BASE_URLS = {
  sandbox: 'https://mystocks.africa/api/sandbox/v1',
  production: 'https://mystocks.africa/api/v1/partner',
};

async function checkMyStocksEndpoint(
  baseUrl: string,
  apiKey: string,
  name: string,
  path: string,
  method: string = 'GET'
): Promise<{ name: string; result: { status: 'healthy' | 'degraded' | 'unhealthy' | 'error'; latencyMs: number; message: string; data?: Record<string, unknown> } }> {
  const start = Date.now();
  try {
    const url = `${baseUrl}${path}`;
    const response = await fetchWithContentTypeGuard(
      url,
      {
        method,
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Accept': 'application/json' },
      }
    );
    const latencyMs = Date.now() - start;
    return { name, result: healthyResult(latencyMs, `${name}: OK (${response.status})`) };
  } catch (err) {
    const latencyMs = Date.now() - start;
    if (err instanceof ContentTypeGuardError) {
      return { name, result: { status: 'error', latencyMs, message: err.message } };
    }
    if (err instanceof ApiError) {
      if (err.status === 401 || err.status === 403) {
        return { name, result: { status: 'error', latencyMs, message: `${name}: Auth failed (${err.status}). Check API key.` } };
      }
      return { name, result: errorResult('unhealthy', `${name}: ${err.message}`, latencyMs) };
    }
    return { name, result: errorResult('error', `${name}: ${(err as Error).message}`, latencyMs) };
  }
}

export async function checkMyStocksHealth(apiKey: string, environment: 'sandbox' | 'production'): Promise<EndpointCheck[]> {
  const baseUrl = BASE_URLS[environment] || BASE_URLS.sandbox;
  const checks = [
    { name: 'Health Ping', path: '/health' },
    { name: 'Market Data', path: '/equities/market-data' },
    { name: 'Top Gainers', path: '/equities/top-gainers' },
    { name: 'Top Losers', path: '/equities/top-losers' },
    { name: 'Market Indices', path: '/equities/indices' },
    { name: 'Portfolio Summary', path: '/portfolio/summary' },
  ];

  const results = await Promise.allSettled(
    checks.map(c => checkMyStocksEndpoint(baseUrl, apiKey, c.name, c.path))
  );

  return results.map((r, i) => {
    if (r.status === 'fulfilled') return r.value;
    return {
      name: checks[i].name,
      result: errorResult('error', `${checks[i].name}: ${(r.reason as Error).message}`),
    };
  });
}