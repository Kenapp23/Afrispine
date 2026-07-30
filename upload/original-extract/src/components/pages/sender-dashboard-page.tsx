'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Send,
  Plus,
  ArrowRight,
  DollarSign,
  Clock,
  Users,
  TrendingUp,
  SendHorizontal,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAppStore, TransferItem } from '@/stores/app';

function formatCurrency(amount: number, currency: string): string {
  switch (currency) {
    case 'GBP':
      return `£${amount.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    case 'USD':
      return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    case 'KES':
      return `KSh ${amount.toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    default:
      return `${amount.toFixed(2)} ${currency}`;
  }
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'delivered':
      return (
        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200">
          Delivered
        </Badge>
      );
    case 'processing':
      return (
        <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200">
          Processing
        </Badge>
      );
    case 'failed':
      return (
        <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200">
          Failed
        </Badge>
      );
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.4, ease: 'easeOut' },
  }),
};

export default function SenderDashboardPage() {
  const { user, transfers, setTransfers, navigate, addToast } = useAppStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTransfers() {
      try {
        const token = localStorage.getItem('afrispine_token');
        const res = await fetch('/api/transfers?limit=5', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          const raw = data.transfers || data || [];
          // Map API fields
          const mapped = raw.map((t: any) => ({
            ...t,
            sendCurrency: t.sourceCurrency,
            receiveCurrency: t.targetCurrency,
            recipientName: t.recipient?.name,
            recipientPhone: t.recipient?.phone,
          }));
          setTransfers(mapped);
        }
      } catch {
        // Silently fail, show empty state
      } finally {
        setLoading(false);
      }
    }
    fetchTransfers();
  }, [setTransfers]);

  const totalSent = transfers
    .filter((t: TransferItem) => t.status === 'delivered')
    .reduce((sum: number, t: TransferItem) => sum + t.sendAmount, 0);

  const activeTransfers = transfers.filter(
    (t: TransferItem) => t.status === 'processing'
  ).length;

  const sendCurrency = transfers.length > 0 ? transfers[0].sendCurrency : 'GBP';

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Welcome Banner */}
        <motion.div
          custom={0}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 p-6 sm:p-8 text-white"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-1/2 w-48 h-48 bg-white/5 rounded-full translate-y-1/2" />
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-emerald-100 text-sm font-medium">
                Welcome back,
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold mt-1">
                {user?.firstName || 'User'}!
              </h1>
              <p className="text-emerald-100 mt-1 text-sm sm:text-base">
                Send money to Kenya quickly and securely.
              </p>
            </div>
            <Button
              onClick={() => navigate('sender-send')}
              size="lg"
              className="bg-white text-emerald-700 hover:bg-emerald-50 font-semibold shadow-lg shadow-emerald-900/20 shrink-0"
            >
              <Send className="mr-2 h-5 w-5" />
              Send Money
            </Button>
          </div>
        </motion.div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible">
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">
                      Total Sent
                    </p>
                    {loading ? (
                      <Skeleton className="h-8 w-28 mt-2" />
                    ) : (
                      <p className="text-2xl font-bold mt-1 text-gray-900">
                        {formatCurrency(totalSent, sendCurrency)}
                      </p>
                    )}
                  </div>
                  <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible">
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">
                      Active Transfers
                    </p>
                    {loading ? (
                      <Skeleton className="h-8 w-16 mt-2" />
                    ) : (
                      <p className="text-2xl font-bold mt-1 text-gray-900">
                        {activeTransfers}
                      </p>
                    )}
                  </div>
                  <div className="h-12 w-12 rounded-xl bg-amber-50 flex items-center justify-center">
                    <Clock className="h-6 w-6 text-amber-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div custom={3} variants={fadeUp} initial="hidden" animate="visible">
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">
                      Recipients
                    </p>
                    {loading ? (
                      <Skeleton className="h-8 w-16 mt-2" />
                    ) : (
                      <p className="text-2xl font-bold mt-1 text-gray-900">
                        0
                      </p>
                    )}
                  </div>
                  <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Recent Transfers */}
        <motion.div
          custom={4}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
        >
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Recent Transfers
                </h2>
                {transfers.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-emerald-600 hover:text-emerald-700"
                    onClick={() => navigate('sender-transfers')}
                  >
                    View All
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                )}
              </div>

              {loading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-14 w-full rounded-lg" />
                  ))}
                </div>
              ) : transfers.length === 0 ? (
                <div className="text-center py-12">
                  <div className="mx-auto w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
                    <SendHorizontal className="h-8 w-8 text-emerald-400" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 mb-1">
                    No transfers yet
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Send your first transfer to get started
                  </p>
                  <Button
                    onClick={() => navigate('sender-send')}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Send Your First Transfer
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto -mx-5 sm:-mx-6 px-5 sm:px-6">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-100">
                        <TableHead className="text-xs font-medium text-muted-foreground">
                          Date
                        </TableHead>
                        <TableHead className="text-xs font-medium text-muted-foreground">
                          Recipient
                        </TableHead>
                        <TableHead className="text-right text-xs font-medium text-muted-foreground">
                          You Send
                        </TableHead>
                        <TableHead className="text-right text-xs font-medium text-muted-foreground">
                          They Receive
                        </TableHead>
                        <TableHead className="text-right text-xs font-medium text-muted-foreground">
                          Status
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transfers.slice(0, 5).map((t: TransferItem) => (
                        <TableRow
                          key={t.id}
                          className="cursor-pointer hover:bg-gray-50 transition-colors border-gray-50"
                          onClick={() =>
                            navigate('sender-transfer-detail', { id: t.id })
                          }
                        >
                          <TableCell className="text-sm text-gray-600 py-3">
                            {formatDate(t.createdAt)}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {t.recipientName || '—'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {t.recipientPhone || ''}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="text-right text-sm font-medium text-gray-900">
                            {formatCurrency(t.sendAmount, t.sendCurrency || 'GBP')}
                          </TableCell>
                          <TableCell className="text-right text-sm font-medium text-emerald-600">
                            {formatCurrency(t.receiveAmount, t.receiveCurrency || 'KES')}
                          </TableCell>
                          <TableCell className="text-right">
                            <StatusBadge status={t.status} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          custom={5}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="flex flex-col sm:flex-row gap-3"
        >
          <Button
            onClick={() => navigate('sender-send')}
            size="lg"
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-14"
          >
            <DollarSign className="mr-2 h-5 w-5" />
            Send Money
          </Button>
          <Button
            onClick={() => navigate('sender-recipients')}
            size="lg"
            variant="outline"
            className="flex-1 border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-semibold h-14"
          >
            <Plus className="mr-2 h-5 w-5" />
            Add Recipient
          </Button>
        </motion.div>
      </div>
    </div>
  );
}