'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  Plus,
  Trash2,
  RefreshCw,
  Bell,
  TrendingUp,
  TrendingDown,
  BellOff,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface RateAlert {
  id: string;
  fromCurrency: string;
  toCurrency: string;
  direction: 'above' | 'below';
  targetRate: number;
  notification: 'email' | 'sms';
  status: 'active' | 'triggered';
  createdAt: string;
}

const emptyForm = {
  fromCurrency: 'USD',
  toCurrency: 'KES',
  targetRate: '',
  direction: 'above' as 'above' | 'below',
  notification: 'email' as 'email' | 'sms',
};

const currencies = ['GBP', 'USD', 'EUR', 'KES', 'NGN', 'GHS', 'UGX', 'TZS'];

export function RateAlertsPage() {
  const [alerts, setAlerts] = useState<RateAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/alerts');
      if (res.ok) {
        const data = await res.json();
        setAlerts(Array.isArray(data) ? data : []);
      } else {
        setAlerts([]);
      }
    } catch {
      toast.error('Failed to load rate alerts');
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const handleCreate = async () => {
    if (!form.targetRate || Number(form.targetRate) <= 0) {
      toast.error('Please enter a valid target rate');
      return;
    }
    if (form.fromCurrency === form.toCurrency) {
      toast.error('From and to currencies must be different');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromCurrency: form.fromCurrency,
          toCurrency: form.toCurrency,
          direction: form.direction,
          targetRate: Number(form.targetRate),
          notification: form.notification,
        }),
      });
      if (res.ok) {
        toast.success('Rate alert created');
        setDialogOpen(false);
        setForm(emptyForm);
        fetchAlerts();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || 'Failed to create alert');
      }
    } catch {
      toast.error('Network error, please try again');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/alerts?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Alert removed');
        fetchAlerts();
      } else {
        toast.error('Failed to remove alert');
      }
    } catch {
      toast.error('Network error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rate Alerts</h1>
          <p className="text-muted-foreground">
            Get notified when FX rates hit your target
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAlerts}
            disabled={loading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => setForm(emptyForm)}
                className="bg-emerald-600 text-white hover:bg-emerald-700"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Alert
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[440px]">
              <DialogHeader>
                <DialogTitle>New Rate Alert</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                {/* From currency */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>From Currency</Label>
                    <Select
                      value={form.fromCurrency}
                      onValueChange={(v) => setForm({ ...form, fromCurrency: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {currencies.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>To Currency</Label>
                    <Select
                      value={form.toCurrency}
                      onValueChange={(v) => setForm({ ...form, toCurrency: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {currencies
                          .filter((c) => c !== form.fromCurrency)
                          .map((c) => (
                            <SelectItem key={c} value={c}>
                              {c}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Direction */}
                <div className="grid gap-2">
                  <Label>Direction</Label>
                  <Select
                    value={form.direction}
                    onValueChange={(v: 'above' | 'below') =>
                      setForm({ ...form, direction: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="above">
                        <span className="flex items-center gap-2">
                          <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                          Above (rate goes up)
                        </span>
                      </SelectItem>
                      <SelectItem value="below">
                        <span className="flex items-center gap-2">
                          <TrendingDown className="h-3.5 w-3.5 text-red-500" />
                          Below (rate goes down)
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Target rate */}
                <div className="grid gap-2">
                  <Label htmlFor="targetRate">Target Rate</Label>
                  <Input
                    id="targetRate"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="e.g. 195.00"
                    value={form.targetRate}
                    onChange={(e) =>
                      setForm({ ...form, targetRate: e.target.value })
                    }
                  />
                  <p className="text-[11px] text-muted-foreground">
                    {form.fromCurrency}/{form.toCurrency}{' '}
                    {form.direction === 'above' ? 'goes above' : 'drops below'}{' '}
                    your target
                  </p>
                </div>

                {/* Notification */}
                <div className="grid gap-2">
                  <Label>Notify via</Label>
                  <Select
                    value={form.notification}
                    onValueChange={(v: 'email' | 'sms') =>
                      setForm({ ...form, notification: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="sms">SMS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button
                  onClick={handleCreate}
                  disabled={submitting}
                  className="bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  {submitting ? 'Creating...' : 'Create Alert'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Alert list */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="flex items-center gap-4 pt-6">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-8 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : alerts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BellOff className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="text-sm font-medium text-muted-foreground">
              No rate alerts configured
            </p>
            <p className="mt-1 text-xs text-muted-foreground/70">
              Create an alert to get notified when rates hit your target
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
          {alerts.map((alert) => (
            <Card key={alert.id} className="transition-shadow hover:shadow-sm">
              <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    <Bell className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900">
                      {alert.fromCurrency}/{alert.toCurrency}{' '}
                      <span className="text-muted-foreground">
                        {alert.direction}
                      </span>{' '}
                      <span className="font-semibold text-gray-900">
                        {alert.targetRate.toFixed(2)}
                      </span>
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-0.5">
                      <Badge
                        variant="secondary"
                        className={
                          alert.direction === 'above'
                            ? 'bg-emerald-100 text-emerald-700 text-[10px]'
                            : 'bg-red-100 text-red-700 text-[10px]'
                        }
                      >
                        {alert.direction === 'above' ? (
                          <TrendingUp className="mr-1 h-3 w-3" />
                        ) : (
                          <TrendingDown className="mr-1 h-3 w-3" />
                        )}
                        {alert.direction}
                      </Badge>
                      <span className="text-xs text-muted-foreground capitalize">
                        via {alert.notification}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {alert.createdAt}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge
                    className={
                      alert.status === 'active'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-amber-100 text-amber-700'
                    }
                  >
                    {alert.status}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(alert.id)}
                    className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}