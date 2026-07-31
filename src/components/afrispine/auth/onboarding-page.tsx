'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/stores/app';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Check, ArrowLeft, ArrowRight, PartyPopper, Phone, User, Globe, Banknote } from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const SEND_COUNTRIES = [
  {
    code: 'US',
    flag: '\u{1F1FA}\u{1F1F8}',
    name: 'United States',
    currency: 'USD ($)',
    desc: 'Send dollars quickly and securely',
  },
  {
    code: 'GB',
    flag: '\u{1F1EC}\u{1F1E7}',
    name: 'United Kingdom',
    currency: 'GBP (£)',
    desc: 'Send pounds to Africa with great rates',
  },
  {
    code: 'CA',
    flag: '\u{1F1E8}\u{1F1E6}',
    name: 'Canada',
    currency: 'CAD (C$)',
    desc: 'Send Canadian dollars home',
  },
];

const RECEIVE_COUNTRIES = [
  {
    code: 'KE',
    flag: '\u{1F1F0}\u{1F1EA}',
    name: 'Kenya',
    currency: 'KES',
    methods: ['M-Pesa', 'Airtel Money', 'Bank Transfer'],
  },
  {
    code: 'NG',
    flag: '\u{1F1F3}\u{1F1EC}',
    name: 'Nigeria',
    currency: 'NGN',
    methods: ['Bank Transfer', 'Cash Pickup'],
  },
  {
    code: 'GH',
    flag: '\u{1F1EC}\u{1F1ED}',
    name: 'Ghana',
    currency: 'GHS',
    methods: ['Mobile Money', 'Bank Transfer'],
  },
  {
    code: 'UG',
    flag: '\u{1F1FA}\u{1F1EC}',
    name: 'Uganda',
    currency: 'UGX',
    methods: ['MTN MoMo', 'Airtel Money', 'Bank Transfer'],
  },
  {
    code: 'TZ',
    flag: '\u{1F1F9}\u{1F1FF}',
    name: 'Tanzania',
    currency: 'TZS',
    methods: ['M-Pesa', 'Tigo Pesa', 'Bank Transfer'],
  },
  {
    code: 'ZA',
    flag: '\u{1F1FF}\u{1F1E6}',
    name: 'South Africa',
    currency: 'ZAR',
    methods: ['Bank Transfer', 'Cash Pickup'],
  },
];

const REFERRAL_SOURCES = [
  'Google Search',
  'Social Media (Facebook, X, Instagram)',
  'Friend or Family',
  'News Article',
  'Community Event',
  'Other',
];

const STEP_LABELS = ['Send country', 'Receive country', 'Your details', 'All done'];
const TOTAL_STEPS = 4;

/* ------------------------------------------------------------------ */
/*  Confetti emoji particle                                            */
/* ------------------------------------------------------------------ */

function ConfettiParticle({ emoji, delay, left }: { emoji: string; delay: number; left: string }) {
  return (
    <span
      className="pointer-events-none absolute text-2xl animate-bounce"
      style={{
        left,
        top: '10%',
        animationDelay: `${delay}ms`,
        animationDuration: '1.4s',
        animationIterationCount: 'infinite',
        animationDirection: 'alternate',
        opacity: 0.85,
      }}
    >
      {emoji}
    </span>
  );
}

