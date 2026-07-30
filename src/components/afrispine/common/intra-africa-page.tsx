'use client';

import React from 'react';
import { useAppStore } from '@/stores/app';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowRight,
  Globe,
  Clock,
  DollarSign,
  CheckCircle,
  ChevronRight,
  Zap,
  Shield,
  ArrowLeftRight,
  Activity,
  Send,
  Loader2,
  Users,
  Landmark,
  Smartphone,
} from 'lucide-react';

const COUNTRIES = [
  'Kenya', 'Nigeria', 'Ghana', 'South Africa', 'Uganda', 'Tanzania',
  'Rwanda', 'Egypt', 'Senegal', 'Ivory Coast', 'Cameroon', 'Mali',
  'Burkina Faso', 'Benin', 'Togo', 'Guinea', 'Niger', 'Gambia',
];

const CORRIDORS = [
  { from: 'Kenya', to: 'Uganda', method: 'MTN MoMo / Bank', eta: '~30 min', fee: '1.5%' },
  { from: 'Kenya', to: 'Tanzania', method: 'M-Pesa / Bank', eta: '~30 min', fee: '1.5%' },
  { from: 'Kenya', to: 'Rwanda', method: 'Bank / MoMo', eta: '~30 min', fee: '1.5%' },
  { from: 'Nigeria', to: 'Ghana', method: 'Bank Transfer', eta: '~2 hrs', fee: '1.5%' },
  { from: 'Ghana', to: 'Nigeria', method: 'Bank Transfer', eta: '~2 hrs', fee: '1.5%' },
  { from: 'South Africa', to: 'Kenya', method: 'Bank Transfer', eta: '~1 hr', fee: '1.5%' },
  { from: 'South Africa', to: 'Nigeria', method: 'Bank Transfer', eta: '~2 hrs', fee: '1.5%' },
  { from: 'Egypt', to: 'Kenya', method: 'Bank Transfer', eta: '~2 hrs', fee: '1.5%' },
];

const PREFERRED_CORRIDORS = CORRIDORS.map(c => `${c.from} → ${c.to}`);

