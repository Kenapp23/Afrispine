'use client';

import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/stores/app';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Eye, Video, Building2, ArrowLeft, Phone, Users, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const INTERESTS = ['Music', 'Comedy', 'Film', 'Fashion', 'Sports', 'Education', 'Food', 'Beauty'] as const;

type SignupRole = 'fan' | 'creator' | 'brand' | null;
type FanStep = 1 | 2;

export function SignupPage() {
  const navigate = useAppStore((s) => s.navigate);
  const loginAsSender = useAppStore((s) => s.loginAsSender);
  const [loading, setLoading] = useState(false);
  const [refCode, setRefCode] = useState<string | null>(null);

  // Flow state
  const [role, setRole] = useState<SignupRole>(null);
  const [fanStep, setFanStep] = useState<FanStep>(1);

  // Fan form state
  const [fanName, setFanName] = useState('');
  const [fanPhone, setFanPhone] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  // Capture ?ref= from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref && ref.trim().length > 0) {
      setRefCode(ref.trim().toUpperCase());
    }
  }, []);

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest],
    );
  };

  const handleRoleSelect = (selectedRole: SignupRole) => {
    if (selectedRole === 'creator') {
      navigate('creator-onboard');
      return;
    }
    if (selectedRole === 'brand') {
      navigate('sponsor-landing');
      return;
    }
    setRole('fan');
    setFanStep(1);
  };

  const handleFanStep1Next = () => {
    if (!fanName.trim()) {
      toast.error('Please enter your name');
      return;
    }
    if (!fanPhone.trim()) {
      toast.error('Please enter your phone number');
      return;
    }
    setFanStep(2);
  };

  const handleFanSubmit = async () => {
    if (selectedInterests.length < 1) {
      toast.error('Please pick at least 1 interest');
      return;
    }
    setLoading(true);
    try {
      let res: Response;
      try {
        res = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fullName: fanName.trim(),
            phone: fanPhone.trim(),
            interests: selectedInterests,
            ...(refCode ? { referralCode: refCode } : {}),
          }),
        });
      } catch {
        toast.error('Network error — check your connection');
        return;
      }
      let data: any;
      try {
        data = await res.json();
      } catch {
        toast.error('Server error — please try again');
        return;
      }
      if (!res.ok) {
        toast.error(data.error || 'Signup failed');
        if (data.debug) console.error('[Signup debug]', data.debug);
        return;
      }
      toast.success('Welcome to AfriSpine!');
      const senderWithFullName = {
        ...data.sender,
        fullName: `${data.sender.firstName || ''} ${data.sender.lastName || ''}`.trim(),
      };
      loginAsSender(senderWithFullName, data.token, 'watch');
    } catch {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    if (role === 'fan' && fanStep === 2) {
      setFanStep(1);
      return;
    }
    if (role) {
      setRole(null);
      setFanStep(1);
      return;
    }
    navigate('login');
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <AnimatePresence mode="wait">
          {/* ═══════ ROLE SELECTION ═══════ */}
          {!role && (
            <motion.div
              key="role-select"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="border-0 shadow-lg">
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-2xl font-bold text-emerald-600">
                    Join AfriSpine
                  </CardTitle>
                  <CardDescription className="text-balance">
                    Choose how you want to use the platform
                  </CardDescription>
                  {refCode && (
                    <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-medium text-emerald-700">
                      <Users className="h-3 w-3" />
                      Referred by <span className="font-mono font-bold">{refCode}</span>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="space-y-3 pt-4">
                  {/* Fan card — recommended */}
                  <button
                    type="button"
                    onClick={() => handleRoleSelect('fan')}
                    className="w-full text-left rounded-xl border-2 border-emerald-500 bg-emerald-50/50 p-4 transition-all hover:border-emerald-600 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                        <Eye className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground">Fan</span>
                          <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                            Recommended
                          </span>
                        </div>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          Browse and unlock content
                        </p>
                      </div>
                    </div>
                  </button>

                  {/* Creator card */}
                  <button
                    type="button"
                    onClick={() => handleRoleSelect('creator')}
                    className="w-full text-left rounded-xl border-2 border-muted bg-card p-4 transition-all hover:border-emerald-500 hover:bg-emerald-50/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                        <Video className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-semibold text-foreground">Creator</span>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          Share your content and earn
                        </p>
                      </div>
                    </div>
                  </button>

                  {/* Brand card */}
                  <button
                    type="button"
                    onClick={() => handleRoleSelect('brand')}
                    className="w-full text-left rounded-xl border-2 border-muted bg-card p-4 transition-all hover:border-emerald-500 hover:bg-emerald-50/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-semibold text-foreground">Brand</span>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          Reach African audiences
                        </p>
                      </div>
                    </div>
                  </button>
                </CardContent>
                <CardFooter>
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
              </Card>
            </motion.div>
          )}

          {/* ═══════ FAN FLOW ═══════ */}
          {role === 'fan' && fanStep === 1 && (
            <motion.div
              key="fan-step-1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <button
                    type="button"
                    onClick={goBack}
                    className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </button>
                  <CardTitle className="text-xl font-bold text-emerald-600">
                    Create your Fan account
                  </CardTitle>
                  <CardDescription>Step 1 of 2 — Your details</CardDescription>
                  {refCode && (
                    <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-medium text-emerald-700">
                      <Users className="h-3 w-3" />
                      Referred by <span className="font-mono font-bold">{refCode}</span>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fanName">Full name *</Label>
                    <Input
                      id="fanName"
                      placeholder="John Doe"
                      value={fanName}
                      onChange={(e) => setFanName(e.target.value)}
                      autoFocus
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fanPhone" className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-emerald-500" />
                      Mobile number *
                    </Label>
                    <Input
                      id="fanPhone"
                      type="tel"
                      placeholder="+254 700 000 000"
                      value={fanPhone}
                      onChange={(e) => setFanPhone(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Used for WhatsApp alerts and account recovery
                    </p>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-3">
                  <Button
                    type="button"
                    onClick={handleFanStep1Next}
                    className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
                  >
                    Continue
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
              </Card>
            </motion.div>
          )}

          {role === 'fan' && fanStep === 2 && (
            <motion.div
              key="fan-step-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <button
                    type="button"
                    onClick={goBack}
                    className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </button>
                  <CardTitle className="text-xl font-bold text-emerald-600">
                    Pick your interests
                  </CardTitle>
                  <CardDescription>Step 2 of 2 — Choose what you love (at least 1)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {INTERESTS.map((interest) => {
                      const isSelected = selectedInterests.includes(interest);
                      return (
                        <button
                          key={interest}
                          type="button"
                          onClick={() => toggleInterest(interest)}
                          className={
                            'inline-flex items-center gap-1.5 rounded-full border-2 px-4 py-2 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 ' +
                            (isSelected
                              ? 'border-emerald-500 bg-emerald-600 text-white'
                              : 'border-muted bg-card text-muted-foreground hover:border-emerald-400 hover:text-foreground')
                          }
                        >
                          {isSelected && <Check className="h-3.5 w-3.5" />}
                          {interest}
                        </button>
                      );
                    })}
                  </div>
                  {selectedInterests.length > 0 && (
                    <p className="mt-3 text-xs text-muted-foreground">
                      {selectedInterests.length} interest{selectedInterests.length !== 1 ? 's' : ''} selected
                    </p>
                  )}
                </CardContent>
                <CardFooter className="flex flex-col gap-3">
                  <Button
                    type="button"
                    onClick={handleFanSubmit}
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
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
