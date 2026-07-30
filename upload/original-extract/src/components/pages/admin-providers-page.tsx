'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Building2, Clock, DollarSign, Edit2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface Provider {
  id: string;
  name: string;
  corridor: string;
  feePercent: number;
  markup: number;
  reliability: number;
  settlementTime: string;
  active: boolean;
  volume: number;
}

export default function AdminProvidersPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [editProvider, setEditProvider] = useState<Provider | null>(null);
  const [saving, setSaving] = useState(false);

  // Edit form state
  const [formFee, setFormFee] = useState(0);
  const [formMarkup, setFormMarkup] = useState(0);
  const [formActive, setFormActive] = useState(false);

  const fetchProviders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/providers', {
        headers: { Authorization: 'Bearer ' + localStorage.getItem('afrispine_token') },
      });
      if (!res.ok) throw new Error('Failed to load providers');
      const json = await res.json();
      setProviders(json.data ?? json.providers ?? []);
    } catch {
      toast.error('Failed to load providers');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  function openEdit(p: Provider) {
    setEditProvider(p);
    setFormFee(p.feePercent);
    setFormMarkup(p.markup);
    setFormActive(p.active);
  }

  async function saveEdit() {
    if (!editProvider) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/providers', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + localStorage.getItem('afrispine_token'),
        },
        body: JSON.stringify({
          id: editProvider.id,
          feePercent: formFee,
          markup: formMarkup,
          active: formActive,
        }),
      });
      if (!res.ok) throw new Error('Failed to update provider');
      toast.success('Provider updated successfully');
      setEditProvider(null);
      fetchProviders();
    } catch {
      toast.error('Failed to update provider');
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(p: Provider) {
    try {
      const res = await fetch('/api/admin/providers', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + localStorage.getItem('afrispine_token'),
        },
        body: JSON.stringify({ id: p.id, active: !p.active }),
      });
      if (!res.ok) throw new Error('Failed to toggle provider');
      fetchProviders();
    } catch {
      toast.error('Failed to update provider status');
    }
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Payment Providers</h1>
        <p className="text-sm text-gray-500 mt-1">Configure corridors, fees, and reliability</p>
      </motion.div>

      {/* Provider Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
              >
                <Card className="bg-white">
                  <CardContent className="p-6 space-y-4">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                  </CardContent>
                </Card>
              </motion.div>
            ))
          : providers.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
              >
                <Card className="bg-white border-gray-100 hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                          <Building2 className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div>
                          <CardTitle className="text-sm font-semibold text-gray-900">{p.name}</CardTitle>
                          <p className="text-xs text-gray-500 mt-0.5">{p.corridor}</p>
                        </div>
                      </div>
                      <Badge variant={p.active ? 'default' : 'secondary'} className="text-xs">
                        {p.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-gray-500">Fee</p>
                        <p className="text-sm font-semibold text-gray-900">{p.feePercent}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Markup</p>
                        <p className="text-sm font-semibold text-gray-900">{p.markup}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Settlement</p>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-gray-400" />
                          <p className="text-sm text-gray-700">{p.settlementTime}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Volume</p>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3 text-gray-400" />
                          <p className="text-sm text-gray-700">${p.volume.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>

                    {/* Reliability */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs text-gray-500">Reliability</p>
                        <p className="text-xs font-medium text-gray-700">{p.reliability}%</p>
                      </div>
                      <Progress
                        value={p.reliability}
                        className="h-2"
                      />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={p.active}
                          onCheckedChange={() => toggleActive(p)}
                        />
                        <span className="text-xs text-gray-600">{p.active ? 'Enabled' : 'Disabled'}</span>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => openEdit(p)}>
                        <Edit2 className="h-3.5 w-3.5 mr-1" />
                        Edit
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editProvider} onOpenChange={(open) => !open && setEditProvider(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Edit Provider</DialogTitle>
          </DialogHeader>
          {editProvider && (
            <div className="space-y-4 py-2">
              <div>
                <p className="text-sm font-medium text-gray-900">{editProvider.name}</p>
                <p className="text-xs text-gray-500">{editProvider.corridor}</p>
              </div>
              <Separator />
              <div className="space-y-3">
                <div>
                  <Label className="text-sm text-gray-700">Fee Percentage (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formFee}
                    onChange={(e) => setFormFee(parseFloat(e.target.value) || 0)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm text-gray-700">Markup (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formMarkup}
                    onChange={(e) => setFormMarkup(parseFloat(e.target.value) || 0)}
                    className="mt-1"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm text-gray-700">Active</Label>
                  <Switch checked={formActive} onCheckedChange={setFormActive} />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditProvider(null)}>
              Cancel
            </Button>
            <Button onClick={saveEdit} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}