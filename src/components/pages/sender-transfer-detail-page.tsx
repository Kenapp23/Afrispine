'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  FileText,
  Globe,
  Loader2,
  Phone,
  RefreshCw,
  Shield,
  Smartphone,
  User,
  XCircle,
  Zap,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
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
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatShortDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function statusConfig(status: string) {
  switch (status) {
    case 'delivered':
      return {
        bg: 'bg-emerald-600',
        text: 'text-white',
        badge: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        icon: CheckCircle2,
        label: 'Delivered',
        description: 'Your transfer has been delivered successfully.',
      };
    case 'processing':
      return {
        bg: 'bg-amber-500',
        text: 'text-white',
        badge: 'bg-amber-100 text-amber-700 border-amber-200',
        icon: Clock,
        label: 'Processing',
        description: 'Your transfer is being processed.',
      };
    case 'failed':
      return {
        bg: 'bg-red-600',
        text: 'text-white',
        badge: 'bg-red-100 text-red-700 border-red-200',
        icon: XCircle,
        label: 'Failed',
        description: 'This transfer could not be completed.',
      };
    default:
      return {
        bg: 'bg-gray-500',
        text: 'text-white',
        badge: 'bg-gray-100 text-gray-700 border-gray-200',
        icon: FileText,
        label: status,
        description: '',
      };
  }
}

interface TimelineStep {
  label: string;
  timestamp?: string;
  completed: boolean;
  active: boolean;
  icon: typeof CheckCircle2;
}

