'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/stores/app';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Mail, RefreshCw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function VerifyEmailPage() {
  const navigate = useAppStore((s) => s.navigate);
  const sender = useAppStore((s) => s.sender);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [resending, setResending] = useState(false);

  const email = sender?.email || '';

  useEffect(() => {
    if (!email) {
      navigate('login');
      return;
    }
  }, [email, navigate]);

  const handleResend = useCallback(async () => {
    if (resendCountdown > 0 || resending) return;
    setResending(true);
    try {
      // TODO: Wire to actual resend API when Resend is configured (FIX 7)
      toast.success('Verification email sent!');
      setResendCountdown(60);
    } catch {
      toast.error('Failed to resend email');
    } finally {
      setResending(false);
    }
  }, [resendCountdown, resending]);

  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setTimeout(() => setResendCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCountdown]);

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
            <Mail className="h-7 w-7 text-emerald-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Check your inbox</CardTitle>
          <CardDescription>
            We sent a verification link to <span className="font-medium text-foreground">{email}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Click the link in the email to verify your account. The link expires in 24 hours.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button
            variant="outline"
            onClick={handleResend}
            disabled={resendCountdown > 0 || resending}
            className="w-full"
          >
            {resending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : resendCountdown > 0 ? (
              <RefreshCw className="mr-2 h-4 w-4 opacity-50" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            {resendCountdown > 0
              ? `Resend email in ${resendCountdown}s`
              : 'Resend verification email'}
          </Button>
          <p className="text-sm text-muted-foreground">
            Wrong email?{' '}
            <button
              onClick={() => navigate('login')}
              className="font-medium text-emerald-600 hover:underline"
            >
              Log in with a different account
            </button>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}