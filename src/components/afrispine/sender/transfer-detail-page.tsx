'use client';

import React from 'react';
import { useAppStore } from '@/stores/app';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Check, Clock, X, RotateCcw, Banknote } from 'lucide-react';

const statusColor: Record<string, string> = {
  delivered: 'bg-emerald-100 text-emerald-700',
  processing: 'bg-blue-100 text-blue-700',
  pending: 'bg-gray-100 text-gray-700',
  failed: 'bg-red-100 text-red-700',
  refunded: 'bg-amber-100 text-amber-700',
};

const timeline = [
  { status: 'Transfer initiated', time: '28 Jun 2025, 14:30', done: true, icon: Check },
  { status: 'Payment confirmed', time: '28 Jun 2025, 14:31', done: true, icon: Check },
  { status: 'Processing by provider', time: '28 Jun 2025, 14:32', done: true, icon: Check },
  { status: 'Funds delivered', time: '28 Jun 2025, 14:35', done: true, icon: Banknote },
];

export function TransferDetailPage() {
  const navigate = useAppStore((s) => s.navigate);
  const viewParams = useAppStore((s) => s.viewParams);
  const ref = viewParams.id || 'TXN-001';

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={() => navigate('transfers')}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to transfers
      </button>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Transfer summary</CardTitle>
                <p className="text-sm text-muted-foreground font-mono mt-1">{ref}</p>
              </div>
              <Badge variant="secondary" className={statusColor.delivered}>
                Delivered
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">You sent</p>
                  <p className="text-lg font-bold">$100.00</p>
                </div>
                <div>
                  <p className="text-muted-foreground">They received</p>
                  <p className="text-lg font-bold">KES 19,342.00</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Exchange rate</p>
                  <p>1 GBP = 196.39 KES</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Transfer fee</p>
                  <p>$2.99</p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Recipient</p>
                  <p className="font-medium">Jane Wanjiku</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Delivery method</p>
                  <p>M-Pesa (Mobile money)</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Corridor</p>
                  <p>United Kingdom → Kenya</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Provider</p>
                  <p>AfriSpine Rail</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Status timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Status timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-0">
              {timeline.map((step, i) => {
                const Icon = step.icon;
                return (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className={'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 ' + (
                          step.done
                            ? 'border-emerald-600 bg-emerald-600 text-white'
                            : 'border-muted-foreground/30 text-muted-foreground'
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      {i < timeline.length - 1 && (
                        <div
                          className={`w-0.5 flex-1 min-h-[24px] ${
                            step.done ? 'bg-emerald-600' : 'bg-muted-foreground/20'
                          }`}
                        />
                      )}
                    </div>
                    <div className="pb-6">
                      <p className={`text-sm font-medium ${step.done ? 'text-gray-900' : 'text-muted-foreground'}`}>
                        {step.status}
                      </p>
                      <p className="text-xs text-muted-foreground">{step.time}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
