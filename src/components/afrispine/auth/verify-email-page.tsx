'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/stores/app';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Mail, RefreshCw, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

function maskEmail(email: string): string {
  const [user, domain] = email.split('@');
  if (!user || !domain) return email;
  if (user.length <= 2) return `${user[0]}***@${domain}`;
  return `${user[0]}${user[1]}${'*'.repeat(user.length - 2)}@${domain}`;
}

export function VerifyEmailPage() {
  const navigate = useAppStore((s) => s.navigate);
  const sender = useAppStore((s) => s.sender);
  const viewParams = useAppStore((s) => s.viewParams);

  const [resendCountdown, setResendCountdown] = useState(0);
  const [resending, setResending] = useState(false);
  const [iconPulse, setIconPulse] = useState(false);

  const email = sender?.email || viewParams?.email || '';
  const displayEmail = email || 'yo***@example.com';

  useEffect(() => {
    if (!email) {
      navigate('login');
      return;
    }
  }, [email, navigate]);

  // Subtle pulse animation on mount
  useEffect(() => {
    const timer = setTimeout(() => setIconPulse(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleResend = useCallback(async () => {
    if (resendCountdown > 0 || resending) return;
    setResending(true);
    try {
      // TODO: Wire to actual resend API when Resend is configured
      await new Promise((r) => setTimeout(r, 1200));
      toast.success('Verification email sent successfully!');
      setResendCountdown(60);
    } catch {
      toast.error('Failed to resend email. Please try again.');
    } finally {
      setResending(false);
    }
  }, [resendCountdown, resending]);

  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setTimeout(() => setResendCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCountdown]);

  const steps = [
    { num: 1, label: 'Open your email', desc: 'Check your inbox and spam folder' },
    { num: 2, label: 'Click the verification link', desc: 'The link expires in 24 hours' },
    { num: 3, label: 'Start sending money', desc: 'Your account will be ready to go' },
  ];

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="pb-2">
          {/* Large animated mail icon with emerald background circle */}
          <div className="mx-auto mb-5">
            <div
              className={`relative mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100 transition-all duration-700 ${iconPulse ? 'scale-100 opacity-100' : 'scale-75 opacity-0'}`}
            >
              <div className="absolute inset-0 rounded-full bg-emerald-200/50 animate-ping" style={{ animationDuration: '3s' }} />
              <Mail className="relative h-11 w-11 text-emerald-600" strokeWidth={1.5} />
            </div>
          </div>

          <CardTitle className="text-2xl font-bold tracking-tight">
            Check your email
          </CardTitle>
          <CardDescription className="text-base mt-1">
            We sent a verification link to{' '}
            <span className="font-semibold text-foreground">
              {email ? maskEmail(email) : displayEmail}
            </span>
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 pb-4">
          {/* Steps list */}
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4">
            <p className="mb-3 text-sm font-medium text-emerald-700">How to verify your account</p>
            <div className="space-y-3">
              {steps.map((step) => (
                <div key={step.num} className="flex items-start gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
                    {step.num}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-foreground">{step.label}</p>
                    <p className="text-xs text-muted-foreground">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            Didn't receive the email? Check your spam/junk folder or resend below.
          </p>
        </CardContent>

        <CardFooter className="flex flex-col gap-3 pt-0">
          <Button
            variant="outline"
            onClick={handleResend}
            disabled={resendCountdown > 0 || resending}
            className="w-full border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
          >
            {resending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : resendCountdown > 0 ? (
              <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-500" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            {resendCountdown > 0
              ? `Email sent · Resend in ${resendCountdown}s`
              : 'Resend verification email'}
          </Button>

          <button
            onClick={() => navigate('login')}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Go back to login
          </button>
        </CardFooter>
      </Card>
    </div>
  );
}
