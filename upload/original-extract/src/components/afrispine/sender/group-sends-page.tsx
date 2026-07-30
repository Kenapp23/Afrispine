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
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  Plus,
  Users,
  Eye,
  XCircle,
  RefreshCw,
  Target,
  CalendarClock,
  UserPlus,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';

interface GroupSend {
  id: string;
  title: string;
  description: string;
  targetAmount: number;
  currency: string;
  raisedAmount: number;
  contributorsCount: number;
  deadline: string;
  status: 'active' | 'completed' | 'cancelled';
  recipientName: string;
  rail: string;
}

interface Recipient {
  id: string;
  name: string;
  country: string;
}

const emptyForm = {
  title: '',
  description: '',
  targetAmount: '',
  recipientId: '',
  rail: 'mobile_money',
  deadline: '',
};

const statusColor: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700',
  completed: 'bg-blue-100 text-blue-700',
  cancelled: 'bg-red-100 text-red-700',
};

export function GroupSendsPage() {
  const navigate = useAppStore((s) => s.navigate);
  const [groups, setGroups] = useState<GroupSend[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/group-sends');
      if (res.ok) {
        const data = await res.json();
        setGroups(Array.isArray(data) ? data : []);
      } else {
        setGroups([]);
      }
    } catch {
      toast.error('Failed to load group sends');
      setGroups([]);
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
      // silent
    }
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const handleOpenDialog = () => {
    setForm(emptyForm);
    fetchRecipients();
    setDialogOpen(true);
  };

  const handleCreate = async () => {
    if (!form.title || !form.targetAmount || !form.recipientId || !form.deadline) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (Number(form.targetAmount) <= 0) {
      toast.error('Target amount must be greater than zero');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/group-sends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          targetAmount: Number(form.targetAmount),
          recipientId: form.recipientId,
          rail: form.rail,
          deadline: form.deadline,
        }),
      });
      if (res.ok) {
        toast.success('Group send created successfully');
        setDialogOpen(false);
        fetchGroups();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || 'Failed to create group send');
      }
    } catch {
      toast.error('Network error, please try again');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (id: string) => {
    try {
      const res = await fetch(`/api/group-sends?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
      });
      if (res.ok) {
        toast.success('Group send cancelled');
        fetchGroups();
      } else {
        toast.error('Failed to cancel');
      }
    } catch {
      toast.error('Network error');
    }
  };

  const getProgress = (raised: number, target: number) =>
    target > 0 ? Math.min((raised / target) * 100, 100) : 0;

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Group Sends</h1>
          <p className="text-muted-foreground">
            Pool contributions with others for a shared transfer
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchGroups}
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
                Create Group Send
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>New Group Send</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                {/* Title */}
                <div className="grid gap-2">
                  <Label htmlFor="gs-title">Title</Label>
                  <Input
                    id="gs-title"
                    placeholder="e.g. Mum&apos;s birthday collection"
                    value={form.title}
                    onChange={(e) =>
                      setForm({ ...form, title: e.target.value })
                    }
                  />
                </div>

                {/* Description */}
                <div className="grid gap-2">
                  <Label htmlFor="gs-desc">Description (optional)</Label>
                  <Textarea
                    id="gs-desc"
                    placeholder="What is this group send for?"
                    rows={3}
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                  />
                </div>

                {/* Target amount */}
                <div className="grid gap-2">
                  <Label htmlFor="gs-amount">Target Amount (GBP)</Label>
                  <Input
                    id="gs-amount"
                    type="number"
                    min="1"
                    step="0.01"
                    placeholder="500.00"
                    value={form.targetAmount}
                    onChange={(e) =>
                      setForm({ ...form, targetAmount: e.target.value })
                    }
                  />
                </div>

                {/* Recipient */}
                <div className="grid gap-2">
                  <Label>Recipient</Label>
                  <Select
                    value={form.recipientId}
                    onValueChange={(v) => setForm({ ...form, recipientId: v })}
                  >
                    <SelectTrigger>
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

                {/* Deadline */}
                <div className="grid gap-2">
                  <Label htmlFor="gs-deadline">Deadline</Label>
                  <Input
                    id="gs-deadline"
                    type="date"
                    value={form.deadline}
                    onChange={(e) =>
                      setForm({ ...form, deadline: e.target.value })
                    }
                  />
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
                  {submitting ? 'Creating...' : 'Create Group Send'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="space-y-4 pt-6">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-2 w-full" />
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-8 w-16" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : groups.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <UserPlus className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="text-sm font-medium text-muted-foreground">
              No group sends yet
            </p>
            <p className="mt-1 text-xs text-muted-foreground/70">
              Create one to start pooling contributions
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
          {groups.map((group) => {
            const progress = getProgress(group.raisedAmount, group.targetAmount);
            return (
              <Card
                key={group.id}
                className="transition-shadow hover:shadow-sm"
              >
                <CardContent className="space-y-4 pt-5 pb-5">
                  {/* Title row */}
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {group.title}
                        </h3>
                        <Badge
                          className={statusColor[group.status] || ''}
                        >
                          {group.status}
                        </Badge>
                      </div>
                      {group.description && (
                        <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">
                          {group.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {group.status === 'active' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            navigate('group-sends', {
                              action: 'view',
                              id: group.id,
                            })
                          }
                          className="h-8"
                        >
                          <Eye className="mr-1.5 h-3.5 w-3.5" />
                          View
                        </Button>
                      )}
                      {group.status === 'active' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancel(group.id)}
                          className="h-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                        >
                          <XCircle className="mr-1.5 h-3.5 w-3.5" />
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold text-emerald-700">
                        {group.currency} {group.raisedAmount.toFixed(2)}
                      </span>
                      <span className="text-muted-foreground">
                        of {group.currency} {group.targetAmount.toFixed(2)}
                      </span>
                    </div>
                    <Progress value={progress} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      {progress.toFixed(0)}% funded
                    </p>
                  </div>

                  {/* Meta row */}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {group.contributorsCount} contributor
                      {group.contributorsCount !== 1 ? 's' : ''}
                    </span>
                    <span className="flex items-center gap-1">
                      <CalendarClock className="h-3.5 w-3.5" />
                      {formatDate(group.deadline)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Target className="h-3.5 w-3.5" />
                      {group.recipientName}
                    </span>
                    <span className="capitalize">
                      via {group.rail.replace('_', ' ')}
                    </span>
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