const CONFETTI_EMOJIS = ['\u{1F389}', '\u{2728}', '\u{1F38A}', '\u{1F381}', '\u{2B50}', '\u{1F388}', '\u{1F525}', '\u{1F31F}'];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function OnboardingPage() {
  const navigate = useAppStore((s) => s.navigate);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedSendCountry, setSelectedSendCountry] = useState<string>('');
  const [selectedReceiveCountry, setSelectedReceiveCountry] = useState<string>('');
  const [selectedDeliveryMethod, setSelectedDeliveryMethod] = useState<string>('');
  const [personal, setPersonal] = useState({
    fullName: '',
    phone: '',
    referral: '',
  });
  const [completing, setCompleting] = useState(false);

  const progressPct = Math.round(((step + 1) / TOTAL_STEPS) * 100);

  const receiveCountry = RECEIVE_COUNTRIES.find((c) => c.code === selectedReceiveCountry);

  /* --- Validation --- */
  const canGoNext =
    step === 0 ? !!selectedSendCountry :
    step === 1 ? !!selectedReceiveCountry && !!selectedDeliveryMethod :
    step === 2 ? !!personal.fullName.trim() && !!personal.phone.trim() :
    false;

  const handleNext = useCallback(async () => {
    if (step === 2) {
      // Completing onboarding
      if (!personal.fullName.trim() || !personal.phone.trim()) {
        toast.error('Please fill in all required fields');
        return;
      }
      setLoading(true);
      await new Promise((r) => setTimeout(r, 1500));
      setLoading(false);
      setCompleting(true);
      setStep(3);
      return;
    }
    if (step === 3) {
      navigate('dashboard');
      return;
    }
    setStep((s) => s + 1);
  }, [step, personal, navigate]);

  const handleBack = useCallback(() => {
    if (step === 0) {
      navigate('login');
      return;
    }
    setStep((s) => s - 1);
  }, [step, navigate]);

  /* Auto-redirect after completion */
  useEffect(() => {
    if (completing) {
      const t = setTimeout(() => navigate('dashboard'), 4000);
      return () => clearTimeout(t);
    }
  }, [completing, navigate]);

  /* ---------------------------------------------------------------- */

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl">
        {/* Progress bar */}
        <div className="mb-2">
          <Progress value={progressPct} className="h-1.5 bg-emerald-100 [&>div]:bg-emerald-600" />
        </div>

        {/* Step indicators with numbered circles and connecting lines */}
        <div className="flex items-center justify-center gap-0 mb-8">
          {STEP_LABELS.map((label, i) => {
            const isDone = i < step;
            const isActive = i === step;
            const isFuture = i > step;

            return (
              <React.Fragment key={label}>
                <div className="flex flex-col items-center gap-1.5">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-bold transition-all duration-300 ${
                      isDone
                        ? 'border-emerald-600 bg-emerald-600 text-white'
                        : isActive
                          ? 'border-emerald-600 bg-white text-emerald-600 ring-4 ring-emerald-100'
                          : 'border-muted-foreground/25 bg-white text-muted-foreground'
                    }`}
                  >
                    {isDone ? <Check className="h-4 w-4" /> : i + 1}
                  </div>
                  <span
                    className={`text-[11px] font-medium transition-colors hidden sm:block ${
                      isActive ? 'text-emerald-700' : isDone ? 'text-emerald-600' : 'text-muted-foreground'
                    }`}
                  >
                    {label}
                  </span>
                </div>
                {i < STEP_LABELS.length - 1 && (
                  <div
                    className={`h-0.5 w-6 sm:w-12 transition-colors duration-300 ${
                      i < step ? 'bg-emerald-600' : 'bg-muted-foreground/15'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* ============== STEP 0: Select Send Country ============== */}
        {step === 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 mb-1">
                <Globe className="h-5 w-5 text-emerald-600" />
                <CardTitle>Where are you sending from?</CardTitle>
              </div>
              <CardDescription>Select the country you'll be sending money from</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {SEND_COUNTRIES.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => setSelectedSendCountry(c.code)}
                  className={`w-full rounded-xl border-2 p-4 text-left transition-all duration-200 ${
                    selectedSendCountry === c.code
                      ? 'border-emerald-600 bg-emerald-50 shadow-sm'
                      : 'border-transparent bg-muted/40 hover:border-emerald-200 hover:bg-emerald-50/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl leading-none">{c.flag}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-foreground">{c.name}</p>
                        <span className="text-xs font-medium text-muted-foreground">{c.currency}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">{c.desc}</p>
                    </div>
                    {selectedSendCountry === c.code && (
                      <Check className="h-5 w-5 shrink-0 text-emerald-600" />
                    )}
                  </div>
                </button>
              ))}
            </CardContent>
            <CardFooter className="gap-2">
              <Button variant="outline" onClick={handleBack} className="flex-1">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button
                onClick={handleNext}
                disabled={!canGoNext}
                className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700"
              >
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* ============== STEP 1: Select Receive Country + Delivery ============== */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 mb-1">
                <Banknote className="h-5 w-5 text-emerald-600" />
                <CardTitle>Where should the money go?</CardTitle>
              </div>
              <CardDescription>Select the destination country and delivery method</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Country grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {RECEIVE_COUNTRIES.map((c) => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => {
                      setSelectedReceiveCountry(c.code);
                      setSelectedDeliveryMethod('');
                    }}
                    className={`flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 transition-all duration-200 ${
                      selectedReceiveCountry === c.code
                        ? 'border-emerald-600 bg-emerald-50 shadow-sm'
                        : 'border-transparent bg-muted/40 hover:border-emerald-200 hover:bg-emerald-50/50'
                    }`}
                  >
                    <span className="text-2xl leading-none">{c.flag}</span>
                    <span className="text-sm font-medium text-foreground">{c.name}</span>
                    <span className="text-[11px] text-muted-foreground">{c.currency}</span>
                    {selectedReceiveCountry === c.code && (
                      <Check className="h-4 w-4 text-emerald-600" />
                    )}
                  </button>
                ))}
              </div>

              {/* Delivery method */}
              {receiveCountry && (
                <div className="space-y-2 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
                  <Label className="text-sm font-medium">Delivery method</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {receiveCountry.methods.map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setSelectedDeliveryMethod(method)}
                        className={`rounded-lg border-2 px-4 py-3 text-left text-sm font-medium transition-all duration-200 ${
                          selectedDeliveryMethod === method
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                            : 'border-muted bg-white text-foreground hover:border-emerald-200'
                        }`}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="gap-2">
              <Button variant="outline" onClick={handleBack} className="flex-1">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button
                onClick={handleNext}
                disabled={!canGoNext}
                className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700"
              >
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* ============== STEP 2: Personal Details ============== */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 mb-1">
                <User className="h-5 w-5 text-emerald-600" />
                <CardTitle>Tell us about yourself</CardTitle>
              </div>
              <CardDescription>Help us personalize your AfriSpine experience</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="onb-fullname">Full name <span className="text-red-500">*</span></Label>
                <Input
                  id="onb-fullname"
                  placeholder="e.g. Amara Okafor"
                  value={personal.fullName}
                  onChange={(e) => setPersonal({ ...personal, fullName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="onb-phone">
                  <span className="inline-flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5" />
                    Phone number <span className="text-red-500">*</span>
                  </span>
                </Label>
                <Input
                  id="onb-phone"
                  placeholder="+44 7700 000000"
                  value={personal.phone}
                  onChange={(e) => setPersonal({ ...personal, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>How did you hear about us?</Label>
                <Select
                  value={personal.referral}
                  onValueChange={(v) => setPersonal({ ...personal, referral: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an option (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {REFERRAL_SOURCES.map((src) => (
                      <SelectItem key={src} value={src}>
                        {src}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter className="gap-2">
              <Button variant="outline" onClick={handleBack} className="flex-1">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button
                onClick={handleNext}
                disabled={!canGoNext || loading}
                className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700"
              >
                {loading ? 'Saving...' : 'Complete setup'}
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* ============== STEP 3: Completion ============== */}
        {step === 3 && (
          <Card className="overflow-hidden relative">
            {/* Confetti emojis */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {CONFETTI_EMOJIS.map((emoji, i) => (
                <ConfettiParticle
                  key={i}
                  emoji={emoji}
                  delay={i * 150}
                  left={`${8 + i * 12}%`}
                />
              ))}
            </div>

            <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center relative">
              {/* Animated checkmark circle */}
              <div className="relative mb-6">
                <div className="absolute inset-0 rounded-full bg-emerald-400/20 animate-ping" style={{ animationDuration: '2s' }} />
                <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-emerald-600 shadow-lg shadow-emerald-200">
                  <Check className="h-10 w-10 text-white" strokeWidth={3} />
                </div>
              </div>

              <h2 className="text-2xl font-bold tracking-tight text-foreground mb-2">
                You're all set!{' '}
                <PartyPopper className="inline-block h-6 w-6" />
              </h2>
              <p className="text-muted-foreground max-w-xs mb-6">
                Your AfriSpine account is ready. Start sending money to your loved ones across Africa with the best rates.
              </p>

              {/* Summary of selections */}
              <div className="w-full rounded-xl border bg-muted/30 p-4 text-left space-y-2 mb-6">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Your profile</p>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Name</span>
                  <span className="font-medium">{personal.fullName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Sending from</span>
                  <span className="font-medium">
                    {SEND_COUNTRIES.find((c) => c.code === selectedSendCountry)?.flag}{' '}
                    {SEND_COUNTRIES.find((c) => c.code === selectedSendCountry)?.name}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Sending to</span>
                  <span className="font-medium">
                    {RECEIVE_COUNTRIES.find((c) => c.code === selectedReceiveCountry)?.flag}{' '}
                    {RECEIVE_COUNTRIES.find((c) => c.code === selectedReceiveCountry)?.name}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Via</span>
                  <span className="font-medium">{selectedDeliveryMethod}</span>
                </div>
              </div>

              <Button
                onClick={() => navigate('dashboard')}
                className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
                size="lg"
              >
                Go to Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <p className="mt-3 text-xs text-muted-foreground">
                Redirecting automatically in a few seconds...
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
