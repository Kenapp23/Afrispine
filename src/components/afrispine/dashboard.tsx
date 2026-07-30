'use client'

import React, { useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Activity,
  Zap,
  DollarSign,
  Clock,
  Users,
  ArrowUpDown,
  Radio,
  TrendingUp,
  Circle,
  CheckCircle2,
  ArrowUpCircle,
  ArrowDownCircle,
} from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAppStore } from '@/stores/app'
import { io } from 'socket.io-client'

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmtUsd(n: number | undefined | null): string {
  if (n == null || isNaN(n)) return '$0'
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`
  return `$${n.toLocaleString()}`
}

function fmtNum(n: number | undefined | null): string {
  if (n == null || isNaN(n)) return '0'
  return n.toLocaleString()
}

function fmtPct(n: number | undefined | null): string {
  if (n == null || isNaN(n)) return '0%'
  return `${n.toFixed(1)}%`
}

// ── Match type badge config ──────────────────────────────────────────────────

const matchTypeConfig: Record<string, { label: string; className: string }> = {
  smart_match: {
    label: 'Smart Match',
    className: 'border-spine/30 bg-spine/10 text-spine-foreground',
  },
  ripple_odl: {
    label: 'Ripple ODL',
    className: 'border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400',
  },
  stablecoin_atomic: {
    label: 'Instant Transfer',
    className: 'border-gold/30 bg-gold/10 text-gold-foreground',
  },
  papss_settle: {
    label: 'PAPSS',
    className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  },
  direct: {
    label: 'Direct',
    className: 'border-earth/30 bg-earth/10 text-earth-foreground',
  },
  liquidity_pool: {
    label: 'Liquidity Pool',
    className: 'border-border bg-muted text-muted-foreground',
  },
}

// ── Liquidity event type icon/badge ──────────────────────────────────────────

function LiquidityTypeIcon({ type }: { type: string }) {
  switch (type) {
    case 'supply':
      return <ArrowUpCircle className="size-4 text-green-500" />
    case 'demand':
      return <ArrowDownCircle className="size-4 text-red-500" />
    case 'match':
      return <Circle className="size-4 fill-spine text-spine-foreground" />
    case 'settle':
      return <CheckCircle2 className="size-4 text-gold" />
    default:
      return <Circle className="size-4 text-muted-foreground" />
  }
}

const liqTypeBadge: Record<string, string> = {
  supply: 'border-green-500/30 bg-green-500/10 text-green-600 dark:text-green-400',
  demand: 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400',
  match: 'border-spine/30 bg-spine/10 text-spine-foreground',
  settle: 'border-gold/30 bg-gold/10 text-gold-foreground',
}

// ── Netting data (deterministic seed to avoid hydration mismatch) ──────────

function generateNettingData() {
  const hours = Array.from({ length: 12 }, (_, i) => `${(i + 1).toString().padStart(2, '0')}:00`)
  let seed = 42
  const seededRandom = () => {
    seed = (seed * 16807 + 0) % 2147483647
    return (seed - 1) / 2147483646
  }
  return hours.map((h, i) => {
    const gross = 600 + Math.sin(i * 0.8) * 200 + seededRandom() * 100
    const netted = gross * (0.65 + Math.sin(i * 0.5) * 0.1 + seededRandom() * 0.05)
    return { hour: h, gross: Math.round(gross * 10) / 10, netted: Math.round(netted * 10) / 10 }
  })
}

const NETTING_DATA = generateNettingData()

// ── Component ────────────────────────────────────────────────────────────────

export function DashboardSection() {
  const {
    transactions,
    liquidityEvents,
    metrics,
    connected,
    setConnected,
    addTransaction,
    addLiquidityEvent,
    setMetrics,
  } = useAppStore()

  // ── WebSocket ────────────────────────────────────────────────────────────
  useEffect(() => {
    const socket = io("/?XTransformPort=3003", { transports: ['websocket'] })
    socket.on("connect", () => {
      setConnected(true)
    })
    socket.on("disconnect", () => {
      setConnected(false)
    })
    socket.on("transaction", (tx) => {
      addTransaction(tx)
    })
    socket.on("liquidity", (e) => {
      addLiquidityEvent(e)
    })
    socket.on("metrics", (m) => {
      setMetrics(m)
    })
    return () => {
      socket.disconnect()
    }
  }, [setConnected, addTransaction, addLiquidityEvent, setMetrics])

  // Only show the 15 most recent transactions
  const recentTx = transactions.slice(0, 15)
  const recentLiq = liquidityEvents.slice(0, 8)

  const m = metrics

  return (
    <section className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      {/* ── Section Header ────────────────────────────────────────────────── */}
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Radio className="size-5 text-spine" />
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            AfriSpine Orchestration Live
          </h2>
          {/* Pulsing LIVE dot */}
          <span className="relative flex size-3">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-green-500 opacity-60" />
            <span className="relative inline-flex size-3 rounded-full bg-green-500" />
          </span>
          <span className="text-xs font-bold uppercase tracking-widest text-green-500">
            Live
          </span>
        </div>
        <Badge
          variant="outline"
          className={`w-fit gap-1.5 border-border text-xs font-medium ${
            connected
              ? 'border-green-500/40 bg-green-500/10 text-green-600 dark:text-green-400'
              : 'border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-400'
          }`}
        >
          <Circle
            className={`size-2 ${connected ? 'fill-green-500 text-green-500' : 'fill-red-500 text-red-500'}`}
          />
          {connected ? 'Connected' : 'Disconnected'}
        </Badge>
      </div>

      {/* ── Top Metrics Row ───────────────────────────────────────────────── */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
        {/* Volume (24h) */}
        <Card className="border-border bg-card">
          <CardContent className="flex items-start justify-between p-4 sm:p-5">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Volume (24h)</p>
              <p className="mt-1 text-2xl font-bold text-foreground sm:text-3xl">
                {m ? fmtUsd(m.totalVolume24h) : '$0'}
              </p>
            </div>
            <div className="flex size-10 items-center justify-center rounded-lg bg-spine/10">
              <TrendingUp className="size-5 text-spine" />
            </div>
          </CardContent>
        </Card>

        {/* Transactions */}
        <Card className="border-border bg-card">
          <CardContent className="flex items-start justify-between p-4 sm:p-5">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Transactions</p>
              <p className="mt-1 text-2xl font-bold text-foreground sm:text-3xl">
                {m ? fmtNum(m.transactions24h) : '0'}
              </p>
            </div>
            <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
              <Activity className="size-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        {/* Avg Fee */}
        <Card className="border-border bg-card">
          <CardContent className="flex items-start justify-between p-4 sm:p-5">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Avg Fee</p>
              <p className="mt-1 text-2xl font-bold text-foreground sm:text-3xl">
                {m ? fmtPct(m.avgFee) : '0%'}
              </p>
            </div>
            <div className="flex size-10 items-center justify-center rounded-lg bg-gold/10">
              <DollarSign className="size-5 text-gold" />
            </div>
          </CardContent>
        </Card>

        {/* Match Rate */}
        <Card className="border-border bg-card">
          <CardContent className="flex items-start justify-between p-4 sm:p-5">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Match Rate</p>
              <p className="mt-1 text-2xl font-bold text-foreground sm:text-3xl">
                {m ? fmtPct(m.matchRate) : '0%'}
              </p>
            </div>
            <div className="flex size-10 items-center justify-center rounded-lg bg-spine/10">
              <Zap className="size-5 text-spine" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Main Area: Two Columns ────────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* ── Left: Live Transaction Feed ─────────────────────────────────── */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Activity className="size-4 text-spine" />
                Live Transaction Feed
              </CardTitle>
              <Badge variant="outline" className="border-border text-xs text-muted-foreground">
                {recentTx.length} recent
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0 pb-2">
            <div className="max-h-[500px] overflow-y-auto custom-scrollbar px-4">
              <AnimatePresence initial={false}>
                {recentTx.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Radio className="mb-3 size-8 text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground">Waiting for transactions...</p>
                    <p className="mt-1 text-xs text-muted-foreground/60">
                      {connected ? 'Connected — data will appear here' : 'Not connected'}
                    </p>
                  </div>
                )}
                {recentTx.map((tx) => {
                  const matchCfg = matchTypeConfig[tx.matchType] || matchTypeConfig.direct
                  const railLabel = tx.railLabel || matchCfg.label
                  return (
                    <motion.div
                      key={tx.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                      className="border-b border-border/50 py-3 last:border-b-0"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        {/* Left: Flag + ID + Sender */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-base leading-none">{tx.flag}</span>
                            <span className="truncate font-mono text-xs text-muted-foreground">
                              {tx.id}
                            </span>
                          </div>
                          <p className="mt-0.5 truncate text-sm font-medium text-foreground">
                            {tx.sender}
                          </p>
                        </div>
                        {/* Right: Match type + Speed */}
                        <div className="flex shrink-0 items-center gap-1.5">
                          <Badge
                            variant="outline"
                            className={`text-[10px] font-medium ${matchCfg.className}`}
                          >
                            {matchCfg.label}
                          </Badge>
                          <Badge variant="outline" className="border-border text-[10px] text-muted-foreground">
                            <Clock className="mr-0.5 size-2.5" />
                            {tx.speed}
                          </Badge>
                        </div>
                      </div>
                      {/* Amounts row */}
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground">
                          ${tx.sendAmount.toLocaleString()} USD
                        </span>
                        <ArrowUpDown className="size-3 text-muted-foreground/60" />
                        <span>
                          {tx.recvAmount.toLocaleString()} {tx.recvCurrency}
                        </span>
                        <span className="text-muted-foreground/60">
                          via {tx.provider}
                        </span>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>

        {/* ── Right Column: Two Stacked Panels ────────────────────────────── */}
        <div className="flex flex-col gap-6">
          {/* Panel 1: Liquidity Marketplace */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <ArrowUpDown className="size-4 text-gold" />
                  Liquidity Marketplace
                </CardTitle>
                <Badge variant="outline" className="border-border text-xs text-muted-foreground">
                  {recentLiq.length} events
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0 pb-2">
              <div className="max-h-[260px] overflow-y-auto custom-scrollbar px-4">
                {recentLiq.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <Users className="mb-2 size-6 text-muted-foreground/40" />
                    <p className="text-xs text-muted-foreground">No liquidity events yet</p>
                  </div>
                )}
                <AnimatePresence initial={false}>
                  {recentLiq.map((ev) => (
                    <motion.div
                      key={ev.id}
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25 }}
                      className="flex items-center gap-3 border-b border-border/50 py-2.5 last:border-b-0"
                    >
                      <LiquidityTypeIcon type={ev.type} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="truncate text-sm font-medium text-foreground">
                            {ev.provider}
                          </span>
                          <Badge
                            variant="outline"
                            className={`text-[10px] font-medium capitalize ${liqTypeBadge[ev.type] || 'border-border bg-muted text-muted-foreground'}`}
                          >
                            {ev.type}
                          </Badge>
                        </div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                          <span className="font-medium text-foreground">
                            {ev.amount.toLocaleString()} {ev.currency}
                          </span>
                          <span className="text-muted-foreground/60">{ev.corridor}</span>
                          {ev.matchQuality !== null && ev.matchQuality !== undefined && (
                            <span className="text-spine font-medium">
                              {fmtPct(ev.matchQuality)} match
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>

          {/* Panel 2: Corridor Volume Bar Chart */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <TrendingUp className="size-4 text-spine" />
                Corridor Volume
              </CardTitle>
            </CardHeader>
            <CardContent>
              {m && m.corridorVolumes.length > 0 ? (
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart
                    data={m.corridorVolumes}
                    layout="vertical"
                    margin={{ top: 0, right: 12, bottom: 0, left: 0 }}
                  >
                    <XAxis type="number" hide />
                    <YAxis
                      type="category"
                      dataKey="corridor"
                      tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                      width={90}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--card)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius)',
                        fontSize: 12,
                        color: 'var(--foreground)',
                      }}
                      formatter={(value: number) => [`$${fmtNum(value)}`, 'Volume']}
                    />
                    <Bar
                      dataKey="volume"
                      fill="var(--spine)"
                      radius={[0, 4, 4, 0]}
                      maxBarSize={20}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-[180px] items-center justify-center text-sm text-muted-foreground/60">
                  Awaiting metrics...
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Bottom: Netting Efficiency Visualization ──────────────────────── */}
      <Card className="mt-6 border-border bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Zap className="size-4 text-spine" />
            Netting Efficiency
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={NETTING_DATA} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="gradGross" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--spine)" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="var(--spine)" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="gradNetted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--gold)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--gold)" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="hour"
                tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis hide />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  fontSize: 12,
                  color: 'var(--foreground)',
                }}
                formatter={(value: number, name: string) => [
                  `$${fmtNum(value)}`,
                  name === 'gross' ? 'Gross Volume' : 'Netted Volume',
                ]}
              />
              <Area
                type="monotone"
                dataKey="gross"
                stroke="var(--spine)"
                strokeWidth={1.5}
                fill="url(#gradGross)"
                strokeOpacity={0.5}
              />
              <Area
                type="monotone"
                dataKey="netted"
                stroke="var(--gold)"
                strokeWidth={2}
                fill="url(#gradNetted)"
              />
            </AreaChart>
          </ResponsiveContainer>
          <div className="mt-2 flex items-center justify-center gap-6 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="inline-block size-2.5 rounded-sm border border-spine/50 bg-spine/20" />
              Gross Volume
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block size-2.5 rounded-sm bg-gold" />
              Netted Volume
            </span>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}