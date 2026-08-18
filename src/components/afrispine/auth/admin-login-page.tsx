'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/stores/app';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react';

/**
 * Two-step admin login:
 *   Step 1 — email + password (sets session cookie on backend)
 *   Step 2 — TOTP code if 2FA is enabled (v1: session already set, verified client-side)
 */
export function AdminLoginPage() {
  const loginAsAdmin = useAppStore((s) => s.loginAsAdmin);
  const logoutAdmin = useAppStore((s) => s.logoutAdmin);
  const navigate = useAppStore((s) => s.navigate);

  // Step management
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });

  // Step 2: 2FA
  const [totpCode, setTotpCode] = useState('');
  const [verifying, setVerifying] = useState(false);

  const update = (key: string, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  /** Step 1: Password login */
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      toast.error('Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email.trim(), password: form.password }),
      });
      let data: any;
      try {
        data = await res.json();
      } catch {
        toast.error('Server error \u2014 please try again');
        return;
      }
      if (!res.ok) {
        toast.error(data.error || 'Admin login failed');
        if (data.debug) console.error('[AdminLogin debug]', data.debug);
        return;
      }

      // Session cookie is now set. Check if 2FA is required.
      const twoFactorEnabled = !!data.admin?.twoFactorEnabled;
      if (twoFactorEnabled) {
        // Store admin info temporarily, move to step 2
        loginAsAdmin(data.admin, data.token, 'admin-login');
        setStep(2);
      } else {
        loginAsAdmin(data.admin, data.token);
        toast.success('Welcome back, Admin');
      }
    } catch {
      toast.error('Network error \u2014 check your connection');
    } finally {
      setLoading(false);
    }
  };

  /** Step 2: TOTP verification */
  const handleTotpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (totpCode.length !== 6) {
      toast.error('Please enter a 6-digit code');
      return;
    }
    setVerifying(true);
    try {
      const res = await fetch('/api/admin/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: totpCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Invalid code. Please try again.');
        return;
      }
      // 2FA verified — navigate to dashboard
      toast.success('Welcome back, Admin');
      navigate('admin-dashboard');
    } catch {
      toast.error('Network error');
    } finally {
      setVerifying(false);
    }
  };

  /** Cancel 2FA step — logout and go back to step 1 */
  const handleCancel2fa = () => {
    logoutAdmin();
    setStep(1);
    setTotpCode('');
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Admin-only top bar */}
      <header className="border-b border-white/10">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <img
              src="/afrispine-logo.jpg"
              alt="AfriSpine"
              className="h-8 w-auto rounded-md object-contain brightness-0 invert"
            />
            <span className="text-sm font-semibold text-white tracking-wide">
              AfriSpine <span className="text-emerald-400">Admin</span>
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              if (step === 2) {
                handleCancel2fa();
              } else {
                navigate('landing');
              }
            }}
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            &larr; {step === 2 ? 'Back to login' : 'Back to main site'}
          </button>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="w-full max-w-sm space-y-8">
          {/* ─── Step 1: Password ─── */}
          {step === 1 && (
            <>
              {/* Icon + heading */}
              <div className="text-center space-y-3">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 ring-1 ring-white/10">
                  <Lock className="h-7 w-7 text-emerald-400" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">Admin Console</h1>
                  <p className="mt-1 text-sm text-gray-500">
                    Restricted access &mdash; authorised personnel only
                  </p>
                </div>
              </div>

              {/* Form card */}
              <div className="rounded-xl bg-white/5 ring-1 ring-white/10 p-6 space-y-5">
                <form onSubmit={handlePasswordSubmit} className="space-y-5">
                  <div className="space-y-1.5">
                    <Label htmlFor="admin-email" className="text-gray-400 text-xs font-medium">
                      Email
                    </Label>
                    <Input
                      id="admin-email"
                      type="email"
                      value={form.email}
                      onChange={(e) => update('email', e.target.value)}
                      autoComplete="off"
                      autoCorrect="off"
                      spellCheck={false}
                      className="border-white/10 bg-white/5 text-white placeholder:text-gray-600 focus-visible:ring-emerald-500/40"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="admin-password" className="text-gray-400 text-xs font-medium">
                      Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="admin-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter password"
                        value={form.password}
                        onChange={(e) => update('password', e.target.value)}
                        autoComplete="off"
                        autoCorrect="off"
                        spellCheck={false}
                        className="border-white/10 bg-white/5 text-white placeholder:text-gray-600 focus-visible:ring-emerald-500/40 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-emerald-600 text-white hover:bg-emerald-500 font-medium"
                    disabled={loading}
                  >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Sign in
                  </Button>
                </form>
              </div>

              {/* Warning */}
              <p className="text-center text-[11px] text-gray-600 leading-relaxed">
                This is a restricted system. All access attempts are logged and monitored.
              </p>
            </>
          )}

          {/* ─── Step 2: 2FA Verification ─── */}
          {step === 2 && (
            <>
              {/* Icon + heading */}
              <div className="text-center space-y-3">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-900/30 ring-1 ring-emerald-700/30">
                  <ShieldCheck className="h-7 w-7 text-emerald-400" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">Two-Factor Authentication</h1>
                  <p className="mt-1 text-sm text-gray-500">
                    Enter the 6-digit code from your authenticator app
                  </p>
                </div>
              </div>

              {/* TOTP input card */}
              <div className="rounded-xl bg-white/5 ring-1 ring-white/10 p-6 space-y-5">
                <form onSubmit={handleTotpSubmit} className="space-y-5">
                  <div className="space-y-1.5">
                    <Label htmlFor="totp-code" className="text-gray-400 text-xs font-medium">
                      Authentication Code
                    </Label>
                    <Input
                      id="totp-code"
                      type="text"
                      inputMode="numeric"
                      value={totpCode}
                      onChange={(e) => {
                        const v = e.target.value.replace(/\D/g, '').slice(0, 6);
                        setTotpCode(v);
                      }}
                      placeholder="000000"
                      maxLength={6}
                      autoFocus
                      autoComplete="one-time-code"
                      className="border-white/10 bg-white/5 text-white text-center text-2xl tracking-[0.5em] font-mono placeholder:text-gray-600 placeholder:tracking-widest focus-visible:ring-emerald-500/40"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-emerald-600 text-white hover:bg-emerald-500 font-medium"
                    disabled={totpCode.length !== 6 || verifying}
                  >
                    {verifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Verify
                  </Button>
                </form>

                <button
                  type="button"
                  onClick={handleCancel2fa}
                  className="block w-full text-center text-xs text-gray-500 hover:text-gray-300 transition-colors py-1"
                >
                  Cancel and go back
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
