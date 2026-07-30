'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Settings, Save, RotateCcw, Bell, ShieldCheck, UserCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface SettingsData {
  platformName: string;
  supportEmail: string;
  maxTransferAmount: number;
  notificationsEnabled: boolean;
  autoAmlCheck: boolean;
  kycRequired: boolean;
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SettingsData>({
    platformName: '',
    supportEmail: '',
    maxTransferAmount: 0,
    notificationsEnabled: true,
    autoAmlCheck: true,
    kycRequired: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/settings', {
        headers: { Authorization: 'Bearer ' + localStorage.getItem('afrispine_token') },
      });
      if (!res.ok) throw new Error('Failed to load settings');
      const json = await res.json();
      setSettings({
        platformName: json.platformName ?? 'AfriSpine',
        supportEmail: json.supportEmail ?? '',
        maxTransferAmount: json.maxTransferAmount ?? 5000,
        notificationsEnabled: json.notificationsEnabled ?? true,
        autoAmlCheck: json.autoAmlCheck ?? true,
        kycRequired: json.kycRequired ?? true,
      });
    } catch {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  async function saveSettings() {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + localStorage.getItem('afrispine_token'),
        },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error('Failed to save settings');
      toast.success('Settings saved successfully');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  }

  async function resetDemoData() {
    setResetting(true);
    try {
      const res = await fetch('/api/seed', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + localStorage.getItem('afrispine_token') },
      });
      if (!res.ok) throw new Error('Failed to reset demo data');
      toast.success('Demo data reset successfully');
      fetchSettings();
    } catch {
      toast.error('Failed to reset demo data');
    } finally {
      setResetting(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </motion.div>
        <div className="grid gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="bg-white">
              <CardContent className="p-6 space-y-4">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
                <div className="space-y-3">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Settings</h1>
            <p className="text-sm text-gray-500 mt-1">Configure platform preferences</p>
          </div>
          <Button
            onClick={saveSettings}
            disabled={saving}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </motion.div>

      {/* General Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <Settings className="h-4 w-4 text-emerald-600" />
              General
            </CardTitle>
            <CardDescription className="text-sm text-gray-500">
              Basic platform configuration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="platformName" className="text-sm text-gray-700">
                  Platform Name
                </Label>
                <Input
                  id="platformName"
                  value={settings.platformName}
                  onChange={(e) =>
                    setSettings({ ...settings, platformName: e.target.value })
                  }
                  placeholder="AfriSpine"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supportEmail" className="text-sm text-gray-700">
                  Support Email
                </Label>
                <Input
                  id="supportEmail"
                  type="email"
                  value={settings.supportEmail}
                  onChange={(e) =>
                    setSettings({ ...settings, supportEmail: e.target.value })
                  }
                  placeholder="support@afrispine.com"
                />
              </div>
            </div>
            <div className="space-y-2 max-w-xs">
              <Label htmlFor="maxTransfer" className="text-sm text-gray-700">
                Max Transfer Amount (USD)
              </Label>
              <Input
                id="maxTransfer"
                type="number"
                value={settings.maxTransferAmount}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    maxTransferAmount: parseFloat(e.target.value) || 0,
                  })
                }
                placeholder="5000"
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Feature Toggles */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-gray-900">
              Feature Toggles
            </CardTitle>
            <CardDescription className="text-sm text-gray-500">
              Enable or disable platform features
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            {/* Notifications */}
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <Bell className="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Notifications</p>
                  <p className="text-xs text-gray-500">Send email and push notifications</p>
                </div>
              </div>
              <Switch
                checked={settings.notificationsEnabled}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, notificationsEnabled: checked })
                }
              />
            </div>
            <Separator />

            {/* Auto AML */}
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-amber-50 flex items-center justify-center">
                  <ShieldCheck className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Auto AML Check</p>
                  <p className="text-xs text-gray-500">Automatically screen transfers for AML</p>
                </div>
              </div>
              <Switch
                checked={settings.autoAmlCheck}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, autoAmlCheck: checked })
                }
              />
            </div>
            <Separator />

            {/* KYC Required */}
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center">
                  <UserCheck className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">KYC Required</p>
                  <p className="text-xs text-gray-500">Require KYC verification before transfers</p>
                </div>
              </div>
              <Switch
                checked={settings.kycRequired}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, kycRequired: checked })
                }
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Danger Zone */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <Card className="bg-white border-red-200">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-red-700">
              Danger Zone
            </CardTitle>
            <CardDescription className="text-sm text-gray-500">
              Irreversible actions that affect all data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Reset Demo Data</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Clear all data and re-seed with demo values
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                    disabled={resetting}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    {resetting ? 'Resetting...' : 'Reset Data'}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Reset all demo data?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete all existing data and replace it with fresh
                      demo data. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={resetDemoData}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Yes, reset data
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}