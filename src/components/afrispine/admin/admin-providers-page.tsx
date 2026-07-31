'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Zap, DollarSign, Shield, Activity, RefreshCw } from 'lucide-react';
import { useAppStore } from '@/stores/app';

const statusColor: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700',
  inactive: 'bg-gray-100 text-gray-600',
  degraded: 'bg-amber-100 text-amber-700',
};

const providers = [
  {
    name: 'LemFi',
    slug: 'lemfi',
    status: 'active',
    successRate: 97.8,
    avgDeliveryTime: '2.1 min',
    billingRate: '1.2% + $0.50',
    volume30d: '$312,400',
    txnCount: 1247,
    weights: { speed: 92, cost: 88, reliability: 97 },
  },
  {
    name: "Africa's Talking Pay",
    slug: 'africas-talking-pay',
    status: 'active',
    successRate: 95.2,
    avgDeliveryTime: '3.8 min',
    billingRate: '1.5% + $0.75',
    volume30d: '$198,600',
    txnCount: 843,
    weights: { speed: 78, cost: 75, reliability: 95 },
  },
  {
    name: 'PAPSS',
    slug: 'papss',
    status: 'active',
    successRate: 99.1,
    avgDeliveryTime: '5.2 min',
    billingRate: '0.8% + $1.00',
    volume30d: '$215,800',
    txnCount: 672,
    weights: { speed: 65, cost: 95, reliability: 99 },
  },
  {
    name: 'Ripple ODL',
    slug: 'ripple-odl',
    status: 'degraded',
    successRate: 91.4,
    avgDeliveryTime: '1.4 min',
    billingRate: '2.0% + $0.25',
    volume30d: '$120,520',
    txnCount: 479,
    weights: { speed: 98, cost: 60, reliability: 91 },
  },
];

function ScoreBar({ label, value, icon: Icon }: { label: string; value: number; icon: React.ElementType }) {
  const color =
    value >= 90 ? 'bg-emerald-500' : value >= 75 ? 'bg-amber-500' : 'bg-red-500';
  const textColor =
    value >= 90 ? 'text-emerald-600' : value >= 75 ? 'text-amber-600' : 'text-red-600';

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <Icon className="h-3.5 w-3.5" />
          {label}
        </span>
        <span className={`font-semibold ${textColor}`}>{value}/100</span>
      </div>
      <div className="h-2 w-full rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

export function AdminProvidersPage() {
  const { navigate } = useAppStore();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Providers</h1>
          <p className="text-muted-foreground">Payment rail providers and performance metrics</p>
        </div>
        <Button variant="outline" size="sm" className="w-fit">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh Stats
        </Button>
      </div>

      {/* Provider cards */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {providers.map((p) => (
          <Card key={p.slug} className="relative overflow-hidden">
            {/* Accent bar */}
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-600" />
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{p.name}</CardTitle>
                  <CardDescription className="font-mono text-xs">{p.slug}</CardDescription>
                </div>
                <Badge variant="secondary" className={statusColor[p.status] || ''}>
                  {p.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Stats row */}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div>
                  <p className="text-xs text-muted-foreground">Success Rate</p>
                  <p className="text-lg font-bold text-emerald-600">{p.successRate}%</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Avg Delivery</p>
                  <p className="text-lg font-bold text-gray-900">{p.avgDeliveryTime}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Billing Rate</p>
                  <p className="text-sm font-semibold text-gray-900">{p.billingRate}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Volume (30d)</p>
                  <p className="text-sm font-semibold text-gray-900">{p.volume30d}</p>
                </div>
              </div>

              <Separator />

              {/* Weight scores */}
              <div className="space-y-3">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Weight Scores
                </p>
                <ScoreBar label="Speed" value={p.weights.speed} icon={Zap} />
                <ScoreBar label="Cost" value={p.weights.cost} icon={DollarSign} />
                <ScoreBar label="Reliability" value={p.weights.reliability} icon={Shield} />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  <Activity className="mr-1 inline h-3 w-3" />
                  {p.txnCount} transactions (30d)
                </span>
                <Button variant="outline" size="sm">
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}