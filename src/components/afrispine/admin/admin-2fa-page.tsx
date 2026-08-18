'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Shield, ShieldCheck, ShieldAlert, QrCode, Copy, Check, Loader2 } from 'lucide-react';
import { useAppStore } from '@/stores/app';

export function Admin2FAPage() {
  const navigate = useAppStore((s) => s.navigate);
  const logoutAdmin = useAppStore((s) => s.logoutAdmin);

  const [loading, setLoading] = useState(true);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');

  // Setup state
  const [settingUp, setSettingUp] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [secret, setSecret] = useState('');
  const [setupCode, setSetupCode] = useState('');
  const [verifyingSetup, setVerifyingSetup] = useState(false);
  const [secretCopied, setSecretCopied] = useState(false);

  // Disable state
  const [disableDialogOpen, setDisableDialogOpen] = useState(false);
  const [disableCode, setDisableCode] = useState('');
  const [disabling, setDisabling] = useState(false);

  const fetchAdmin = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (!res.ok) {
        logoutAdmin();
        return;
      }
      const data = await res.json();
      if (!data.admin) {
        logoutAdmin();
        return;
      }
      setAdminEmail(data.admin.email || '');
      setTwoFactorEnabled(!!data.admin.twoFactorEnabled);
    } catch {
      logoutAdmin();
    } finally {
      setLoading(false);
    }
  }, [logoutAdmin]);

  useEffect(() => {
    fetchAdmin();
  }, [fetchAdmin]);

  const handleSetup = async () => {
    setSettingUp(true);
    try {
      const res = await fetch('/api/admin/2fa/setup', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to generate 2FA secret');
        setSettingUp(false);
        return;
      }
      setQrDataUrl(data.qrDataUrl);
      setSecret(data.secret);
    } catch {
      toast.error('Network error');
    } finally {
      setSettingUp(false);
    }
  };

  const handleVerifySetup = async () => {
    if (setupCode.length !== 6) {
      toast.error('Please enter a 6-digit code');
      return;
    }
    setVerifyingSetup(true);
    try {
      const res = await fetch('/api/admin/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: setupCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Verification failed');
        return;
      }
      toast.success('2FA enabled successfully');
      setTwoFactorEnabled(true);
      setQrDataUrl(null);
      setSecret('');
      setSetupCode('');
    } catch {
      toast.error('Network error');
    } finally {
      setVerifyingSetup(false);
    }
  };

  const handleCopySecret = async () => {
    try {
      await navigator.clipboard.writeText(secret);
      setSecretCopied(true);
      toast.success('Secret copied');
      setTimeout(() => setSecretCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const handleDisable = async () => {
    if (disableCode.length !== 6) {
      toast.error('Please enter your current 6-digit TOTP code');
      return;
    }
    setDisabling(true);
    try {
      const res = await fetch('/api/admin/2fa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: disableCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to disable 2FA');
        return;
      }
      toast.success('2FA disabled');
      setTwoFactorEnabled(false);
      setDisableDialogOpen(false);
      setDisableCode('');
    } catch {
      toast.error('Network error');
    } finally {
      setDisabling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-gray-900 text-white min-h-screen -mx-4 -my-6 px-4 py-6 sm:-mx-6 sm:px-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Two-Factor Authentication</h1>
        <p className="text-gray-400">Secure your admin account with TOTP-based 2FA</p>
      </div>

      {/* Not enabled state */}
      {!twoFactorEnabled && !qrDataUrl && (
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="pt-6 space-y-6">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-900/40 text-amber-400">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-white">2FA Not Enabled</h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Two-factor authentication adds an extra layer of security to your admin account.
                  When enabled, you will need to enter a code from your authenticator app in addition to your password.
                </p>
              </div>
            </div>

            <Button
              onClick={handleSetup}
              disabled={settingUp}
              className="bg-emerald-600 text-white hover:bg-emerald-500 font-medium"
            >
              {settingUp && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Shield className="mr-2 h-4 w-4" />
              Set Up 2FA
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Setup flow - QR code display */}
      {!twoFactorEnabled && qrDataUrl && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-base text-white flex items-center gap-2">
              <QrCode className="h-5 w-5 text-emerald-400" />
              Scan QR Code
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-sm text-gray-400">
              Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.).
            </p>

            <div className="flex justify-center">
              <div className="rounded-xl bg-white p-4 inline-block">
                <img src={qrDataUrl} alt="2FA QR Code" className="h-52 w-52" />
              </div>
            </div>

            <Separator className="bg-gray-700" />

            {/* Manual secret key */}
            <div className="space-y-2">
              <p className="text-xs text-gray-400 font-medium">
                If you cannot scan the QR code, enter this secret key manually:
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded-lg bg-gray-900 border border-gray-700 px-3 py-2 text-sm font-mono text-emerald-400 select-all">
                  {secret}
                </code>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopySecret}
                  className="border-gray-600 hover:bg-gray-700 shrink-0"
                >
                  {secretCopied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4 text-gray-400" />}
                </Button>
              </div>
            </div>

            <Separator className="bg-gray-700" />

            {/* Verify code input */}
            <div className="space-y-3">
              <p className="text-sm text-gray-400">
                Enter the 6-digit code from your authenticator app to verify and enable 2FA:
              </p>
              <div className="flex items-center gap-3 max-w-xs">
                <Input
                  value={setupCode}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setSetupCode(v);
                  }}
                  placeholder="000000"
                  maxLength={6}
                  className="border-gray-600 bg-gray-900 text-white text-center text-lg tracking-widest font-mono placeholder:text-gray-600 focus-visible:ring-emerald-500/40"
                  autoFocus
                />
                <Button
                  onClick={handleVerifySetup}
                  disabled={setupCode.length !== 6 || verifyingSetup}
                  className="bg-emerald-600 text-white hover:bg-emerald-500 font-medium shrink-0"
                >
                  {verifyingSetup && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Verify & Enable
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enabled state */}
      {twoFactorEnabled && (
        <>
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-900/50 text-emerald-400">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-white">2FA Enabled</h3>
                    <Badge className="bg-emerald-900/60 text-emerald-300 border border-emerald-700/50">
                      2FA Enabled
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    Your account is protected with two-factor authentication.
                    You will be required to enter a TOTP code from your authenticator app when logging in.
                  </p>
                  <p className="text-xs text-gray-500">
                    Account: <span className="text-gray-400">{adminEmail}</span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Danger zone */}
          <Card className="bg-gray-800 border-red-900/50">
            <CardHeader>
              <CardTitle className="text-base text-red-400">Danger Zone</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-gray-400">
                Disabling 2FA will reduce the security of your admin account.
                You will need to enter your current TOTP code to confirm.
              </p>
              <Button
                variant="outline"
                onClick={() => setDisableDialogOpen(true)}
                className="border-red-800 text-red-400 hover:bg-red-900/30 hover:text-red-300"
              >
                <ShieldAlert className="mr-2 h-4 w-4" />
                Disable 2FA
              </Button>
            </CardContent>
          </Card>
        </>
      )}

      {/* Disable confirmation dialog */}
      <Dialog open={disableDialogOpen} onOpenChange={setDisableDialogOpen}>
        <DialogContent className="bg-gray-900 border-gray-700 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Disable Two-Factor Authentication</DialogTitle>
            <DialogDescription className="text-gray-400">
              This action will remove 2FA protection from your admin account.
              Enter your current TOTP code to confirm.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Input
              value={disableCode}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, '').slice(0, 6);
                setDisableCode(v);
              }}
              placeholder="6-digit TOTP code"
              maxLength={6}
              className="border-gray-600 bg-gray-800 text-white text-center text-lg tracking-widest font-mono placeholder:text-gray-600 focus-visible:ring-red-500/40"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setDisableDialogOpen(false);
                setDisableCode('');
              }}
              className="text-gray-400 hover:text-white hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDisable}
              disabled={disableCode.length !== 6 || disabling}
              className="bg-red-600 text-white hover:bg-red-500"
            >
              {disabling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Disable
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
