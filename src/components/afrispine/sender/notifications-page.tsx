'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAppStore } from '@/stores/app';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Bell,
  BellOff,
  Send,
  ArrowLeftRight,
  ShieldCheck,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  DollarSign,
  UserPlus,
  CreditCard,
} from 'lucide-react';

interface Notification {
  id: string;
  type: 'transaction' | 'kyc' | 'rate_alert' | 'payment' | 'system' | 'group_send';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  status?: string;
  metadata?: Record<string, string>;
}

const typeConfig: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  transaction: { icon: ArrowLeftRight, color: 'text-blue-600', bg: 'bg-blue-100' },
  kyc: { icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-100' },
  rate_alert: { icon: DollarSign, color: 'text-purple-600', bg: 'bg-purple-100' },
  payment: { icon: CreditCard, color: 'text-amber-600', bg: 'bg-amber-100' },
  system: { icon: AlertTriangle, color: 'text-gray-600', bg: 'bg-gray-100' },
  group_send: { icon: UserPlus, color: 'text-indigo-600', bg: 'bg-indigo-100' },
};

const statusColor: Record<string, string> = {
  delivered: 'bg-emerald-100 text-emerald-700',
  processing: 'bg-blue-100 text-blue-700',
  pending: 'bg-amber-100 text-amber-700',
  failed: 'bg-red-100 text-red-700',
  approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-700',
  active: 'bg-emerald-100 text-emerald-700',
  triggered: 'bg-amber-100 text-amber-700',
};

