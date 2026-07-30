'use client';

import React from 'react';
import { useAppStore } from '@/stores/app';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';

interface ImpactData {
  hasData: boolean;
  totalSent: number;
  totalSentFormatted: string;
  countries: string[];
  countrySubtitle: string;
  feesSaved: number;
  feesSavedFormatted: string;
  portfolioValue: number;
  portfolioFormatted: string;
  portfolioChangePct: number;
  portfolioChangeFormatted: string;
  hasPortfolio: boolean;
  totalDividends: number;
  dividendsFormatted: string;
  chamaTotal: number;
  chamaFormatted: string;
  chamaLabel: string;
  chamaMembers: number;
  chamaCycles: number;
  giftCount: number;
  giftRedeemedLocal: number;
  giftRedeemedFormatted: string;
}

function ImpactSkeleton() {
  return (
    <div className="space-y-5">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-start gap-3">
          <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-3 w-40" />
          </div>
        </div>
      ))}
    </div>
  );
}

function StatRow({
  icon,
  label,
  value,
  subtitle,
  valueColor,
}: {
  icon: string;
  label: string;
  value: string;
  subtitle: string;
  valueColor?: string;
}) {
  return (
    <div className="flex items-start gap-3 py-2">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-base leading-none">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className={`text-lg font-bold leading-tight ${valueColor ?? 'text-gray-900'}`}>
          {value}
        </p>
        {subtitle && (
          <p className="mt-0.5 text-xs text-muted-foreground truncate">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  const navigate = useAppStore((s) => s.navigate);
  return (
    <div className="flex flex-col items-center gap-3 py-8 text-center px-4">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl">
        🌍
      </div>
      <p className="max-w-xs text-sm text-muted-foreground leading-relaxed">
        Start your AfriSpine journey — send your first transfer to see your impact grow
      </p>
      <button
        onClick={() => navigate('send')}
        className="mt-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
      >
        Send your first transfer
      </button>
    </div>
  );
}

export function ImpactWidget() {
  const sessionToken = useAppStore((s) => s.sessionToken);
  const [open, setOpen] = React.useState(true);
  const [loading, setLoading] = React.useState(true);
  const [data, setData] = React.useState<ImpactData | null>(null);

  React.useEffect(() => {
    if (!sessionToken) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchImpact() {
      try {
        const res = await fetch('/api/sender/impact', {
          headers: {
            Authorization: `Bearer ${sessionToken}`,
          },
        });
        if (!res.ok || cancelled) return;
        const json = await res.json();
        if (!cancelled) setData(json);
      } catch {
        // silent
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchImpact();
    return () => {
      cancelled = true;
    };
  }, [sessionToken]);

  return (
    <Card className="border-emerald-200 overflow-hidden">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer select-none hover:bg-emerald-50/50 transition-colors py-4 px-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">✨</span>
                <CardTitle className="text-base font-semibold text-gray-900">
                  Your AfriSpine Impact
                </CardTitle>
              </div>
              <ChevronDown
                className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
                  open ? 'rotate-180' : ''
                }`}
              />
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="px-5 pb-5 pt-0">
            {loading ? (
              <ImpactSkeleton />
            ) : !data?.hasData ? (
              <EmptyState />
            ) : (
              <div className="divide-y divide-border/60">
                <StatRow
                  icon="💸"
                  label="Total sent home"
                  value={data.totalSentFormatted}
                  subtitle={data.countrySubtitle}
                />
                <StatRow
                  icon="💰"
                  label="Fees saved vs WU"
                  value={data.feesSavedFormatted}
                  subtitle="vs Western Union (7% avg)"
                  valueColor="text-emerald-600"
                />
                {data.hasPortfolio && (
                  <StatRow
                    icon="📈"
                    label="Portfolio value"
                    value={data.portfolioFormatted}
                    subtitle={`${data.portfolioChangeFormatted} since you started`}
                    valueColor={data.portfolioChangePct >= 0 ? 'text-emerald-600' : 'text-red-600'}
                  />
                )}
                <StatRow
                  icon="💵"
                  label="Dividends earned"
                  value={data.dividendsFormatted}
                  subtitle="Money earned while you slept"
                />
                {data.chamaTotal > 0 && (
                  <StatRow
                    icon="🏦"
                    label={`${data.chamaLabel} total`}
                    value={data.chamaFormatted}
                    subtitle={`${data.chamaMembers} members, ${data.chamaCycles} cycle${data.chamaCycles !== 1 ? 's' : ''} completed`}
                  />
                )}
                {data.giftCount > 0 && (
                  <StatRow
                    icon="🎁"
                    label="Gifts sent"
                    value={`${data.giftCount} gift${data.giftCount !== 1 ? 's' : ''}`}
                    subtitle={data.giftRedeemedFormatted || `${data.giftCount} vouchers sent`}
                  />
                )}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}