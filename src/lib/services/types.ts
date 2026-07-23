export interface HealthResult {
  status: 'healthy' | 'degraded' | 'unhealthy' | 'error';
  latencyMs: number;
  message: string;
  data?: Record<string, unknown>;
}

export interface EndpointCheck {
  name: string;
  result: HealthResult;
}

export interface ProviderHealthSummary {
  provider: string;
  displayName: string;
  overallStatus: 'healthy' | 'degraded' | 'unhealthy' | 'unconfigured' | 'error';
  endpointsOk: number;
  endpointsTotal: number;
  latencyMs: number;
  message: string;
  configured: boolean;
  endpoints: EndpointCheck[];
}

export interface WealthHealthResponse {
  overall: {
    status: 'healthy' | 'degraded' | 'unhealthy' | 'all_down' | 'unconfigured';
    totalProviders: number;
    healthyProviders: number;
    degradedProviders: number;
    unhealthyProviders: number;
    unconfiguredProviders: number;
  };
  providers: ProviderHealthSummary[];
  timestamp: string;
}

export interface ProviderConfig {
  provider: string;
  apiKey: string;
  secretKey?: string;
  environment: string;
  baseUrl?: string;
}
