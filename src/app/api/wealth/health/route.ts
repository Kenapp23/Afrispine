'use server';

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkMyStocksHealth } from '@/lib/services/mystocks';
import { checkFincraHealth } from '@/lib/services/fincra';
import type { WealthHealthResponse, ProviderHealthSummary } from '@/lib/services/types';

const PROVIDERS = [
  { key: 'mystocks', displayName: 'MyStocks', category: 'Markets' },
  { key: 'fincra', displayName: 'Fincra', category: 'Payments' },
  { key: 'openverse', displayName: 'Openverse', category: 'Images' },
  { key: 'paystack', displayName: 'Paystack', category: 'Payments' },
  { key: 'flutterwave', displayName: 'Flutterwave', category: 'Payments' },
];

async function getCred(provider: string): Promise<{
  key: string; secretKey?: string; environment: string; baseUrl?: string;
} | null> {
  const envKey = process.env[`${provider.toUpperCase()}_PUBLIC_KEY`] || process.env[`${provider.toUpperCase()}_API_KEY`];
  const envSecret = process.env[`${provider.toUpperCase()}_SECRET_KEY`];
  const envEnv = process.env[`${provider.toUpperCase()}_ENVIRONMENT`];
  const envBase = process.env[`${provider.toUpperCase()}_BASE_URL`];

  if (envKey) {
    return {
      key: envKey.trim(),
      secretKey: envSecret?.trim() || undefined,
      environment: (envEnv as 'sandbox' | 'production') || 'sandbox',
      baseUrl: envBase?.trim() || undefined,
    };
  }

  try {
    const cred = await db.apiCredential.findUnique({ where: { provider } });
    if (!cred) return null;
    return {
      key: cred.apiKey,
      secretKey: cred.secretKey || undefined,
      environment: (cred.environment as 'sandbox' | 'production') || 'sandbox',
      baseUrl: cred.baseUrl || undefined,
    };
  } catch {
    return null;
  }
}

async function checkProviderHealth(provider: typeof PROVIDERS[number]): Promise<ProviderHealthSummary> {
  const cred = await getCred(provider.key);

  if (!cred) {
    return {
      provider: provider.key,
      displayName: provider.displayName,
      overallStatus: 'unconfigured',
      endpointsOk: 0,
      endpointsTotal: 0,
      latencyMs: 0,
      message: 'No credentials configured',
      configured: false,
      endpoints: [],
    };
  }

  let endpoints: { name: string; result: { status: string; latencyMs: number; message: string } }[] = [];
  const start = Date.now();

  try {
    if (provider.key === 'mystocks') {
      endpoints = await checkMyStocksHealth(cred.key, cred.environment as 'sandbox' | 'production');
    } else if (provider.key === 'fincra') {
      endpoints = await checkFincraHealth(cred.key, cred.environment as 'sandbox' | 'production', cred.baseUrl);
    } else if (provider.key === 'openverse') {
      const r = await fetch(`https://api.openverse.org/v1/images/?q=test&license_type=commercial&page_size=1`, {
        signal: AbortSignal.timeout(10000),
      });
      const ms = Date.now() - start;
      endpoints = [{ name: 'Search', result: { status: r.ok ? 'healthy' : 'unhealthy', latencyMs: ms, message: r.ok ? 'OK' : `HTTP ${r.status}` } }];
    } else if (provider.key === 'paystack') {
      const r = await fetch('https://api.paystack.co/transaction/verify/reference', {
        headers: { Authorization: `Bearer ${cred.key}`, Accept: 'application/json' },
        signal: AbortSignal.timeout(10000),
      });
      const ms = Date.now() - start;
      const ok = r.ok || r.status === 404;
      endpoints = [{ name: 'Transaction Verify', result: { status: ok ? 'healthy' : 'unhealthy', latencyMs: ms, message: ok ? 'Reachable' : `HTTP ${r.status}` } }];
    } else if (provider.key === 'flutterwave') {
      const r = await fetch('https://api.flutterwave.com/v3/transactions', {
        headers: { Authorization: `Bearer ${cred.key}`, Accept: 'application/json' },
        signal: AbortSignal.timeout(10000),
      });
      const ms = Date.now() - start;
      const ok = r.ok || r.status === 400;
      endpoints = [{ name: 'Transactions', result: { status: ok ? 'healthy' : 'unhealthy', latencyMs: ms, message: ok ? 'Reachable' : `HTTP ${r.status}` } }];
    }
  } catch (err) {
    const ms = Date.now() - start;
    endpoints = [{ name: 'Connection', result: { status: 'error', latencyMs: ms, message: (err as Error).message } }];
  }

  const endpointsOk = endpoints.filter(e => e.result.status === 'healthy').length;
  const endpointsTotal = endpoints.length;
  const avgLatency = endpoints.length > 0 ? Math.round(endpoints.reduce((s, e) => s + e.result.latencyMs, 0) / endpoints.length) : 0;
  const hasCredential = !!cred;
  const configured = hasCredential && endpointsOk > 0;

  let overallStatus: ProviderHealthSummary['overallStatus'];
  if (!configured) overallStatus = 'unconfigured';
  else if (endpointsOk === endpointsTotal) overallStatus = 'healthy';
  else if (endpointsOk > 0) overallStatus = 'degraded';
  else overallStatus = 'unhealthy';

  return {
    provider: provider.key,
    displayName: provider.displayName,
    overallStatus,
    endpointsOk,
    endpointsTotal,
    latencyMs: avgLatency,
    message: configured ? `${endpointsOk}/${endpointsTotal} endpoints healthy` : 'Not configured or no endpoints passing',
    configured,
    endpoints,
  };
}

export async function GET() {
  try {
    const providerResults = await Promise.all(PROVIDERS.map(checkProviderHealth));

    const healthy = providerResults.filter(p => p.overallStatus === 'healthy').length;
    const degraded = providerResults.filter(p => p.overallStatus === 'degraded').length;
    const unhealthy = providerResults.filter(p => p.overallStatus === 'unhealthy' || p.overallStatus === 'error').length;
    const unconfigured = providerResults.filter(p => p.overallStatus === 'unconfigured').length;

    let overallStatus: WealthHealthResponse['overall']['status'];
    if (unconfigured === providerResults.length) overallStatus = 'unconfigured';
    else if (healthy === providerResults.length) overallStatus = 'healthy';
    else if (unhealthy > 0 && healthy === 0) overallStatus = 'all_down';
    else if (degraded > 0 || unhealthy > 0) overallStatus = 'degraded';
    else overallStatus = 'healthy';

    const response: WealthHealthResponse = {
      overall: {
        status: overallStatus,
        totalProviders: providerResults.length,
        healthyProviders: healthy,
        degradedProviders: degraded,
        unhealthyProviders: unhealthy,
        unconfiguredProviders: unconfigured,
      },
      providers: providerResults,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}