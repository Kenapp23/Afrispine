'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/stores/app';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Phone } from 'lucide-react';

export function SignupPage() {
  const navigate = useAppStore((s) => s.navigate);
  const loginAsSender = useAppStore((s) => s.loginAsSender);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const update = (key: string, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName || !form.email || !form.password) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: form.fullName,
          email: form.email,
          phone: form.phone,
          password: form.password,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Signup failed');
        return;
      }
      // Auto-login: the API now returns a token and sets the cookie
      toast.success('Welcome to AfriSpine!');
      const senderWithFullName = {
        ...data.sender,
        fullName: `${data.sender.firstName || ''} ${data.sender.lastName || ''}`.trim(),
      };
      loginAsSender(senderWithFullName, data.token, 'onboarding');
    } catch {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-emerald-600">AfriSpine</CardTitle>
          <CardDescription>Create your account to start sending money</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full name *</Label>
              <Input
                id="fullName"
                placeholder="John Doe"
                value={form.fullName}
                onChange={(e) => update('fullName', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email address *</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-emerald-500" />
                Mobile number
                <span className="text-xs text-muted-foreground">(for WhatsApp alerts)</span>
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+44 7700 900000"
                value={form.phone}
                onChange={(e) => update('phone', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Used for transaction alerts via WhatsApp and account recovery
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                placeholder="At least 8 characters"
                value={form.password}
                onChange={(e) => update('password', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm password *</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Repeat your password"
                value={form.confirmPassword}
                onChange={(e) => update('confirmPassword', e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button
              type="submit"
              className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create account
            </Button>
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => navigate('login')}
                className="font-medium text-emerald-600 hover:underline"
              >
                Log in
              </button>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}