function Timeline({ transfer }: { transfer: TransferItem }) {
  const steps: TimelineStep[] = [
    {
      label: 'Created',
      timestamp: transfer.createdAt,
      completed: true,
      active: false,
      icon: FileText,
    },
    {
      label: 'Quoted',
      timestamp: transfer.quotedAt,
      completed: !!transfer.quotedAt,
      active: !transfer.quotedAt && !!transfer.createdAt,
      icon: FileText,
    },
    {
      label: 'Payment Received',
      timestamp: transfer.paidAt,
      completed: !!transfer.paidAt,
      active: !transfer.paidAt && !!transfer.quotedAt,
      icon: Shield,
    },
    {
      label: 'Processing',
      timestamp: transfer.paidAt && !transfer.deliveredAt ? transfer.paidAt : undefined,
      completed: !!transfer.deliveredAt || !!transfer.paidAt,
      active: !!transfer.paidAt && !transfer.deliveredAt && transfer.status !== 'failed',
      icon: Zap,
    },
    {
      label: 'Delivered',
      timestamp: transfer.deliveredAt,
      completed: !!transfer.deliveredAt,
      active: false,
      icon: CheckCircle2,
    },
  ];

  return (
    <div className="space-y-0">
      {steps.map((step, i) => {
        const Icon = step.icon;
        const isLast = i === steps.length - 1;
        return (
          <div key={step.label} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                  step.completed
                    ? step.label === 'Delivered'
                      ? 'bg-emerald-100'
                      : 'bg-emerald-500'
                    : step.active
                    ? 'bg-amber-100 animate-pulse'
                    : 'bg-gray-100'
                }`}
              >
                <Icon
                  className={`h-4 w-4 ${
                    step.completed
                      ? step.label === 'Delivered'
                        ? 'text-emerald-600'
                        : 'text-white'
                      : step.active
                      ? 'text-amber-600'
                      : 'text-gray-400'
                  }`}
                />
              </div>
              {!isLast && (
                <div
                  className={`w-0.5 h-10 ${
                    step.completed ? 'bg-emerald-300' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
            <div className="pb-8">
              <p
                className={`text-sm font-medium ${
                  step.completed
                    ? 'text-gray-900'
                    : step.active
                    ? 'text-amber-700'
                    : 'text-gray-400'
                }`}
              >
                {step.label}
              </p>
              {step.timestamp && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatDate(step.timestamp)}
                </p>
              )}
              {step.active && (
                <p className="text-xs text-amber-600 mt-0.5">In progress...</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function SenderTransferDetailPage() {
  const { pageParams, navigate, goBack, addToast, resetSendFlow } = useAppStore();
  const [transfer, setTransfer] = useState<TransferItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTransfer() {
      const id = pageParams.id;
      if (!id) return;
      try {
        const token = localStorage.getItem('afrispine_token');
        const res = await fetch(`/api/transfers/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const raw = await res.json();
          const t = raw.transfer || raw;
          // Map API fields to component-expected fields
          const mapped: any = {
            ...t,
            reference: t.id,
            sendCurrency: t.sourceCurrency,
            receiveCurrency: t.targetCurrency,
            fee: t.feeAmount || 0,
            recipientName: t.recipient?.name || '',
            recipientPhone: t.recipient?.phone || '',
            provider: t.providerName || '',
            estimatedDelivery: t.providerName?.includes('instant') ? 'Instant' : '1-24 hours',
          };
          setTransfer(mapped);
        } else {
          addToast('Transfer not found', 'error');
          goBack();
        }
      } catch {
        addToast('Failed to load transfer', 'error');
      } finally {
        setLoading(false);
      }
    }
    fetchTransfer();
  }, [pageParams.id, addToast, goBack]);

  const handleCopyReference = () => {
    if (transfer?.reference) {
      navigator.clipboard.writeText(transfer.reference);
      addToast('Reference copied to clipboard', 'success');
    }
  };

  const handleDownloadReceipt = () => {
    addToast('Receipt downloaded', 'success');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/50">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!transfer) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex items-center justify-center">
        <p className="text-muted-foreground">Transfer not found.</p>
      </div>
    );
  }

  const status = statusConfig(transfer.status);
  const StatusIcon = status.icon;

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
            <h1 className="text-xl font-bold text-gray-900">Transfer Details</h1>
            <p className="text-sm text-muted-foreground">
              {formatShortDate(transfer.createdAt)}
            </p>
          </div>
        </motion.div>

        {/* Status Banner */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <Card className={`border-0 shadow-lg overflow-hidden`}>
            <div className={`${status.bg} px-5 py-6 text-white`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
                    <StatusIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-lg font-bold">{status.label}</p>
                    <p className="text-sm text-white/80">
                      {status.description}
                    </p>
                  </div>
                </div>
                <Badge className={`${status.badge} text-xs font-medium`}>
                  {status.label}
                </Badge>
              </div>
            </div>
            {transfer.status === 'failed' && transfer.failureReason && (
              <div className="bg-red-50 px-5 py-3 border-t border-red-100">
                <p className="text-sm text-red-700">
                  <span className="font-medium">Reason: </span>
                  {transfer.failureReason}
                </p>
              </div>
            )}
          </Card>
        </motion.div>

        {/* Reference */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Reference Number</p>
                <p className="text-lg font-mono font-bold text-gray-900 mt-0.5">
                  {transfer.reference}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyReference}
                className="h-9 border-gray-200"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Transfer Info */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Transfer Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Reference</p>
                  <p className="text-sm font-medium text-gray-900 mt-0.5">
                    {transfer.reference}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Date</p>
                  <p className="text-sm font-medium text-gray-900 mt-0.5">
                    {formatShortDate(transfer.createdAt)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <Badge className={`${status.badge} text-xs mt-1`}>
                    {status.label}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Corridor</p>
                  <p className="text-sm font-medium text-gray-900 mt-0.5">
                    {transfer.sendCurrency === 'GBP' ? '🇬🇧 UK' : '🇺🇸 US'} → 🇰🇪 Kenya
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground">Provider</p>
                  <p className="text-sm font-medium text-gray-900 mt-0.5">
                    {transfer.provider}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Amounts */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Amount Details</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Amount Sent</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {formatCurrency(transfer.sendAmount, transfer.sendCurrency)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Amount Received</span>
                  <span className="text-sm font-semibold text-emerald-600">
                    {formatCurrency(transfer.receiveAmount, transfer.receiveCurrency)}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Transfer Fee</span>
                  <span className="text-sm font-medium text-gray-900">
                    {formatCurrency(transfer.fee, transfer.sendCurrency)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Exchange Rate</span>
                  <span className="text-sm font-medium text-gray-900">
                    1 {transfer.sendCurrency} = {transfer.fxRate.toFixed(2)} KES
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Total Charged</span>
                  <span className="text-base font-bold text-gray-900">
                    {formatCurrency(transfer.sendAmount + transfer.fee, transfer.sendCurrency)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recipient */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Recipient</h3>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
                  <User className="h-6 w-6 text-emerald-600" />
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-gray-900">
                    {transfer.recipientName}
                  </p>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Phone className="h-3.5 w-3.5" />
                    <span>{transfer.recipientPhone}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50 text-xs">
                      <Smartphone className="h-3 w-3 mr-1" />
                      {transfer.recipientMobileMoney || 'M-Pesa'}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Transfer Timeline</h3>
              <Timeline transfer={transfer} />
            </CardContent>
          </Card>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="flex flex-col sm:flex-row gap-3 pb-6"
        >
          <Button
            variant="outline"
            onClick={handleDownloadReceipt}
            className="flex-1 h-12 border-gray-200"
          >
            <Download className="mr-2 h-4 w-4" />
            Download Receipt
          </Button>
          {transfer.status === 'failed' && (
            <Button
              onClick={() => {
                resetSendFlow();
                navigate('sender-send');
              }}
              className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-700"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          )}
        </motion.div>
      </div>
    </div>
  );
}