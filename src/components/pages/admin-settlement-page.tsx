'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Wallet, Clock, CheckCircle2, ArrowDownLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface SettlementData {
  summary: {
    pendingAmount: number;
    pendingCount: number;
    totalSettled: number;
    avgSettlementDays: string;
  };
  pending: {
    id: string;
    provider: string;
    amount: number;
    currency: string;
    period: string;
    dueDate: string;
    transfers: number;
  }[];
  history: {
    id: string;
    provider: string;
    amount: number;
    currency: string;
    period: string;
    settledDate: string;
    status: string;
  }[];
}

const historyStatusColor: Record<string, string> = {
  settled: 'bg-emerald-100 text-emerald-700',
  partial: 'bg-amber-100 text-amber-700',
  failed: 'bg-red-100 text-red-700',
};

export default function AdminSettlementPage() {
  const [data, setData] = useState<SettlementData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSettlements() {
      try {
        const res = await fetch('/api/admin/settlement', {
          headers: { Authorization: 'Bearer ' + localStorage.getItem('afrispine_token') },
        });
        if (!res.ok) throw new Error('Failed to load settlements');
        const json = await res.json();
        setData(json);
      } catch {
        toast.error('Failed to load settlement data');
      } finally {
        setLoading(false);
      }
    }
    fetchSettlements();
  }, []);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Settlements</h1>
        <p className="text-sm text-gray-500 mt-1">Manage provider settlement balances and history</p>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            title: 'Pending Amount',
            value: data ? `$${data.summary.pendingAmount.toLocaleString()}` : '—',
            icon: Wallet,
            color: 'bg-amber-50 text-amber-600',
          },
          {
            title: 'Pending Count',
            value: data?.summary.pendingCount.toString() ?? '—',
            icon: Clock,
            color: 'bg-orange-50 text-orange-600',
          },
          {
            title: 'Total Settled',
            value: data ? `$${data.summary.totalSettled.toLocaleString()}` : '—',
            icon: CheckCircle2,
            color: 'bg-emerald-50 text-emerald-600',
          },
          {
            title: 'Avg. Settlement',
            value: data?.summary.avgSettlementDays ?? '—',
            icon: ArrowDownLeft,
            color: 'bg-blue-50 text-blue-600',
          },
        ].map((stat, i) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
          >
            <Card className="bg-white">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">{stat.title}</p>
                    {loading ? (
                      <Skeleton className="h-7 w-20 mt-1" />
                    ) : (
                      <p className="text-lg font-bold text-gray-900 mt-1">{stat.value}</p>
                    )}
                  </div>
                  <div className={`h-10 w-10 rounded-lg ${stat.color} flex items-center justify-center`}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="bg-gray-100">
            <TabsTrigger value="pending">
              Pending ({data?.pending.length ?? 0})
            </TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-4">
            <Card className="bg-white">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50/80">
                        <TableHead className="text-xs font-medium text-gray-500">Provider</TableHead>
                        <TableHead className="text-xs font-medium text-gray-500">Amount</TableHead>
                        <TableHead className="text-xs font-medium text-gray-500">Period</TableHead>
                        <TableHead className="text-xs font-medium text-gray-500">Transfers</TableHead>
                        <TableHead className="text-xs font-medium text-gray-500">Due Date</TableHead>
                        <TableHead className="text-xs font-medium text-gray-500">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                          <TableRow key={i}>
                            {Array.from({ length: 6 }).map((_, j) => (
                              <TableCell key={j}>
                                <Skeleton className="h-5 w-20" />
                              </TableCell>
                            ))}
                          </TableRow>
                        ))
                      ) : (data?.pending ?? []).length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-12 text-gray-400 text-sm">
                            No pending settlements
                          </TableCell>
                        </TableRow>
                      ) : (
                        (data?.pending ?? []).map((s) => (
                          <TableRow key={s.id} className="hover:bg-gray-50 transition-colors">
                            <TableCell className="text-sm font-medium text-gray-900">{s.provider}</TableCell>
                            <TableCell className="text-sm font-semibold text-gray-900">
                              ${s.amount.toLocaleString()} {s.currency}
                            </TableCell>
                            <TableCell className="text-sm text-gray-600">{s.period}</TableCell>
                            <TableCell className="text-sm text-gray-600">{s.transfers}</TableCell>
                            <TableCell className="text-sm text-gray-500 whitespace-nowrap">{s.dueDate}</TableCell>
                            <TableCell>
                              <Badge className="bg-amber-100 text-amber-700 text-xs hover:bg-amber-100">
                                Pending
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            <Card className="bg-white">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50/80">
                        <TableHead className="text-xs font-medium text-gray-500">Provider</TableHead>
                        <TableHead className="text-xs font-medium text-gray-500">Amount</TableHead>
                        <TableHead className="text-xs font-medium text-gray-500">Period</TableHead>
                        <TableHead className="text-xs font-medium text-gray-500">Settled Date</TableHead>
                        <TableHead className="text-xs font-medium text-gray-500">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                          <TableRow key={i}>
                            {Array.from({ length: 5 }).map((_, j) => (
                              <TableCell key={j}>
                                <Skeleton className="h-5 w-20" />
                              </TableCell>
                            ))}
                          </TableRow>
                        ))
                      ) : (data?.history ?? []).length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-12 text-gray-400 text-sm">
                            No settlement history
                          </TableCell>
                        </TableRow>
                      ) : (
                        (data?.history ?? []).map((h) => (
                          <TableRow key={h.id} className="hover:bg-gray-50 transition-colors">
                            <TableCell className="text-sm font-medium text-gray-900">{h.provider}</TableCell>
                            <TableCell className="text-sm font-semibold text-gray-900">
                              ${h.amount.toLocaleString()} {h.currency}
                            </TableCell>
                            <TableCell className="text-sm text-gray-600">{h.period}</TableCell>
                            <TableCell className="text-sm text-gray-500 whitespace-nowrap">{h.settledDate}</TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={`capitalize text-xs ${historyStatusColor[h.status] ?? ''}`}
                              >
                                {h.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}