export function NotificationsPage() {
  const sender = useAppStore((s) => s.sender);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'transactions' | 'kyc' | 'alerts'>('all');

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch sender's transactions to build notifications from
      const txRes = await fetch('/api/transfers');
      const alertRes = await fetch('/api/alerts');
      
      const builtNotifications: Notification[] = [];
      let notifId = 1;

      // Build transaction notifications
      if (txRes.ok) {
        const txData = await txRes.json();
        const txns = txData.transactions || txData || [];
        for (const tx of Array.isArray(txns) ? txns.slice(0, 20) : []) {
          const ref = tx.reference || tx.id;
          const status = tx.status || 'pending';
          const recipientName = tx.recipient?.fullName || tx.recipientName || 'Recipient';
          const amount = `${tx.currencySend || 'GBP'} ${(tx.amountSend || tx.amount || 0).toFixed(2)}`;
          const receiveAmount = `${tx.currencyReceive || 'KES'} ${(tx.amountReceive || tx.receiveAmount || 0).toFixed(2)}`;

          if (status === 'delivered') {
            builtNotifications.push({
              id: `notif-${notifId++}`,
              type: 'transaction',
              title: 'Transfer Delivered',
              message: `${amount} to ${recipientName} (${receiveAmount}) has been delivered successfully.`,
              timestamp: tx.createdAt || tx.deliveredAt || new Date().toISOString(),
              read: true,
              status: 'delivered',
              metadata: { reference: ref },
            });
          } else if (status === 'processing') {
            builtNotifications.push({
              id: `notif-${notifId++}`,
              type: 'transaction',
              title: 'Transfer Processing',
              message: `Your transfer of ${amount} to ${recipientName} is being processed.`,
              timestamp: tx.createdAt || new Date().toISOString(),
              read: false,
              status: 'processing',
              metadata: { reference: ref },
            });
          } else if (status === 'failed') {
            builtNotifications.push({
              id: `notif-${notifId++}`,
              type: 'transaction',
              title: 'Transfer Failed',
              message: `Transfer of ${amount} to ${recipientName} failed. ${tx.failureReason || 'Please contact support.'}`,
              timestamp: tx.failedAt || tx.createdAt || new Date().toISOString(),
              read: false,
              status: 'failed',
              metadata: { reference: ref },
            });
          } else if (status === 'pending') {
            builtNotifications.push({
              id: `notif-${notifId++}`,
              type: 'transaction',
              title: 'Transfer Pending',
              message: `Your transfer of ${amount} to ${recipientName} is awaiting payment confirmation.`,
              timestamp: tx.createdAt || new Date().toISOString(),
              read: false,
              status: 'pending',
              metadata: { reference: ref },
            });
          }
        }
      }

      // Build rate alert notifications
      if (alertRes.ok) {
        const alertData = await alertRes.json();
        const alerts = alertData.alerts || alertData || [];
        for (const alert of Array.isArray(alerts) ? alerts : []) {
          if (alert.isActive && !alert.triggeredAt) {
            builtNotifications.push({
              id: `notif-${notifId++}`,
              type: 'rate_alert',
              title: 'Rate Alert Active',
              message: `Your alert for ${alert.fromCurrency}/${alert.toCurrency} ${alert.direction} ${alert.targetRate} is active and monitoring.`,
              timestamp: alert.createdAt || new Date().toISOString(),
              read: true,
              status: 'active',
            });
          } else if (alert.triggeredAt) {
            builtNotifications.push({
              id: `notif-${notifId++}`,
              type: 'rate_alert',
              title: 'Rate Alert Triggered',
              message: `${alert.fromCurrency}/${alert.toCurrency} ${alert.direction} your target of ${alert.targetRate}.`,
              timestamp: alert.triggeredAt,
              read: false,
              status: 'triggered',
            });
          }
        }
      }

      // Add KYC notification based on sender status
      if (sender?.kycStatus === 'pending') {
        builtNotifications.push({
          id: `notif-kyc-1`,
          type: 'kyc',
          title: 'Complete Your Verification',
          message: 'Verify your identity to unlock higher transfer limits of up to $10,000 per day. Go to the KYC tab to get started.',
          timestamp: sender.createdAt || new Date().toISOString(),
          read: false,
        });
      } else if (sender?.kycStatus === 'approved') {
        builtNotifications.push({
          id: `notif-kyc-2`,
          type: 'kyc',
          title: 'Identity Verified',
          message: `Your identity was verified on ${sender.kycCompletedAt ? new Date(sender.kycCompletedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'a previous date'}. Your daily limit is now $${(sender.dailyLimitGbp || 10000).toLocaleString()}.`,
          timestamp: sender.kycCompletedAt || sender.createdAt || new Date().toISOString(),
          read: true,
          status: 'approved',
        });
      } else if (sender?.kycStatus === 'manual_review') {
        builtNotifications.push({
          id: `notif-kyc-3`,
          type: 'kyc',
          title: 'Verification Under Review',
          message: 'Your submitted documents are being reviewed. This typically takes 1-2 business days.',
          timestamp: sender.kycCompletedAt || sender.createdAt || new Date().toISOString(),
          read: false,
          status: 'processing',
        });
      }

      // Add welcome notification if no notifications
      if (builtNotifications.length === 0) {
        builtNotifications.push({
          id: 'notif-welcome',
          type: 'system',
          title: 'Welcome to AfriSpine',
          message: 'Your account is set up and ready. Start sending money to Africa with great rates and fast delivery.',
          timestamp: new Date().toISOString(),
          read: true,
        });
      }

      // Sort by timestamp descending
      builtNotifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      setNotifications(builtNotifications);
    } catch {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [sender]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    toast.success('All notifications marked as read');
  };

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'unread') return !n.read;
    if (activeTab === 'transactions') return n.type === 'transaction';
    if (activeTab === 'kyc') return n.type === 'kyc';
    if (activeTab === 'alerts') return n.type === 'rate_alert';
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const formatTimestamp = (ts: string) => {
    try {
      const date = new Date(ts);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return ts;
    }
  };

  const tabs = [
    { key: 'all' as const, label: 'All', count: notifications.length },
    { key: 'unread' as const, label: 'Unread', count: unreadCount },
    { key: 'transactions' as const, label: 'Transfers', count: notifications.filter((n) => n.type === 'transaction').length },
    { key: 'kyc' as const, label: 'KYC', count: notifications.filter((n) => n.type === 'kyc').length },
    { key: 'alerts' as const, label: 'Alerts', count: notifications.filter((n) => n.type === 'rate_alert').length },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
            <p className="text-muted-foreground">
              {unreadCount > 0
                ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
                : 'You are all caught up'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchNotifications}
            disabled={loading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={markAllAsRead}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Mark all read
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.key
                ? 'bg-emerald-600 text-white'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span
                className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold ${
                  activeTab === tab.key
                    ? 'bg-white/20 text-white'
                    : 'bg-muted-foreground/20 text-muted-foreground'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Notification list */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="flex items-center gap-4 pt-6">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-64" />
                </div>
                <Skeleton className="h-3 w-12" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredNotifications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BellOff className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="text-sm font-medium text-muted-foreground">
              {activeTab === 'unread' ? 'No unread notifications' : 'No notifications in this category'}
            </p>
            <p className="mt-1 text-xs text-muted-foreground/70">
              Notifications about your transfers, KYC, and rate alerts will appear here
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredNotifications.map((notif) => {
            const cfg = typeConfig[notif.type] || typeConfig.system;
            const Icon = cfg.icon;
            return (
              <Card
                key={notif.id}
                className={`transition-shadow hover:shadow-sm cursor-pointer ${
                  !notif.read ? 'border-l-4 border-l-emerald-500 bg-emerald-50/30' : ''
                }`}
                onClick={() => markAsRead(notif.id)}
              >
                <CardContent className="flex items-start gap-4 py-4">
                  {/* Icon */}
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${cfg.bg}`}>
                    <Icon className={`h-5 w-5 ${cfg.color}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={`text-sm ${!notif.read ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                        {notif.title}
                      </p>
                      {notif.status && (
                        <Badge
                          variant="secondary"
                          className={`text-[10px] ${statusColor[notif.status] || ''}`}
                        >
                          {notif.status}
                        </Badge>
                      )}
                      {!notif.read && (
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                      {notif.message}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-xs text-muted-foreground">
                        {formatTimestamp(notif.timestamp)}
                      </span>
                      {notif.metadata?.reference && (
                        <span className="text-xs font-mono text-muted-foreground/70">
                          Ref: {notif.metadata.reference}
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}