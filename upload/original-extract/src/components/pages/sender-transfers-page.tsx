'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  FileText,
  Inbox,
  Loader2,
  Search,
  Send,
  TrendingUp,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200 shrink-0">
          Delivered
        </Badge>
      );
    case 'processing':
      return (
        <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200 shrink-0">
          Processing
        </Badge>
      );
    case 'failed':
      return (
        <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200 shrink-0">
          Failed
        </Badge>
      );
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.3 },
  }),
};

export default function SenderTransfersPage() {
  const { transfers, setTransfers, navigate, goBack, addToast } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [hasMore, setHasMore] = useState(true);

  const fetchTransfers = useCallback(
    async (append = false) => {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      try {
        const token = localStorage.getItem('afrispine_token');
        const limit = append ? 20 : 20;
        const offset = append ? transfers.length : 0;
        const res = await fetch(
          `/api/transfers?limit=${limit}&offset=${offset}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (res.ok) {
          const data = await res.json();
          const raw = data.transfers || data || [];
          const mapped = raw.map((t: any) => ({
            ...t,
            sendCurrency: t.sourceCurrency,
            receiveCurrency: t.targetCurrency,
            recipientName: t.recipient?.name,
            recipientPhone: t.recipient?.phone,
          }));
          if (append) {
            setTransfers([...transfers, ...mapped]);
          } else {
            setTransfers(mapped);
          }
          if (mapped.length < limit) {
            setHasMore(false);
          }
        }
      } catch {
        addToast('Failed to load transfers', 'error');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [transfers, setTransfers, addToast]
  );

  useEffect(() => {
    fetchTransfers();
  }, []);

  const filteredTransfers = transfers.filter((t: any) => {
    const matchesTab =
      activeTab === 'all' || t.status === activeTab;
    const rName = (t as any).recipient?.name || (t as any).recipientName || '';
    const rPhone = (t as any).recipient?.phone || (t as any).recipientPhone || '';
    const ref = t.id || '';
    const matchesSearch =
      !searchQuery ||
      rName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rPhone.includes(searchQuery) ||
      ref.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const counts = {
    all: transfers.length,
    processing: transfers.filter((t: TransferItem) => t.status === 'processing').length,
    delivered: transfers.filter((t: TransferItem) => t.status === 'delivered').length,
    failed: transfers.filter((t: TransferItem) => t.status === 'failed').length,
  };

  const renderTransferCard = (t: TransferItem, index: number) => (
    <motion.button
      key={t.id}
      custom={index}
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      onClick={() => navigate('sender-transfer-detail', { id: t.id })}
      className="w-full text-left"
    >
      <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-200 mb-3">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div
                className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
                  t.status === 'delivered'
                    ? 'bg-emerald-100'
                    : t.status === 'processing'
                    ? 'bg-amber-100'
                    : 'bg-red-100'
                }`}
              >
                {t.status === 'delivered' ? (
                  <TrendingUp className="h-5 w-5 text-emerald-600" />
                ) : t.status === 'processing' ? (
                  <Send className="h-5 w-5 text-amber-600" />
                ) : (
                  <FileText className="h-5 w-5 text-red-600" />
                )}
              </div>
              <div className="min-w-0">
                <p className="font-medium text-gray-900 truncate">
                  {t.recipientName || '—'}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t.recipientPhone || ''} · {formatDate(t.createdAt)}
                </p>
              </div>
            </div>
            <StatusBadge status={t.status} />
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">You Sent</p>
              <p className="text-sm font-semibold text-gray-900">
                {formatCurrency(t.sendAmount, t.sendCurrency || 'GBP')}
              </p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 mx-2" />
            <div className="text-right">
              <p className="text-xs text-muted-foreground">They Received</p>
              <p className="text-sm font-semibold text-emerald-600">
                {formatCurrency(t.receiveAmount, t.receiveCurrency || 'KES')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.button>
  );

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3"
        >
          <button
            onClick={goBack}
            className="h-9 w-9 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors shrink-0"
          >
            <ArrowLeft className="h-4 w-4 text-gray-600" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Transfer History</h1>
            <p className="text-sm text-muted-foreground">
              {transfers.length} transfer{transfers.length !== 1 ? 's' : ''} total
            </p>
          </div>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="relative"
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by name, phone, or reference..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 bg-white border-gray-200 rounded-xl"
          />
        </motion.div>

        {/* Filter Tabs */}
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full bg-gray-100 h-10 p-1 rounded-xl">
              <TabsTrigger
                value="all"
                className="flex-1 rounded-lg text-xs font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                All ({counts.all})
              </TabsTrigger>
              <TabsTrigger
                value="processing"
                className="flex-1 rounded-lg text-xs font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                Processing ({counts.processing})
              </TabsTrigger>
              <TabsTrigger
                value="delivered"
                className="flex-1 rounded-lg text-xs font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                Delivered ({counts.delivered})
              </TabsTrigger>
              <TabsTrigger
                value="failed"
                className="flex-1 rounded-lg text-xs font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                Failed ({counts.failed})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </motion.div>

        {/* Content */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        ) : filteredTransfers.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Inbox className="h-8 w-8 text-gray-300" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">
              {searchQuery || activeTab !== 'all'
                ? 'No matching transfers'
                : 'No transfers yet'}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {searchQuery || activeTab !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Send your first transfer to get started'}
            </p>
            {!searchQuery && activeTab === 'all' && (
              <Button
                onClick={() => navigate('sender-send')}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <Send className="mr-2 h-4 w-4" />
                Send Money
              </Button>
            )}
          </motion.div>
        ) : (
          <>
            {filteredTransfers.map((t: TransferItem, i: number) =>
              renderTransferCard(t, i)
            )}

            {/* Load More */}
            {hasMore && (
              <div className="flex justify-center pt-2">
                <Button
                  variant="outline"
                  onClick={() => fetchTransfers(true)}
                  disabled={loadingMore}
                  className="h-10 border-gray-200"
                >
                  {loadingMore ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ChevronDown className="mr-2 h-4 w-4" />
                  )}
                  Load More
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}