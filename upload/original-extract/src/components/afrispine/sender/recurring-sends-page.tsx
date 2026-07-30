'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAppStore } from '@/stores/app';
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
  Pause,
  Play,
  Trash2,
  RefreshCw,
  Clock,
  CalendarClock,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface RecurringSend {
  id: string;
  recipientName: string;
  amount: number;
  currency: string;
  receiveCurrency: string;
  frequency: 'weekly' | 'monthly';
  dayOfMonth?: number;
  rail: string;
  nextRunDate: string;
  status: 'active' | 'paused';
}

interface Recipient {
  id: string;
  name: string;
  country: string;
  phone?: string;
}

const emptyForm = {
  recipientId: '',
  amount: '',
  currencyPair: 'GBP/KES',
  rail: 'mobile_money',
  frequency: 'monthly' as 'weekly' | 'monthly',
  dayOfMonth: '1',
};

export function RecurringSendsPage() {
  const [sends, setSends] = useState<RecurringSend[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const fetchSends = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/recurring');
      if (res.ok) {
        const data = await res.json();
        setSends(Array.isArray(data) ? data : []);
      } else {
        setSends([]);
      }
    } catch {
      toast.error('Failed to load recurring sends');
      setSends([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRecipients = useCallback(async () => {
    try {
      const res = await fetch('/api/recipients');
      if (res.ok) {
        const data = await res.json();
        setRecipients(Array.isArray(data) ? data : []);
      }
    } catch {
      // silently fail — user can still type
    }
  }, []);

  useEffect(() => {
    fetchSends();
  }, [fetchSends]);

  const handleOpenDialog = () => {
    setForm(emptyForm);
    fetchRecipients();
    setDialogOpen(true);
  };

  const handleCreate = async () => {
    if (!form.recipientId || !form.amount || Number(form.amount) <= 0) {
      toast.error('Please fill in all required fields');
      return;
    }
    setSubmitting(true);
    try {
      const [sendCurrency, receiveCurrency] = form.currencyPair.split('/');
      const res = await fetch('/api/recurring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientId: form.recipientId,
          amount: Number(form.amount),
          sendCurrency,
          receiveCurrency,
          rail: form.rail,
          frequency: form.frequency,
          dayOfMonth: form.frequency === 'monthly' ? Number(form.dayOfMonth) : undefined,
        }),
      });
      if (res.ok) {
        toast.success('Recurring send created successfully');
        setDialogOpen(false);
        fetchSends();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || 'Failed to create recurring send');
      }
    } catch {
      toast.error('Network error, please try again');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTogglePause = async (item: RecurringSend) => {
    const newStatus = item.status === 'active' ? 'paused' : 'active';
    try {
      const res = await fetch(`/api/recurring?id=${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        toast.success(
          newStatus === 'paused'
            ? 'Recurring send paused'
            : 'Recurring send resumed'
        );
        fetchSends();
      } else {
        toast.error('Failed to update status');
      }
    } catch {
      toast.error('Network error');
    }
  };

  const handleDelete = async (item: RecurringSend) => {
    try {
      const res = await fetch(`/api/recurring?id=${item.id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Recurring send deleted');
        fetchSends();
      } else {
        toast.error('Failed to delete');
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
          <h1 className="text-2xl font-bold text-gray-900">Recurring Sends</h1>
          <p className="text-muted-foreground">
            Automate your regular transfers on a schedule
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSends}
            disabled={loading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={handleOpenDialog}
                className="bg-emerald-600 text-white hover:bg-emerald-700"
              >
                <Plus className="mr-2 h-4 w-4" />
                Set up recurring send
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px]">
              <DialogHeader>
                <DialogTitle>New Recurring Send</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                {/* Recipient */}
                <div className="grid gap-2">
                  <Label htmlFor="recipient">Recipient</Label>
                  <Select
                    value={form.recipientId}
                    onValueChange={(v) => setForm({ ...form, recipientId: v })}
                  >
                    <SelectTrigger id="recipient">
                      <SelectValue placeholder="Select recipient" />
                    </SelectTrigger>
                    <SelectContent>
                      {recipients.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.name} ({r.country})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Amount */}
                <div className="grid gap-2">
                  <Label htmlFor="amount">Amount (GBP)</Label>
                  <Input
                    id="amount"
                    type="number"
                    min="1"
                    step="0.01"
                    placeholder="100.00"
                    value={form.amount}
                    onChange={(e) =>
                      setForm({ ...form, amount: e.target.value })
                    }
                  />
                </div>

                {/* Currency Pair */}
                <div className="grid gap-2">
                  <Label>Currency Pair</Label>
                  <Select
                    value={form.currencyPair}
                    onValueChange={(v) =>
                      setForm({ ...form, currencyPair: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GBP/KES">GBP → KES</SelectItem>
                      <SelectItem value="GBP/NGN">GBP → NGN</SelectItem>
                      <SelectItem value="GBP/GHS">GBP → GHS</SelectItem>
                      <SelectItem value="GBP/UGX">GBP → UGX</SelectItem>
                      <SelectItem value="GBP/TZS">GBP → TZS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Rail */}
                <div className="grid gap-2">
                  <Label>Payment Rail</Label>
                  <Select
                    value={form.rail}
                    onValueChange={(v) => setForm({ ...form, rail: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mobile_money">Mobile Money</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Frequency */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Frequency</Label>
                    <Select
                      value={form.frequency}
                      onValueChange={(v: 'weekly' | 'monthly') =>
                        setForm({ ...form, frequency: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {form.frequency === 'monthly' && (
                    <div className="grid gap-2">
                      <Label htmlFor="dayOfMonth">Day of Month</Label>
                      <Select
                        value={form.dayOfMonth}
                        onValueChange={(v) =>
                          setForm({ ...form, dayOfMonth: v })
                        }
                      >
                        <SelectTrigger id="dayOfMonth">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 28 }, (_, i) => i + 1).map(
                            (d) => (
                              <SelectItem key={d} value={String(d)}>
                                {d}
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
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
                  {submitting ? 'Creating...' : 'Create'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="flex items-center gap-4 pt-6">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-28" />
                </div>
                <Skeleton className="h-8 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : sends.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CalendarClock className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="text-sm font-medium text-muted-foreground">
              No recurring sends set up yet
            </p>
            <p className="mt-1 text-xs text-muted-foreground/70">
              Create one to automate your regular transfers
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
          {sends.map((item) => (
            <Card key={item.id} className="transition-shadow hover:shadow-sm">
              <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {item.recipientName}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-0.5">
                      <span className="text-sm text-gray-700 font-semibold">
                        {item.currency} {item.amount.toFixed(2)}
                      </span>
                      <span className="text-xs text-muted-foreground">→</span>
                      <span className="text-xs text-muted-foreground">
                        {item.receiveCurrency}
                      </span>
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        {item.frequency}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        via {item.rail.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Next: {item.nextRunDate}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge
                    className={
                      item.status === 'active'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-amber-100 text-amber-700'
                    }
                  >
                    {item.status}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTogglePause(item)}
                    className="h-8 w-8 p-0"
                  >
                    {item.status === 'active' ? (
                      <Pause className="h-3.5 w-3.5" />
                    ) : (
                      <Play className="h-3.5 w-3.5" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(item)}
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