'use client'

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  TrendingUp, Shield, Zap, CreditCard, ArrowRight, BarChart3,
  Globe, Lock, Smartphone, ChevronUp, ChevronDown, Menu, X,
  Send, Wallet, RefreshCw, CheckCircle2, Clock, AlertCircle, Users,
  Heart, Home, Banknote, ArrowLeftRight, Landmark, Plane, Building2,
} from 'lucide-react';

/* ─── Animated counter (fixed: uses ceil on step, handles 99→99.9 correctly) ─── */
function Counter({ target, suffix = '', decimals = 0 }: { target: number; suffix?: string; decimals?: number }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const duration = 2000;
    const totalSteps = Math.ceil(duration / 16);
    const rawStep = (target * Math.pow(10, decimals)) / totalSteps;
    const step = Math.max(rawStep, 0.01);
    const timer = setInterval(() => {
      start += step;
      if (start >= target * Math.pow(10, decimals)) {
        start = target * Math.pow(10, decimals);
        clearInterval(timer);
      }
      setCount(start);
    }, 16);
    return () => clearInterval(timer);
  }, [target, decimals]);
  return <span>{(count / Math.pow(10, decimals)).toFixed(decimals)}{suffix}</span>;
}

/* ─── Navigation ─── */
function Navbar({ onNavigate }: { onNavigate: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const links = [
    { label: 'Markets', id: 'markets' },
    { label: 'Payments', id: 'payments' },
    { label: 'Trust', id: 'trust' },
    { label: 'About', id: 'about' },
  ];
  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">AfriSpine</span>
          </div>
          <div className="hidden md:flex items-center gap-1">
            {links.map(l => (
              <button
                key={l.id}
                onClick={() => onNavigate(l.id)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-emerald-600 rounded-md transition-colors"
              >
                {l.label}
              </button>
            ))}
          </div>
          <div className="hidden md:flex items-center gap-3">
            <Link href="/admin">
              <Button variant="ghost" size="sm" className="text-gray-600">Admin</Button>
            </Link>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
              Get Started <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
          <button className="md:hidden p-2" onClick={() => setOpen(!open)}>
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {open && (
          <div className="md:hidden pb-4 space-y-1">
            {links.map(l => (
              <button
                key={l.id}
                onClick={() => { onNavigate(l.id); setOpen(false); }}
                className="block w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-emerald-50 rounded-md"
              >
                {l.label}
              </button>
            ))}
            <Link href="/admin">
              <button className="block w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-emerald-50 rounded-md">Admin Panel</button>
            </Link>
            <div className="pt-2 px-4">
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">Get Started</Button>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}

/* ─── Hero Section (diaspora-framed) ─── */
function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-amber-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
        <div className="max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Badge variant="outline" className="mb-4 border-emerald-200 text-emerald-700 bg-emerald-50">
              <Plane className="mr-1 h-3 w-3" /> Built for the African Diaspora
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 leading-tight">
              Your Wealth,<br />
              <span className="text-emerald-600">Connected to Home</span>
            </h1>
            <p className="mt-6 text-lg md:text-xl text-gray-600 leading-relaxed max-w-2xl">
              Invest in African stock exchanges, send money to family, and pay bills across the continent — all from one platform, wherever you live in the world.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white px-8">
                Start Investing <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" className="px-8">
                Send Money Home
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
      <div className="absolute top-20 right-0 w-72 h-72 bg-emerald-100 rounded-full blur-3xl opacity-40 -z-10" />
      <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-amber-100 rounded-full blur-3xl opacity-30 -z-10" />
    </section>
  );
}

/* ─── Stock Markets Section (FIXED: proper currency per exchange) ─── */
const MARKETS = [
  { name: 'Nairobi Securities Exchange', code: 'NSE', country: 'Kenya', flag: '🇰🇪', currency: 'KES', color: 'text-emerald-600', bg: 'bg-emerald-50', borderColor: 'border-emerald-200' },
  { name: 'Nigerian Exchange Group', code: 'NGX', country: 'Nigeria', flag: '🇳🇬', currency: 'NGN', color: 'text-green-600', bg: 'bg-green-50', borderColor: 'border-green-200' },
  { name: 'Johannesburg Stock Exchange', code: 'JSE', country: 'South Africa', flag: '🇿🇦', currency: 'ZAR', color: 'text-amber-600', bg: 'bg-amber-50', borderColor: 'border-amber-200' },
];

type StockEntry = { symbol: string; name: string; price: string; change: number; volume: string };
const SAMPLE_STOCKS: Record<string, StockEntry[]> = {
  NSE: [
    { symbol: 'SCOM', name: 'Safaricom', price: '17.25', change: 2.3, volume: '12.4M' },
    { symbol: 'KCB', name: 'KCB Group', price: '44.50', change: -0.8, volume: '3.2M' },
    { symbol: 'EQTY', name: 'Equity Bank', price: '53.00', change: 1.1, volume: '2.8M' },
    { symbol: 'COOP', name: 'Cooperative Bank', price: '14.75', change: 0.5, volume: '5.1M' },
  ],
  NGX: [
    { symbol: 'DANGCEM', name: 'Dangote Cement', price: '415.00', change: -1.2, volume: '8.7M' },
    { symbol: 'MTNN', name: 'MTN Nigeria', price: '220.50', change: 3.1, volume: '15.2M' },
    { symbol: 'GTCO', name: 'Guaranty Trust', price: '28.90', change: 0.7, volume: '22.1M' },
    { symbol: 'ZENITHBANK', name: 'Zenith Bank', price: '27.40', change: -0.3, volume: '18.5M' },
  ],
  JSE: [
    { symbol: 'NPN', name: 'Naspers', price: '1,245.00', change: 1.8, volume: '1.2M' },
    { symbol: 'SASOL', name: 'Sasol', price: '345.20', change: -2.1, volume: '4.5M' },
    { symbol: 'FSR', name: 'FirstRand', price: '72.80', change: 0.9, volume: '6.3M' },
    { symbol: 'SBK', name: 'Standard Bank', price: '168.50', change: 1.4, volume: '3.8M' },
  ],
};

function MarketCard({ market }: { market: typeof MARKETS[0] }) {
  const stocks = SAMPLE_STOCKS[market.code] || [];
  return (
    <Card className={`${market.borderColor} border`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{market.flag}</span>
            <div>
              <CardTitle className="text-base font-bold">{market.code}</CardTitle>
              <p className="text-xs text-muted-foreground">{market.name}</p>
            </div>
          </div>
          <Badge variant="outline" className={`${market.color} ${market.bg} border-current/20`}>
            Live
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {stocks.map(s => (
            <div key={s.symbol} className="flex items-center justify-between py-1.5 border-b last:border-0 border-gray-100">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900">{s.symbol}</p>
                <p className="text-xs text-muted-foreground truncate">{s.name}</p>
              </div>
              <div className="text-right ml-3">
                <p className="text-sm font-semibold tabular-nums">{market.currency} {s.price}</p>
                <div className={`flex items-center justify-end text-xs font-medium ${s.change >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {s.change >= 0 ? <ChevronUp className="h-3 w-3 mr-0.5" /> : <ChevronDown className="h-3 w-3 mr-0.5" />}
                  {s.change >= 0 ? '+' : ''}{s.change}%
                </div>
              </div>
            </div>
          ))}
        </div>
        <Button variant="outline" size="sm" className={`w-full mt-4 ${market.color} hover:${market.bg}`}>
          View All {market.code} Stocks <ArrowRight className="ml-1 h-3 w-3" />
        </Button>
      </CardContent>
    </Card>
  );
}

function MarketsSection() {
  return (
    <section id="markets" className="py-16 md:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <Badge variant="outline" className="mb-3 border-emerald-200 text-emerald-700">
            <BarChart3 className="mr-1 h-3 w-3" /> Stock Trading
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
            African Stock Markets
          </h2>
          <p className="mt-3 text-gray-500 max-w-2xl mx-auto">
            Access real-time data from Africa&apos;s leading exchanges. Invest in Kenya, Nigeria, and South Africa from wherever you are.
          </p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {MARKETS.map(m => <MarketCard key={m.code} market={m} />)}
        </div>
      </div>
    </section>
  );
}

/* ─── Payments Section (FIXED: diaspora-focused, Fincra only, no Flutterwave) ─── */
const PAYMENT_FEATURES = [
  { icon: <Send className="h-6 w-6" />, title: 'Send Money Home', desc: 'Transfer funds instantly to family and friends across Africa with competitive exchange rates.', provider: 'Fincra' },
  { icon: <Wallet className="h-6 w-6" />, title: 'Mobile Money', desc: 'Pay directly to M-Pesa, MTN MoMo, Airtel Money and more — reach anyone with a phone.', provider: 'Fincra' },
  { icon: <CreditCard className="h-6 w-6" />, title: 'Card Payments', desc: 'Send via Visa and Mastercard to bank accounts and mobile wallets across 30+ African markets.', provider: 'Fincra' },
  { icon: <Landmark className="h-6 w-6" />, title: 'Bank Transfers', desc: 'Direct bank-to-bank transfers supporting all major African banks — no intermediaries.', provider: 'Fincra' },
  { icon: <ArrowLeftRight className="h-6 w-6" />, title: 'Currency Exchange', desc: 'Real-time FX rates for KES, NGN, ZAR, UGX, TZS, GHS and more. Get the best rate, every time.', provider: 'Fincra' },
  { icon: <Lock className="h-6 w-6" />, title: 'Secure Collections', desc: 'PCI-DSS compliant payment collection with automated reconciliation and audit trails.', provider: 'Fincra' },
];

function PaymentsSection() {
  return (
    <section id="payments" className="py-16 md:py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <Badge variant="outline" className="mb-3 border-emerald-200 text-emerald-700">
            <CreditCard className="mr-1 h-3 w-3" /> Payments
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
            Send Money Across Africa
          </h2>
          <p className="mt-3 text-gray-500 max-w-2xl mx-auto">
            Powered by Fincra. Support your family, pay bills, and move money across borders with bank-grade security and transparent exchange rates.
          </p>
        </motion.div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {PAYMENT_FEATURES.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
            >
              <Card className="h-full hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 mb-4">
                    {f.icon}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
                  <p className="text-sm text-gray-500 mb-3">{f.desc}</p>
                  <Badge variant="secondary" className="text-xs">{f.provider}</Badge>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Trust & Stats Section (FIXED: counter targets use decimals for 99.9%) ─── */
const STATS = [
  { value: 3, suffix: '+', decimals: 0, label: 'African Exchanges', icon: <Globe className="h-5 w-5" /> },
  { value: 50, suffix: 'M+', decimals: 0, label: 'Stocks Accessible', icon: <BarChart3 className="h-5 w-5" /> },
  { value: 30, suffix: '+', decimals: 0, label: 'Currencies Supported', icon: <RefreshCw className="h-5 w-5" /> },
  { value: 99.9, suffix: '%', decimals: 1, label: 'Platform Uptime', icon: <Shield className="h-5 w-5" /> },
];

function TrustSection() {
  const [healthData, setHealthData] = useState<{ status: string; providers: { displayName: string; overallStatus: string }[] } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchHealth = useCallback(async () => {
    try {
      const res = await fetch('/api/wealth/health');
      if (res.ok) {
        const json = await res.json();
        setHealthData(json);
      }
    } catch {
      // Silently fail — stats section still shows static data
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchHealth(); }, [fetchHealth]);

  return (
    <section id="trust" className="py-16 md:py-20 bg-emerald-700 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold">
            Trusted Infrastructure
          </h2>
          <p className="mt-3 text-emerald-100 max-w-2xl mx-auto">
            Built on bank-grade APIs with real-time health monitoring and 99.9% uptime.
          </p>
        </motion.div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {STATS.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="text-center"
            >
              <div className="w-12 h-12 rounded-full bg-emerald-600 flex items-center justify-center mx-auto mb-3 text-emerald-200">
                {s.icon}
              </div>
              <p className="text-3xl md:text-4xl font-bold">
                <Counter target={s.value} suffix={s.suffix} decimals={s.decimals} />
              </p>
              <p className="text-sm text-emerald-200 mt-1">{s.label}</p>
            </motion.div>
          ))}
        </div>
        {/* Live API Status */}
        <div className="bg-emerald-800/50 rounded-xl p-6 max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Zap className="h-4 w-4" /> Live API Status
            </h3>
            {!loading && (
              <Badge className={healthData?.status === 'healthy' ? 'bg-green-500 hover:bg-green-500' : 'bg-amber-500 hover:bg-amber-500'}>
                {healthData?.status === 'healthy' ? 'All Systems Go' : 'Partial Degradation'}
              </Badge>
            )}
          </div>
          {loading ? (
            <div className="space-y-2"><Skeleton className="h-8 w-full bg-emerald-700/50" /><Skeleton className="h-8 w-full bg-emerald-700/50" /></div>
          ) : (
            <div className="space-y-2">
              {healthData?.providers.map((p, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-emerald-100">{p.displayName}</span>
                  <div className="flex items-center gap-1.5">
                    {p.overallStatus === 'healthy' ? (
                      <CheckCircle2 className="h-4 w-4 text-green-400" />
                    ) : p.overallStatus === 'unconfigured' ? (
                      <Clock className="h-4 w-4 text-amber-400" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-400" />
                    )}
                    <span className="capitalize text-emerald-200 text-xs">{p.overallStatus}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/* ─── About Section (diaspora-framed) ─── */
function AboutSection() {
  return (
    <section id="about" className="py-16 md:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <Badge variant="outline" className="mb-3 border-emerald-200 text-emerald-700">
              About AfriSpine
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              Built for Africans,<br />Wherever You Are
            </h2>
            <p className="mt-4 text-gray-600 leading-relaxed">
              AfriSpine was built for the millions of Africans living abroad who want a single platform to invest back home, support their families, and grow their wealth across the continent.
            </p>
            <p className="mt-4 text-gray-600 leading-relaxed">
              We integrate with Africa&apos;s leading financial infrastructure — MyStocks for real-time market data and Fincra for cross-border payments — giving you the same access as someone standing on the trading floor in Nairobi, Lagos, or Johannesburg.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Diaspora-first design
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Real-time market data
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Multi-currency support
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Cross-border payments
              </div>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-emerald-50 border-emerald-200">
                <CardContent className="pt-6 text-center">
                  <TrendingUp className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
                  <h4 className="font-semibold text-sm">Stock Trading</h4>
                  <p className="text-xs text-muted-foreground mt-1">NSE, NGX, JSE</p>
                </CardContent>
              </Card>
              <Card className="bg-amber-50 border-amber-200">
                <CardContent className="pt-6 text-center">
                  <Send className="h-8 w-8 text-amber-600 mx-auto mb-2" />
                  <h4 className="font-semibold text-sm">Remittances</h4>
                  <p className="text-xs text-muted-foreground mt-1">Send money home</p>
                </CardContent>
              </Card>
              <Card className="bg-green-50 border-green-200">
                <CardContent className="pt-6 text-center">
                  <Shield className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <h4 className="font-semibold text-sm">Security</h4>
                  <p className="text-xs text-muted-foreground mt-1">Encrypted & Compliant</p>
                </CardContent>
              </Card>
              <Card className="bg-orange-50 border-orange-200">
                <CardContent className="pt-6 text-center">
                  <Globe className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                  <h4 className="font-semibold text-sm">30+ Markets</h4>
                  <p className="text-xs text-muted-foreground mt-1">Across Africa</p>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ─── CTA Section (diaspora-framed) ─── */
function CTASection() {
  return (
    <section className="py-16 md:py-20 bg-gray-900 text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold">Ready to Invest Back Home?</h2>
          <p className="mt-4 text-gray-400 text-lg max-w-2xl mx-auto">
            Join thousands of Africans abroad using AfriSpine to build wealth, support family, and stay connected to the continent&apos;s markets.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white px-8">
              Create Your Account <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" className="border-gray-600 text-white hover:bg-gray-800 px-8">
              Learn More
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── Footer ─── */
function Footer() {
  return (
    <footer className="bg-white border-t">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-900">AfriSpine</span>
            </div>
            <p className="text-sm text-muted-foreground">Africa&apos;s wealth management platform for the diaspora. Invest, remit, and grow.</p>
          </div>
          <div>
            <h4 className="font-semibold text-sm text-gray-900 mb-3">Markets</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Nairobi (NSE)</li>
              <li>Lagos (NGX)</li>
              <li>Johannesburg (JSE)</li>
              <li>Portfolio Tracker</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm text-gray-900 mb-3">Payments</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Send Money Home</li>
              <li>Mobile Money</li>
              <li>Bank Transfers</li>
              <li>Currency Exchange</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm text-gray-900 mb-3">Company</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>About Us</li>
              <li>Contact</li>
              <li>Terms of Service</li>
              <li>Privacy Policy</li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} AfriSpine. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            Empowering African wealth, wherever you are.
          </p>
        </div>
      </div>
    </footer>
  );
}

/* ─── Main Page ─── */
export default function AfriSpinePlatform() {
  const scrollTo = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar onNavigate={scrollTo} />
      <main className="flex-1">
        <HeroSection />
        <MarketsSection />
        <PaymentsSection />
        <TrustSection />
        <AboutSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
