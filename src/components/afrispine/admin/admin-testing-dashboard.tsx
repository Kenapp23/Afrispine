'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FlaskConical,
  Play,
  Trash2,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Zap,
  Shield,
  TrendingDown,
} from 'lucide-react';

type ScenarioType = 'happy-path' | 'replay-attack' | 'timeout-dropout' | 'oversubscription';

interface ScenarioConfig {
  id: ScenarioType;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const SCENARIOS: ScenarioConfig[] = [
  {
    id: 'happy-path',
    label: 'Happy Path — Standard Buy ($1,000 Dangote)',
    description: 'Full deposit → FX conversion → order creation → 3s webhook → Secured. Tests fee splits (1.5% platform, 0.5% exchange, chama).',
    icon: <CheckCircle2 className="h-4 w-4" />,
    color: 'text-emerald-600',
  },
  {
    id: 'replay-attack',
    label: 'Replay Attack — Idempotency Blocker',
    description: 'First request accepted (202). Duplicate X-Idempotency-Key sent 250ms later → 409 Conflict with cached response.',
    icon: <Shield className="h-4 w-4" />,
    color: 'text-amber-600',
  },
  {
    id: 'timeout-dropout',
    label: 'Timeout & In-Flight Dropout (15s hang)',
    description: 'Simulates 15-second NSE connection hang → 504 Gateway Timeout. Funds locked in escrow. Status: Failed.',
    icon: <Clock className="h-4 w-4" />,
    color: 'text-red-600',
  },
  {
    id: 'oversubscription',
    label: 'Dangote Oversubscription (40% Partial Fill)',
    description: '1,000 shares @ ₦300 = ₦300,000. Only 40% filled (400 shares). Pro-rata 60% refund (₦180,000). HMAC-verified webhook.',
    icon: <TrendingDown className="h-4 w-4" />,
    color: 'text-orange-600',
  },
];

interface LedgerEntry {
  id: string;
  orderId: string | null;
  ticker: string | null;
  side: string | null;
  quantity: number | null;
  price: number | null;
  totalValue: number | null;
  status: string | null;
  fee: number | null;
  currency: string | null;
  exchange: string | null;
  createdAt: string;
}

interface FeeEntry {
  id: string;
  orderId: string | null;
  type: string | null;
  description: string | null;
  amount: number | null;
  currency: string | null;
  recipient: string | null;
  status: string | null;
  createdAt: string;
}

interface ScenarioResult {
  success: boolean;
  scenario: string;
  timestamp: string;
  results?: {
    order?: any;
    ledger?: LedgerEntry[];
    feeMatrix?: FeeEntry[];
    webhook?: any;
    timings?: { totalMs: number; steps: { name: string; ms: number }[] };
    replayBlocked?: boolean;
    originalResponse?: any;
    duplicateResponse?: any;
    timeSinceOriginal?: number;
  };
  logs?: string[];
  error?: string;
}

export function AdminTestingDashboard() {
  const [selectedScenario, setSelectedScenario] = useState<ScenarioType | ''>('');
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<ScenarioResult | null>(null);
  const [ledgerData, setLedgerData] = useState<{ ledger: LedgerEntry[]; feeMatrix: FeeEntry[] } | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [clearLoading, setClearLoading] = useState(false);
  const [newEntryIds, setNewEntryIds] = useState<Set<string>>(new Set());
  const prevLedgerIdsRef = useRef<Set<string>>(new Set());
  const terminalRef = useRef<HTMLDivElement>(null);

  const scenarioConfig = SCENARIOS.find((s) => s.id === selectedScenario);

  // Fetch ledger data
  const fetchLedger = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/v1/test/ledger');
      if (res.ok) {
        const data = await res.json();
        // Detect new entries
        const currentIds = new Set(data.ledger.map((e: LedgerEntry) => e.id));
        const newIds = new Set<string>();
        currentIds.forEach((id: string) => {
          if (!prevLedgerIdsRef.current.has(id)) {
            newIds.add(id);
          }
        });
        if (newIds.size > 0) {
          setNewEntryIds(newIds);
          setTimeout(() => setNewEntryIds(new Set()), 2000);
        }
        prevLedgerIdsRef.current = currentIds;
        setLedgerData(data);
      }
    } catch {
      // silent
    }
  }, []);

  // Initial ledger fetch
  useEffect(() => {
    fetchLedger();
  }, [fetchLedger]);

  // Auto-poll while running
  useEffect(() => {
    if (isPolling) {
      const interval = setInterval(fetchLedger, 2000);
      return () => clearInterval(interval);
    }
  }, [isPolling, fetchLedger]);

  // Auto-scroll terminal
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [result?.logs]);

  // Inject scenario
  const handleInject = async () => {
    if (!selectedScenario || isRunning) return;
    setIsRunning(true);
    setIsPolling(true);
    setResult(null);
    prevLedgerIdsRef.current = new Set(ledgerData?.ledger.map((e) => e.id) || []);

    try {
      const res = await fetch('/api/admin/v1/test/inject-scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario: selectedScenario }),
      });
      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setResult({ success: false, scenario: selectedScenario, timestamp: new Date().toISOString(), error: err.message });
    } finally {
      setIsRunning(false);
      // Keep polling a bit longer after completion
      setTimeout(() => {
        setIsPolling(false);
        fetchLedger();
      }, 3000);
    }
  };

  // Clear test data
  const handleClear = async () => {
    setClearLoading(true);
    try {
      const res = await fetch('/api/admin/v1/test/clear', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setLedgerData({ ledger: [], feeMatrix: [] });
        setResult(null);
      }
    } catch {
      // silent
    } finally {
      setClearLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <FlaskConical className="h-6 w-6 text-emerald-600" />
            <h1 className="text-2xl font-bold tracking-tight">System Testing Console</h1>
            <Badge variant="outline" className="border-emerald-500 text-emerald-700 bg-emerald-50 text-xs font-semibold px-2 py-0.5">
              SANDBOX MODE
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">Simulation Engine for Exchange Integration</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleClear}
          disabled={clearLoading}
          className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
        >
          <Trash2 className="h-4 w-4 mr-1.5" />
          {clearLoading ? 'Clearing...' : 'Clear Test Data'}
        </Button>
      </div>

      {/* Main 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Column: Scenario Selector + Results */}
        <div className="lg:col-span-3 space-y-6">
          {/* Scenario Selector Card */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="h-5 w-5 text-emerald-600" />
                Scenario Injection
              </CardTitle>
              <CardDescription>Select a test scenario and inject it into the system</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select
                value={selectedScenario}
                onValueChange={(v) => setSelectedScenario(v as ScenarioType)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a test scenario..." />
                </SelectTrigger>
                <SelectContent>
                  {SCENARIOS.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      <div className="flex items-center gap-2">
                        <span className={s.color}>{s.icon}</span>
                        <span>{s.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {scenarioConfig && (
                <div className="rounded-lg border bg-muted/40 p-3">
                  <div className="flex items-start gap-2">
                    <span className={scenarioConfig.color + ' mt-0.5'}>{scenarioConfig.icon}</span>
                    <div>
                      <p className="text-sm font-medium">{scenarioConfig.label}</p>
                      <p className="text-xs text-muted-foreground mt-1">{scenarioConfig.description}</p>
                    </div>
                  </div>
                </div>
              )}

              <Button
                onClick={handleInject}
                disabled={!selectedScenario || isRunning}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-11"
              >
                {isRunning ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Running {scenarioConfig?.label.split('—')[0].trim()}...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Inject Test Scenario
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Test Results Panel */}
          {result && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {result.success ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    Test Results
                  </CardTitle>
                  <Badge variant={result.success ? 'default' : 'destructive'} className={result.success ? 'bg-emerald-600' : ''}>
                    {result.success ? '202 Accepted' : 'Error'}
                  </Badge>
                </div>
                <CardDescription>
                  {result.scenario} — {result.timestamp}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Timing Breakdown */}
                {result.results?.timings && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      Timing Breakdown
                    </h4>
                    <div className="space-y-1.5">
                      {result.results.timings.steps.map((step, i) => (
                        <div key={i} className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">{step.name}</span>
                          <span className="font-mono font-medium">{step.ms.toLocaleString()}ms</span>
                        </div>
                      ))}
                      <div className="flex items-center justify-between text-xs font-semibold border-t pt-1.5 mt-1.5">
                        <span>Total</span>
                        <span className="font-mono text-emerald-600">{result.results.timings.totalMs.toLocaleString()}ms</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Terminal Output */}
                <div>
                  <h4 className="text-sm font-semibold mb-2">Console Output</h4>
                  <div
                    ref={terminalRef}
                    className="rounded-lg bg-gray-950 text-green-400 p-4 font-mono text-xs leading-relaxed max-h-64 overflow-y-auto scroll-smooth"
                    style={{ scrollbarWidth: 'thin', scrollbarColor: '#22c55e #111' }}
                  >
                    {result.logs?.map((line, i) => (
                      <div key={i} className={line.includes('❌') ? 'text-red-400' : line.includes('⚠️') ? 'text-amber-400' : line.includes('✅') ? 'text-emerald-400' : ''}>
                        <span className="text-gray-500 select-none">{String(i + 1).padStart(2, ' ')} </span>
                        {line}
                      </div>
                    ))}
                    {isRunning && (
                      <div className="animate-pulse text-emerald-400">▌</div>
                    )}
                  </div>
                </div>

                {/* Webhook Payload */}
                {result.results?.webhook && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                      <Shield className="h-4 w-4 text-emerald-600" />
                      Webhook Payload
                      {result.results.webhook.verified && (
                        <Badge variant="outline" className="border-emerald-500 text-emerald-700 bg-emerald-50 text-[10px] ml-1">
                          HMAC-SHA256 Verified
                        </Badge>
                      )}
                    </h4>
                    <div className="rounded-lg bg-gray-950 text-amber-300 p-4 font-mono text-xs overflow-x-auto">
                      <pre className="whitespace-pre-wrap">{JSON.stringify(result.results.webhook, null, 2)}</pre>
                    </div>
                  </div>
                )}

                {/* Replay Attack: show both responses */}
                {result.results?.replayBlocked !== undefined && result.scenario === 'replay-attack' && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      Replay Attack Analysis
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3">
                        <p className="text-xs font-semibold text-emerald-700 mb-1">Original Request (202)</p>
                        <pre className="text-[10px] font-mono text-emerald-900 overflow-x-auto">
                          {JSON.stringify(result.results.originalResponse, null, 2)}
                        </pre>
                      </div>
                      <div className="rounded-lg border border-red-200 bg-red-50/50 p-3">
                        <p className="text-xs font-semibold text-red-700 mb-1">Duplicate Request (409)</p>
                        <pre className="text-[10px] font-mono text-red-900 overflow-x-auto">
                          {JSON.stringify(result.results.duplicateResponse, null, 2)}
                        </pre>
                      </div>
                    </div>
                    {result.results.timeSinceOriginal !== undefined && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Replay detected {result.results.timeSinceOriginal}ms after original request
                      </p>
                    )}
                  </div>
                )}

                {/* Oversubscription: refund calculation */}
                {result.scenario === 'oversubscription' && result.results?.webhook && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                      <TrendingDown className="h-4 w-4 text-orange-500" />
                      Pro-Rata Refund Calculation
                    </h4>
                    <div className="rounded-lg border bg-muted/30 p-3 space-y-1.5 text-xs">
                      <div className="flex justify-between"><span className="text-muted-foreground">Requested Shares</span><span className="font-mono">{result.results.webhook.requestedShares}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Filled Shares</span><span className="font-mono text-emerald-600">{result.results.webhook.filledShares} ({result.results.webhook.fillPercentage}%)</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Filled Value</span><span className="font-mono">₦{result.results.webhook.filledTotal?.toLocaleString()}</span></div>
                      <div className="flex justify-between border-t pt-1.5"><span className="text-muted-foreground">Refund Amount</span><span className="font-mono text-orange-600">₦{result.results.webhook.refundAmount?.toLocaleString()} ({result.results.webhook.refundPercentage}%)</span></div>
                    </div>
                  </div>
                )}

                {/* Error display */}
                {result.error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                    <p className="text-sm text-red-700 font-medium">Error</p>
                    <p className="text-xs text-red-600 mt-1">{result.error}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Live Ledger Monitor */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <RefreshCw className={`h-4 w-4 ${isPolling ? 'animate-spin text-emerald-600' : 'text-muted-foreground'}`} />
                  Live Ledger
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={fetchLedger} className="h-7 text-xs">
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="ledger">
                <TabsList className="w-full mb-3">
                  <TabsTrigger value="ledger" className="flex-1 text-xs">NSE Ledger</TabsTrigger>
                  <TabsTrigger value="fees" className="flex-1 text-xs">Fee Matrix</TabsTrigger>
                </TabsList>

                <TabsContent value="ledger">
                  {ledgerData && ledgerData.ledger.length > 0 ? (
                    <div className="max-h-96 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#d4d4d8 transparent' }}>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-[10px] h-8">Time</TableHead>
                            <TableHead className="text-[10px] h-8">Ticker</TableHead>
                            <TableHead className="text-[10px] h-8">Side</TableHead>
                            <TableHead className="text-[10px] h-8">Qty</TableHead>
                            <TableHead className="text-[10px] h-8">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {ledgerData.ledger.map((entry) => (
                            <TableRow
                              key={entry.id}
                              className={`text-xs ${newEntryIds.has(entry.id) ? 'animate-pulse bg-emerald-50' : ''}`}
                            >
                              <TableCell className="font-mono text-[10px] py-1.5">
                                {new Date(entry.createdAt).toLocaleTimeString()}
                              </TableCell>
                              <TableCell className="font-semibold py-1.5">{entry.ticker || '—'}</TableCell>
                              <TableCell className="py-1.5">
                                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${entry.side === 'REFUND' ? 'border-orange-300 text-orange-700' : ''}`}>
                                  {entry.side}
                                </Badge>
                              </TableCell>
                              <TableCell className="font-mono py-1.5">{entry.quantity ?? '—'}</TableCell>
                              <TableCell className="py-1.5">
                                <span className={`text-[10px] font-medium ${entry.status?.includes('Failed') ? 'text-red-600' : entry.status?.includes('Secured') ? 'text-emerald-600' : entry.status?.includes('Refund') ? 'text-orange-600' : 'text-muted-foreground'}`}>
                                  {entry.status || '—'}
                                </span>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      <FlaskConical className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      <p>No ledger entries yet</p>
                      <p className="text-xs mt-1">Inject a scenario to see data</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="fees">
                  {ledgerData && ledgerData.feeMatrix.length > 0 ? (
                    <div className="max-h-96 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#d4d4d8 transparent' }}>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-[10px] h-8">Time</TableHead>
                            <TableHead className="text-[10px] h-8">Type</TableHead>
                            <TableHead className="text-[10px] h-8">Amount</TableHead>
                            <TableHead className="text-[10px] h-8">Recipient</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {ledgerData.feeMatrix.map((entry) => (
                            <TableRow
                              key={entry.id}
                              className={`text-xs ${newEntryIds.has(entry.id) ? 'animate-pulse bg-emerald-50' : ''}`}
                            >
                              <TableCell className="font-mono text-[10px] py-1.5">
                                {new Date(entry.createdAt).toLocaleTimeString()}
                              </TableCell>
                              <TableCell className="py-1.5">
                                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${entry.type === 'refund' ? 'border-orange-300 text-orange-700' : ''}`}>
                                  {entry.type}
                                </Badge>
                              </TableCell>
                              <TableCell className="font-mono py-1.5">
                                {entry.amount !== null ? `₦${entry.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '—'}
                              </TableCell>
                              <TableCell className="text-[10px] py-1.5 text-muted-foreground">{entry.recipient || '—'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      <FlaskConical className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      <p>No fee entries yet</p>
                      <p className="text-xs mt-1">Inject a scenario to see data</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
