'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/stores/app';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, Mail, CheckCircle2, RefreshCw, ShieldCheck } from 'lucide-react';

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function ForgotPasswordPage() {
  const navigate = useAppStore((s) => s.navigate);
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [iconVisible, setIconVisible] = useState(false);

  // Animate icon on step 2
  useEffect(() => {
    if (step === 2) {
      const t = setTimeout(() => setIconVisible(true), 100);
      return () => clearTimeout(t);
    } else {
      setIconVisible(false);
    }
  }, [step]);

  const validateEmail = useCallback((value: string): boolean => {
    if (!value.trim()) {
      setEmailError('Email address is required');
      return false;
    }
    if (!isValidEmail(value)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailError('');
    return true;
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail(email)) return;

    setLoading(true);
    try {
      // Simulated - wire to real API later
      await new Promise((r) => setTimeout(r, 1500));
      toast.success('Password reset link sent to your email');
      setStep(2);
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /* ============ STEP 1: Enter Email ============ */
  if (step === 1) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center pb-2">
            {/* Shield icon for security feel */}
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <ShieldCheck className="h-8 w-8 text-emerald-600" strokeWidth={1.5} />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">Forgot your password?</CardTitle>
            <CardDescription className="text-base mt-1">
              No worries. Enter your email and we'll send you a reset link.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fp-email">Email address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="fp-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailError) validateEmail(e.target.value);
                    }}
                    onBlur={() => validateEmail(email)}
                    className={`pl-10 ${emailError ? 'border-red-400 focus-visible:ring-red-400' : ''}`}
                    autoFocus
                  />
                </div>
                {emailError && (
                  <p className="text-xs text-red-500 mt-1">{emailError}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1.5">
                  We'll send a password reset link to this address.
                </p>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-3">
              <Button
                type="submit"
                className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
                disabled={loading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send reset link
              </Button>
              <button
                type="button"
                onClick={() => navigate('login')}
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to login
              </button>
            </CardFooter>
          </form>
        </Card>
      </div>
    );
  }

  /* ============ STEP 2: Check Email Confirmation ============ */
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="pb-2">
          {/* Animated mail icon with emerald background circle */}
          <div className="mx-auto mb-5">
            <div
              className={`relative mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100 transition-all duration-700 ${
                iconVisible ? 'scale-100 opacity-100' : 'scale-75 opacity-0'
              }`}
            >
              <div
                className="absolute inset-0 rounded-full bg-emerald-200/50 animate-ping"
                style={{ animationDuration: '3s' }}
              />
              <Mail className="relative h-11 w-11 text-emerald-600" strokeWidth={1.5} />
            </div>
          </div>

          <CardTitle className="text-2xl font-bold tracking-tight">Check your email</CardTitle>
          <CardDescription className="text-base mt-1">
            We sent a password reset link to
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 pb-2">
          <p className="font-semibold text-foreground text-sm bg-muted/50 rounded-lg px-3 py-2 inline-block">
            {email}
          </p>

          <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 text-left">
            <p className="text-sm font-medium text-emerald-700 mb-2">What to do next</p>
            <div className="space-y-2">
              <div className="flex items-start gap-2.5">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[11px] font-bold text-white mt-0.5">
                  1
                </div>
                <p className="text-sm text-foreground">Open your email inbox (and spam folder)</p>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[11px] font-bold text-white mt-0.5">
                  2
                </div>
                <p className="text-sm text-foreground">Click the "Reset password" link in the email</p>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[11px] font-bold text-white mt-0.5">
                  3
                </div>
                <p className="text-sm text-foreground">Create a new password and log in</p>
              </div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            The link expires in 1 hour. If you don't see the email, check your spam folder.
          </p>
        </CardContent>

        <CardFooter className="flex flex-col gap-3 pt-0">
          <Button
            variant="outline"
            onClick={() => {
              setStep(1);
              setEmail('');
            }}
            className="w-full border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Try a different email
          </Button>

          <button
            onClick={() => navigate('login')}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to login
          </button>
        </CardFooter>
      </Card>
    </div>
  );
}
