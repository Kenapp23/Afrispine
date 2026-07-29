'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/stores/app';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, Mail } from 'lucide-react';

export function ForgotPasswordPage() {
  const navigate = useAppStore((s) => s.navigate);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }
    setLoading(true);
    // Simulated - no real backend yet
    await new Promise((r) => setTimeout(r, 1500));
    setSent(true);
    setLoading(false);
    toast.success('Reset link sent to your email');
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-emerald-600">AfriSpine</CardTitle>
          <CardDescription>Reset your password</CardDescription>
        </CardHeader>
        {!sent ? (
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  We'll send you a link to reset your password
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
                className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-3 w-3" />
                Back to login
              </button>
            </CardFooter>
          </form>
        ) : (
          <CardContent className="flex flex-col items-center gap-4 py-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
              <Mail className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="font-medium">Check your email</p>
              <p className="mt-1 text-sm text-muted-foreground">
                We sent a password reset link to <span className="font-medium">{email}</span>
              </p>
            </div>
            <button
              onClick={() => navigate('login')}
              className="text-sm text-emerald-600 hover:underline"
            >
              Back to login
            </button>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
