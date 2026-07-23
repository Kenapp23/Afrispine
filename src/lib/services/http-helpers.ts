export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ContentTypeGuardError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ContentTypeGuardError';
  }
}

export async function fetchWithContentTypeGuard(
  url: string,
  options: RequestInit = {},
  expectedTypes: string[] = ['application/json']
): Promise<Response> {
  const response = await fetch(url, { ...options, signal: AbortSignal.timeout(8000) });

  const contentType = response.headers.get('content-type') || '';
  const isExpectedType = expectedTypes.some(t => contentType.includes(t));

  if (!isExpectedType && contentType.includes('text/html')) {
    throw new ContentTypeGuardError(
      `Received HTML from ${url} (expected ${expectedTypes.join(' or ')}). Status: ${response.status}`
    );
  }

  if (!response.ok) {
    throw new ApiError(response.status, `HTTP ${response.status}: ${response.statusText}`);
  }

  return response;
}

export function errorResult(status: 'unhealthy' | 'error', message: string, latencyMs: number = 0) {
  return { status, latencyMs, message } as const;
}

export function healthyResult(latencyMs: number, message: string, data?: Record<string, unknown>) {
  return { status: 'healthy' as const, latencyMs, message, data };
}