export function IntraAfricaPage() {
  const navigate = useAppStore((s) => s.navigate);
  const [email, setEmail] = React.useState('');
  const [fullName, setFullName] = React.useState('');
  const [country, setCountry] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [preferredCorridor, setPreferredCorridor] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);
  const [error, setError] = React.useState('');
  const [regCount, setRegCount] = React.useState(0);

  // Fetch registration count
  React.useEffect(() => {
    fetch('/api/markets/intra-africa/count')
      .then(r => r.json())
      .then(d => setRegCount(d.total || 0))
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/markets/intra-africa/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, fullName, country, phone, preferredCorridor }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Success state
  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
        <div className="max-w-lg text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
            <CheckCircle className="h-8 w-8 text-amber-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            You&apos;re on the list.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
            We&apos;ll notify you as soon as Intra-Africa corridors go live via PAPSS.
            You&apos;ll be among the first to send money across African currencies
            without USD conversion — local currency in, local currency out.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              size="lg"
              onClick={() => navigate('signup')}
              className="bg-emerald-600 text-white hover:bg-emerald-700"
            >
              Create full account
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('landing')}
            >
              Back to home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-amber-900 via-amber-800 to-orange-900 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 h-64 w-64 rounded-full bg-amber-400 blur-3xl" />
          <div className="absolute bottom-10 right-10 h-96 w-96 rounded-full bg-orange-400 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:py-36">
          <div className="mx-auto max-w-3xl text-center">
            <Badge className="mb-6 bg-amber-400/20 text-amber-200 border-amber-400/30 hover:bg-amber-400/30 px-4 py-1.5 text-sm">
              <Globe className="mr-1.5 h-3.5 w-3.5" />
              Coming Soon — Pan-African Payment Infrastructure
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl leading-tight">
              Send Money Within Africa
              <span className="block text-amber-300 mt-2">No USD conversion needed</span>
            </h1>
            <p className="mt-6 text-lg text-amber-100 leading-relaxed max-w-2xl mx-auto">
              AfriSpine is integrating with <strong className="text-white">PAPSS</strong> — the
              Pan-African Payment and Settlement System backed by the African Union and Afreximbank.
              Move money between 18 African countries in local currencies, instantly.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <a href="#register" className="inline-flex items-center justify-center rounded-lg bg-amber-400 px-6 py-3 text-sm font-semibold text-amber-950 hover:bg-amber-300 transition-colors">
                Register your interest
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
              <Button
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10"
                onClick={() => window.open('https://papss.com', '_blank')}
              >
                Learn about PAPSS
              </Button>
            </div>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-amber-200">
              <span className="flex items-center gap-1.5">
                <Globe className="h-4 w-4" />
                18 African countries
              </span>
              <span className="flex items-center gap-1.5">
                <Zap className="h-4 w-4" />
                Near-instant settlement
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                {regCount > 0 ? `${regCount.toLocaleString()} registered` : 'Registering now'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Why Intra-Africa */}
      <section className="bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Why Intra-Africa payments matter
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              The African Continental Free Trade Area (AfCFTA) is creating the world&apos;s largest free trade zone.
              Payments need to keep up.
            </p>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: DollarSign,
                title: 'No USD conversion costs',
                desc: 'Today, sending KES from Kenya to UGX in Uganda requires converting to USD and back. That costs 3–5% in hidden FX spread. PAPSS eliminates this by settling directly in local currencies.',
              },
              {
                icon: Zap,
                title: 'Near-instant settlement',
                desc: 'PAPSS provides T+0 to T+1 settlement between participating central banks. Money that used to take 3–5 business days via correspondent banks arrives in minutes.',
              },
              {
                icon: Globe,
                title: '18 countries at launch',
                desc: 'Kenya, Nigeria, Ghana, South Africa, Uganda, Tanzania, Rwanda, Egypt, Senegal, Ivory Coast, and more. PAPSS is expanding rapidly across the continent.',
              },
              {
                icon: Shield,
                title: 'Backed by African Union',
                desc: 'PAPSS is owned by Afreximbank and endorsed by the African Central Bank Governors. It is the official payment infrastructure for the African Continental Free Trade Area.',
              },
              {
                icon: Landmark,
                title: 'Via Ecobank partnership',
                desc: 'AfriSpine routes through our sponsoring bank partner Ecobank, giving us access to 33+ African countries with local banking licenses and compliance coverage.',
              },
              {
                icon: Smartphone,
                title: 'Mobile money + bank',
                desc: 'Send to M-Pesa, MTN MoMo, or bank accounts. Recipients don\'t need an AfriSpine account — just their phone number or bank details.',
              },
            ].map((item) => (
              <div key={item.title} className="rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-amber-100">
                  <item.icon className="h-6 w-6 text-amber-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Planned Corridors */}
      <section className="bg-gray-50 py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Planned corridors
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              First corridors launching soon. More added every quarter.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="bg-amber-600 text-white">
                  <th className="px-4 py-3 font-semibold">Corridor</th>
                  <th className="px-4 py-3 font-semibold">Method</th>
                  <th className="px-4 py-3 font-semibold">Delivery</th>
                  <th className="px-4 py-3 font-semibold">Fee</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="border border-gray-200">
                {CORRIDORS.map((c, i) => (
                  <tr key={c.from + c.to} className={`${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'} border-b border-gray-100`}>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      <ArrowLeftRight className="inline h-3.5 w-3.5 text-amber-500 mr-2" />
                      {c.from} → {c.to}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{c.method}</td>
                    <td className="px-4 py-3 text-gray-600">{c.eta}</td>
                    <td className="px-4 py-3 text-gray-600">{c.fee}</td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary" className="text-[10px] bg-amber-100 text-amber-700 hover:bg-amber-100 border-0">
                        Coming Soon
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            More corridors added as PAPSS onboards additional central banks.
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              How it will work
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              From registration to first transfer — a seamless path for African businesses and individuals.
            </p>
          </div>
          <div className="relative">
            <div className="absolute left-8 top-0 bottom-0 hidden sm:block w-px bg-gradient-to-b from-amber-300 via-emerald-300 to-amber-300" />
            <div className="space-y-8">
              {[
                {
                  step: '01',
                  title: 'Register your interest',
                  desc: 'No account needed yet. Just your email and preferred corridor. We\'ll notify you the moment your route goes live so you can be among the first to send.',
                  cta: 'Register now',
                },
                {
                  step: '02',
                  title: 'Create your AfriSpine account',
                  desc: 'When corridors launch, complete KYC verification from your phone. AfriSpine handles compliance with central bank requirements across all participating countries.',
                  cta: 'Coming soon',
                },
                {
                  step: '03',
                  title: 'Send in your local currency',
                  desc: 'Pay in KES, NGN, GHS, ZAR, or any supported currency. PAPSS settles directly between central banks — no USD intermediary, no double conversion fees.',
                  cta: 'Coming soon',
                },
                {
                  step: '04',
                  title: 'Recipient gets paid instantly',
                  desc: 'Money arrives in the recipient\'s local currency via bank transfer or mobile money. M-Pesa, MTN MoMo, bank accounts — whatever they already use.',
                  cta: 'Coming soon',
                },
              ].map((item, idx) => (
                <div key={item.step} className="relative flex gap-6 sm:gap-8">
                  <div className="relative z-10 flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-amber-500 text-white font-bold text-lg shadow-lg">
                    {item.step}
                  </div>
                  <div className="flex-1 pb-2">
                    <h3 className="text-xl font-semibold text-gray-900">{item.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                    {idx === 0 ? (
                      <a href="#register" className="mt-3 inline-flex items-center text-sm font-medium text-amber-600 hover:text-amber-700">
                        {item.cta}
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </a>
                    ) : (
                      <span className="mt-3 inline-flex items-center text-sm text-muted-foreground">
                        <Clock className="mr-1 h-3.5 w-3.5" />
                        {item.cta}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Registration Form */}
      <section id="register" className="bg-amber-50 py-20 sm:py-24">
        <div className="mx-auto max-w-xl px-4 sm:px-6">
          <div className="rounded-2xl bg-white shadow-xl border border-amber-100 p-8 sm:p-10">
            <div className="text-center mb-8">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
                <Send className="h-7 w-7 text-amber-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                Register for Intra-Africa updates
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                No account needed. We&apos;ll email you when your corridor goes live.
              </p>
              {regCount > 0 && (
                <p className="mt-3 text-sm text-amber-600 font-medium">
                  <Activity className="inline h-3.5 w-3.5 mr-1" />
                  {regCount.toLocaleString()} people already registered
                </p>
              )}
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="john@example.com"
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white"
                  >
                    <option value="">Select country</option>
                    {COUNTRIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="United States">United States</option>
                    <option value="Canada">Canada</option>
                    <option value="Germany">Germany</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Preferred corridor</label>
                  <select
                    value={preferredCorridor}
                    onChange={(e) => setPreferredCorridor(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white"
                  >
                    <option value="">Any corridor</option>
                    {PREFERRED_CORRIDORS.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone <span className="text-muted-foreground">(optional)</span></label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="+254 700 000 000"
                />
              </div>
              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-lg bg-amber-500 hover:bg-amber-400 text-amber-950 font-semibold px-6 py-3 text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {submitting ? 'Registering...' : 'Register interest — it\'s free'}
              </button>
              <p className="text-xs text-center text-muted-foreground">
                No spam. We&apos;ll only email you when Intra-Africa corridors launch.
                You can also create a full AfriSpine account to send money internationally today.
              </p>
            </form>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Frequently Asked Questions
            </h2>
          </div>
          <div className="space-y-3">
            {[
              {
                q: 'What is PAPSS?',
                a: 'PAPSS (Pan-African Payment and Settlement System) is a cross-border payment infrastructure owned by Afreximbank. It enables payments between African countries in local currencies without converting through USD. It is endorsed by the African Union and participating central banks.',
              },
              {
                q: 'When will Intra-Africa transfers go live?',
                a: 'We are actively integrating with PAPSS via our banking partner Ecobank. Registration is open now — we will notify you as soon as the first corridors launch. Timeline depends on PAPSS onboarding progress.',
              },
              {
                q: 'How much will it cost?',
                a: 'Our target fee is 1.5% — comparable to our international corridors. But the key saving is the eliminated FX conversion cost. Traditional intra-Africa payments lose 3–5% to double FX conversion; PAPSS removes this entirely.',
              },
              {
                q: 'Do I need a special account?',
                a: 'No. Your existing AfriSpine account will work. If you don\'t have one, you can create one when corridors launch. For now, just register your email to stay informed.',
              },
              {
                q: 'Which countries will be supported?',
                a: 'PAPSS currently covers 18 countries across East, West, North, and Southern Africa. This includes Kenya, Nigeria, Ghana, South Africa, Uganda, Tanzania, Rwanda, Egypt, Senegal, and more. The network is expanding.',
              },
            ].map((item) => (
              <IntraFaqItem key={item.q} q={item.q} a={item.a} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-amber-900 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Africa&apos;s payment infrastructure is changing.
          </h2>
          <p className="mt-4 text-lg text-amber-200">
            Be among the first to send money within Africa without USD conversion.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              size="lg"
              onClick={() => { document.getElementById('register')?.scrollIntoView({ behavior: 'smooth' }); }}
              className="bg-amber-400 text-amber-950 hover:bg-amber-300 font-semibold"
            >
              Register your interest
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10"
              onClick={() => navigate('signup')}
            >
              Create full account
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

function IntraFaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="rounded-lg border border-border">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-gray-900 hover:bg-muted/50 transition-colors"
      >
        {q}
        <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${open ? 'rotate-90' : ''}`} />
      </button>
      {open && (
        <div className="px-4 pb-3 text-sm text-muted-foreground leading-relaxed">
          {a}
        </div>
      )}
    </div>
  );
}