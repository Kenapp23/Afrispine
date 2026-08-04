'use client';

import { useState, type FormEvent } from 'react';
import { useAppStore } from '@/stores/app';
import { Button } from '@/components/ui/button';
import { PartnerDisclosure } from '@/components/afrispine/common/partner-disclosure';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Globe2,
  Landmark,
  Loader2,
  ShieldCheck,
  Zap,
  Calculator,
  Banknote,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const comparisonData = [
  {
    feature: 'Speed',
    traditional: '3–5 business days',
    afrispine: 'Same day',
  },
  {
    feature: 'Total cost',
    traditional: '2–4% + hidden forex spread',
    afrispine: '0.8% flat — no hidden fees',
  },
  {
    feature: 'Form M / documentation',
    traditional: 'Required — adds 1–2 weeks',
    afrispine: 'Not required',
  },
  {
    feature: 'Correspondent banks',
    traditional: '2–3 intermediary banks',
    afrispine: 'Direct settlement',
  },
  {
    feature: 'Tracking',
    traditional: 'SWIFT MT103 — hard to trace',
    afrispine: 'Real-time status in your dashboard',
  },
  {
    feature: 'Receiving method',
    traditional: 'Bank wire only',
    afrispine: 'Bank, Alipay & WeChat Pay (coming soon)',
  },
];

const audienceCards = [
  {
    emoji: '\u{1F1F3}\u{1F1EC}',
    title: 'Nigerian traders',
    desc: 'Importing electronics, fashion, and machinery from Guangzhou markets.',
  },
  {
    emoji: '\u{1F1F0}\u{1F1EA}',
    title: 'Kenyan importers',
    desc: 'Paying Yiwu garment factories and Shenzhen tech suppliers.',
  },
  {
    emoji: '\u{1F1EC}\u{1F1ED}',
    title: 'Ghanaian businesses',
    desc: 'Sourcing consumer goods, building materials, and auto parts from Shenzhen.',
  },
  {
    emoji: '\u{1F30D}',
    title: 'Any African SME',
    desc: 'With a Chinese supplier and a need for fast, affordable cross-border payments.',
  },
];

const steps = [
  {
    num: '1',
    title: 'Enter supplier details',
    desc: 'Chinese bank account, Alipay ID, or WeChat Pay handle.',
    icon: Globe2,
  },
  {
    num: '2',
    title: 'Enter amount',
    desc: 'Specify how much you want to send in KES, NGN, or GHS.',
    icon: Landmark,
  },
  {
    num: '3',
    title: 'Pay via AfriSpine',
    desc: 'Complete payment through M-Pesa, bank transfer, or card.',
    icon: ShieldCheck,
  },
  {
    num: '4',
    title: 'Supplier receives CNY',
    desc: 'Funds arrive same day \u2014 directly into their Chinese bank or e-wallet.',
    icon: Zap,
  },
];

const countries = [
  { value: 'KE', label: '\u{1F1F0}\u{1F1EA} Kenya' },
  { value: 'NG', label: '\u{1F1F3}\u{1F1EC} Nigeria' },
  { value: 'GH', label: '\u{1F1EC}\u{1F1ED} Ghana' },
  { value: 'OTHER', label: '\u{1F30D} Other' },
];

const currencies = [
  { value: 'KES', label: 'KES \u2014 Kenyan Shilling' },
  { value: 'NGN', label: 'NGN \u2014 Nigerian Naira' },
  { value: 'GHS', label: 'GHS \u2014 Ghanaian Cedi' },
  { value: 'USD', label: 'USD \u2014 US Dollar' },
  { value: 'GBP', label: 'GBP \u2014 British Pound' },
];

const purposes = [
  { value: 'goods_payment', label: 'Goods Payment' },
  { value: 'service_payment', label: 'Service Payment' },
  { value: 'trade_settlement', label: 'Trade Settlement' },
];

// FX rates to CNY
const FX_RATES_TO_CNY: Record<string, number> = {
  KES: 0.0056,
  NGN: 0.00095,
  GHS: 0.48,
  USD: 7.25,
  GBP: 9.18,
};

const FEE_PCT = 0.8;

function formatNumber(n: number, decimals = 2): string {
  return new Intl.NumberFormat('en-GB', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n);
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function ChinaCorridorPage() {
  const navigate = useAppStore((s) => s.navigate);

  // Waitlist state
  const [wlName, setWlName] = useState('');
  const [wlEmail, setWlEmail] = useState('');
  const [wlCountry, setWlCountry] = useState('');
  const [wlSubmitting, setWlSubmitting] = useState(false);
  const [wlSubmitted, setWlSubmitted] = useState(false);

  // Tab toggle
  const [activeTab, setActiveTab] = useState<'waitlist' | 'payment'>('waitlist');

  // Payment state
  const [payAmount, setPayAmount] = useState('');
  const [payCurrency, setPayCurrency] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [supplierBankName, setSupplierBankName] = useState('');
  const [supplierAccountNumber, setSupplierAccountNumber] = useState('');
  const [supplierBankCode, setSupplierBankCode] = useState('');
  const [purposeOfPayment, setPurposeOfPayment] = useState('');
  const [paySubmitting, setPaySubmitting] = useState(false);
  const [paySuccess, setPaySuccess] = useState(false);
  const [payError, setPayError] = useState('');

  // Fee & CNY calculation
  const numericAmount = parseFloat(payAmount) || 0;
  const fxRate = FX_RATES_TO_CNY[payCurrency] || 0;
  const rawFee = (numericAmount * FEE_PCT) / 100;

  // Min $5 fee converted to source currency
  const minFeeByCurrency: Record<string, number> = {
    USD: 5,
    GBP: 5 / 1.27,
    KES: 5 * 153,
    NGN: 5 * 1550,
    GHS: 5 * 15,
  };
  const minFee = minFeeByCurrency[payCurrency] || 5;
  const fee = Math.max(rawFee, numericAmount > 0 ? minFee : 0);
  const cnyAmount = parseFloat((numericAmount * fxRate).toFixed(2));
  const totalCharged = parseFloat((numericAmount + fee).toFixed(2));

  // ── Waitlist submit ──
  async function handleWaitlistSubmit(e: FormEvent) {
    e.preventDefault();
    if (!wlName.trim() || !wlEmail.trim() || !wlCountry) {
      toast.error('Please fill in all fields.');
      return;
    }
    setWlSubmitting(true);
    try {
      const res = await fetch('/api/china-corridor/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: wlName.trim(), email: wlEmail.trim(), country: wlCountry }),
      });
      if (!res.ok) throw new Error('Request failed');
      setWlSubmitted(true);
      toast.success('You\'re on the list! We\'ll be in touch soon.');
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setWlSubmitting(false);
    }
  }

  // ── Payment submit ──
  async function handlePaymentSubmit(e: FormEvent) {
    e.preventDefault();
    setPayError('');

    if (numericAmount < 1 || numericAmount > 50000) {
      setPayError('Amount must be between 1 and 50,000.');
      return;
    }
    if (!payCurrency || !supplierName.trim() || !supplierBankName.trim() ||
        !supplierAccountNumber.trim() || !supplierBankCode.trim() || !purposeOfPayment) {
      setPayError('Please fill in all fields.');
      return;
    }

    setPaySubmitting(true);
    try {
      const res = await fetch('/api/china-corridor/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: numericAmount,
          currencyFrom: payCurrency,
          supplierName: supplierName.trim(),
          supplierBankName: supplierBankName.trim(),
          supplierAccountNumber: supplierAccountNumber.trim(),
          supplierBankCode: supplierBankCode.trim(),
          deliveryMethod: 'bank_transfer',
          purposeOfPayment,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Payment initialization failed');

      setPaySuccess(true);
      toast.success('Payment initiated! Your supplier will receive CNY same day.');
    } catch (err: any) {
      setPayError(err.message || 'Something went wrong.');
      toast.error(err.message || 'Payment failed.');
    } finally {
      setPaySubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* ===================== HERO ===================== */}
      <section className="relative bg-gradient-to-br from-red-700 to-emerald-800 overflow-hidden">
        <div className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -bottom-32 -left-32 h-[28rem] w-[28rem] rounded-full bg-white/[0.03]" />

        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 py-20 sm:py-28 md:py-36 text-center">
          <span className="inline-block mb-5 rounded-full bg-white/15 px-4 py-1.5 text-xs sm:text-sm font-semibold tracking-wide text-white uppercase backdrop-blur-sm">
            BETA \u2014 Q4 2026
          </span>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-tight tracking-tight">
            {'\u{1F1E8}\u{1F1F3}'} Pay your Chinese suppliers.
            <br className="hidden sm:block" /> Today.
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg md:text-xl text-white/90 leading-relaxed">
            Send KES, NGN, GHS directly to China. CNY arrives in their bank
            account same day. <strong className="text-white">No Form M.</strong>{' '}
            <strong className="text-white">No correspondent banks.</strong>{' '}
            <strong className="text-white">0.8% flat.</strong>
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              className="bg-white text-red-700 hover:bg-white/90 font-semibold px-8 h-12 text-base"
              onClick={() =>
                document
                  .getElementById('action-section')
                  ?.scrollIntoView({ behavior: 'smooth' })
              }
            >
              Get started
              <ArrowRight className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-white/30 text-white hover:bg-white/10 hover:text-white px-8 h-12 text-base"
              onClick={() => navigate('business')}
            >
              I'm a business
            </Button>
          </div>
        </div>
      </section>

      {/* =================== HOW IT'S DIFFERENT =================== */}
      <section className="py-16 sm:py-20 md:py-24 bg-white">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <h2 className="text-center text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
            How it&rsquo;s different
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-gray-500 sm:text-base">
            A side-by-side comparison with traditional bank wires.
          </p>

          {/* Desktop table */}
          <div className="mt-10 hidden md:block overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-4 font-semibold text-gray-700 w-1/3">
                    Feature
                  </th>
                  <th className="px-6 py-4 font-semibold text-gray-700 w-1/3">
                    Traditional bank wire
                  </th>
                  <th className="px-6 py-4 font-semibold w-1/3" style={{ color: '#0A4D2E' }}>
                    AfriSpine China Corridor
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {comparisonData.map((row) => (
                  <tr key={row.feature} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-800">
                      {row.feature}
                    </td>
                    <td className="px-6 py-4 text-gray-500">{row.traditional}</td>
                    <td className="px-6 py-4 font-medium" style={{ color: '#0A4D2E' }}>
                      {row.afrispine}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="mt-10 grid gap-4 md:hidden">
            {comparisonData.map((row) => (
              <div
                key={row.feature}
                className="rounded-xl border border-gray-200 p-4 space-y-3"
              >
                <h4 className="text-sm font-semibold text-gray-900">{row.feature}</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-[10px] uppercase tracking-wider text-gray-400 font-medium mb-1">
                      Traditional wire
                    </p>
                    <p className="text-gray-600 leading-snug">{row.traditional}</p>
                  </div>
                  <div
                    className="rounded-lg p-3"
                    style={{ backgroundColor: '#0A4D2E' }}
                  >
                    <p className="text-[10px] uppercase tracking-wider text-emerald-300 font-medium mb-1">
                      AfriSpine
                    </p>
                    <p className="text-white leading-snug font-medium">{row.afrispine}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== WHO IT'S FOR ===================== */}
      <section className="py-16 sm:py-20 md:py-24 bg-gray-50">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <h2 className="text-center text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
            Who it&rsquo;s for
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-gray-500">
            Built for African businesses that trade with China every day.
          </p>

          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {audienceCards.map((card) => (
              <div
                key={card.title}
                className="rounded-xl border border-gray-200 bg-white p-6 hover:shadow-md transition-shadow"
              >
                <span className="text-3xl" role="img" aria-label="">
                  {card.emoji}
                </span>
                <h3 className="mt-3 text-lg font-semibold text-gray-900">
                  {card.title}
                </h3>
                <p className="mt-1.5 text-sm text-gray-500 leading-relaxed">
                  {card.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =================== HOW IT WORKS =================== */}
      <section className="py-16 sm:py-20 md:py-24 bg-white">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <h2 className="text-center text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
            How it works
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-gray-500">
            Four simple steps. Same-day settlement.
          </p>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div key={step.num} className="relative flex flex-col items-center text-center">
                  {idx < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-7 left-[calc(50%+2rem)] w-[calc(100%-4rem)] h-px border-t-2 border-dashed border-gray-200" />
                  )}

                  <div
                    className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full text-white text-lg font-bold shrink-0"
                    style={{ backgroundColor: idx % 2 === 0 ? '#DC2626' : '#0A4D2E' }}
                  >
                    {step.num}
                  </div>

                  <div className="mt-4 rounded-full bg-gray-100 p-2.5">
                    <Icon className="size-5 text-gray-600" />
                  </div>

                  <h3 className="mt-3 text-base font-semibold text-gray-900">
                    {step.title}
                  </h3>
                  <p className="mt-1.5 text-sm text-gray-500 leading-relaxed max-w-[14rem]">
                    {step.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================== INTEGRATION PARTNER ================== */}
      <section className="py-12 sm:py-16 bg-gray-50 border-y border-gray-200">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 text-center">
          <p className="text-sm font-medium text-gray-400 uppercase tracking-widest mb-3">
            Integration partner
          </p>
          <p className="text-base sm:text-lg text-gray-700 max-w-3xl mx-auto leading-relaxed">
            Powered by <strong className="text-gray-900">XTransfer</strong> \u2014 China&rsquo;s leading
            B2B cross-border payment platform, licensed across{' '}
            <strong className="text-gray-900">20+ African countries</strong> and China.
          </p>
          <PartnerDisclosure variant="card" className="mt-4 max-w-3xl mx-auto" />
        </div>
      </section>

      {/* ============== ALIPAY / WECHAT PAY TEASER ============== */}
      <section className="py-12 sm:py-16 bg-white">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs sm:text-sm font-semibold px-4 py-1.5 mb-4">
            <Clock className="size-3.5" />
            Coming soon
          </span>
          <p className="text-base sm:text-lg text-gray-700 max-w-3xl mx-auto leading-relaxed">
            Pay suppliers directly via <strong className="text-gray-900">Alipay</strong> and{' '}
            <strong className="text-gray-900">WeChat Pay</strong> through our partnership
            with <strong className="text-gray-900">Thunes</strong>.
          </p>
        </div>
      </section>

      {/* ================ ACTION SECTION (TABS) ================ */}
      <section id="action-section" className="relative py-16 sm:py-20 md:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-red-700 to-emerald-800" />
        <div className="pointer-events-none absolute -top-20 right-0 h-72 w-72 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-white/[0.04]" />

        <div className="relative mx-auto max-w-2xl px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white tracking-tight">
            {activeTab === 'waitlist' ? 'Beta waiting list' : 'Make a payment'}
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-white/90 leading-relaxed text-sm sm:text-base">
            {activeTab === 'waitlist' ? (
              <>
                We&rsquo;re launching the China Corridor Q4 2026.{' '}
                <strong className="text-white">
                  Founding members get 0% fee on first 3 transfers.
                </strong>
              </>
            ) : (
              <>
                Beta access is open. Send to your Chinese supplier now with{' '}
                <strong className="text-white">0.8% flat fee</strong> and same-day CNY delivery.
              </>
            )}
          </p>

          {/* Tab toggle */}
          <div className="mt-8 inline-flex rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 p-1">
            <button
              onClick={() => setActiveTab('waitlist')}
              className={`px-5 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === 'waitlist'
                  ? 'bg-white text-red-700 shadow-sm'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              Join Waitlist
            </button>
            <button
              onClick={() => setActiveTab('payment')}
              className={`px-5 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === 'payment'
                  ? 'bg-white text-red-700 shadow-sm'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              Make a Payment
            </button>
          </div>

          {/* ── WAITLIST TAB ── */}
          {activeTab === 'waitlist' && (
            <>
              {wlSubmitted ? (
                <div className="mt-10 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 p-8 sm:p-10">
                  <CheckCircle2 className="mx-auto size-12 text-emerald-300" />
                  <h3 className="mt-4 text-xl font-bold text-white">
                    You&rsquo;re on the list!
                  </h3>
                  <p className="mt-2 text-sm text-white/80">
                    We&rsquo;ll email you when the China Corridor is ready. Keep an eye
                    on your inbox.
                  </p>
                  <Button
                    variant="outline"
                    className="mt-6 border-white/30 text-white hover:bg-white/10 hover:text-white"
                    onClick={() => {
                      setWlSubmitted(false);
                      setWlName('');
                      setWlEmail('');
                      setWlCountry('');
                    }}
                  >
                    Sign up another email
                  </Button>
                </div>
              ) : (
                <form
                  onSubmit={handleWaitlistSubmit}
                  className="mt-10 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 p-6 sm:p-8 text-left space-y-4"
                >
                  <div>
                    <Label htmlFor="wl-name" className="text-sm font-medium text-white/80 mb-1.5 block">
                      Full name
                    </Label>
                    <Input
                      id="wl-name"
                      type="text"
                      placeholder="e.g. Adaeze Okonkwo"
                      value={wlName}
                      onChange={(e) => setWlName(e.target.value)}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus-visible:border-white focus-visible:ring-white/30 h-11"
                    />
                  </div>

                  <div>
                    <Label htmlFor="wl-email" className="text-sm font-medium text-white/80 mb-1.5 block">
                      Work email
                    </Label>
                    <Input
                      id="wl-email"
                      type="email"
                      placeholder="you@company.com"
                      value={wlEmail}
                      onChange={(e) => setWlEmail(e.target.value)}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus-visible:border-white focus-visible:ring-white/30 h-11"
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-white/80 mb-1.5 block">
                      Country
                    </Label>
                    <Select value={wlCountry} onValueChange={setWlCountry}>
                      <SelectTrigger className="w-full bg-white/10 border-white/20 text-white data-[placeholder]:text-white/40 h-11">
                        <SelectValue placeholder="Select your country" />
                      </SelectTrigger>
                      <SelectContent>
                        {countries.map((c) => (
                          <SelectItem key={c.value} value={c.value}>
                            {c.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    type="submit"
                    disabled={wlSubmitting}
                    className="w-full mt-2 bg-white text-red-700 hover:bg-white/90 font-semibold h-12 text-base"
                  >
                    {wlSubmitting ? 'Joining\u2026' : 'Join the waiting list'}
                    {!wlSubmitting && <ArrowRight className="size-4" />}
                  </Button>

                  <p className="text-center text-xs text-white/50 pt-1">
                    No spam. We only email about the China Corridor launch.
                  </p>
                </form>
              )}
            </>
          )}

          {/* ── PAYMENT TAB ── */}
          {activeTab === 'payment' && (
            <>
              {paySuccess ? (
                <div className="mt-10 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 p-8 sm:p-10">
                  <CheckCircle2 className="mx-auto size-12 text-emerald-300" />
                  <h3 className="mt-4 text-xl font-bold text-white">
                    Payment initiated!
                  </h3>
                  <p className="mt-2 text-sm text-white/80">
                    Your Chinese supplier will receive CNY in their bank account same day.
                    You can track the payment status in your dashboard.
                  </p>
                  <Button
                    variant="outline"
                    className="mt-6 border-white/30 text-white hover:bg-white/10 hover:text-white"
                    onClick={() => {
                      setPaySuccess(false);
                      setPayAmount('');
                      setPayCurrency('');
                      setSupplierName('');
                      setSupplierBankName('');
                      setSupplierAccountNumber('');
                      setSupplierBankCode('');
                      setPurposeOfPayment('');
                    }}
                  >
                    Make another payment
                  </Button>
                </div>
              ) : (
                <form
                  onSubmit={handlePaymentSubmit}
                  className="mt-10 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 p-6 sm:p-8 text-left space-y-4"
                >
                  {payError && (
                    <div className="rounded-lg bg-red-500/20 border border-red-400/30 text-white text-sm px-4 py-3">
                      {payError}
                    </div>
                  )}

                  {/* Amount + Currency row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="cn-amount" className="text-sm font-medium text-white/80 mb-1.5 block">
                        Amount to send
                      </Label>
                      <div className="relative">
                        <Input
                          id="cn-amount"
                          type="number"
                          min="1"
                          max="50000"
                          placeholder="e.g. 100000"
                          value={payAmount}
                          onChange={(e) => setPayAmount(e.target.value)}
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus-visible:border-white focus-visible:ring-white/30 h-11 pr-16"
                        />
                        {payCurrency && (
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-white/50 font-medium">
                            {payCurrency}
                          </span>
                        )}
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-white/80 mb-1.5 block">
                        Your currency
                      </Label>
                      <Select value={payCurrency} onValueChange={setPayCurrency}>
                        <SelectTrigger className="w-full bg-white/10 border-white/20 text-white data-[placeholder]:text-white/40 h-11">
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                        <SelectContent>
                          {currencies.map((c) => (
                            <SelectItem key={c.value} value={c.value}>
                              {c.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Live fee + CNY calculation */}
                  {numericAmount > 0 && payCurrency && (
                    <div className="rounded-lg bg-white/10 border border-white/20 p-4 space-y-2">
                      <div className="flex items-center gap-2 text-amber-300 text-xs font-semibold uppercase tracking-wider">
                        <Calculator className="size-3.5" />
                        Live calculation
                      </div>
                      <div className="grid grid-cols-2 gap-y-2 text-sm">
                        <div className="text-white/60">You send</div>
                        <div className="text-white font-medium text-right">
                          {formatNumber(numericAmount)} {payCurrency}
                        </div>
                        <div className="text-white/60">Fee ({FEE_PCT}%{fee > rawFee && numericAmount > 0 ? ', min $5' : ''})</div>
                        <div className="text-amber-300 font-medium text-right">
                          {formatNumber(fee)} {payCurrency}
                        </div>
                        <div className="text-white/60">FX rate</div>
                        <div className="text-white font-medium text-right">
                          1 {payCurrency} = {fxRate} CNY
                        </div>
                        <div className="text-white/80 font-semibold">Supplier receives</div>
                        <div className="text-emerald-300 font-bold text-right text-lg">
                          {'\u00A5'} {formatNumber(cnyAmount)}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Supplier details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="cn-supplier" className="text-sm font-medium text-white/80 mb-1.5 block">
                        Supplier name
                      </Label>
                      <Input
                        id="cn-supplier"
                        type="text"
                        placeholder="e.g. Guangzhou Tech Ltd"
                        value={supplierName}
                        onChange={(e) => setSupplierName(e.target.value)}
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus-visible:border-white focus-visible:ring-white/30 h-11"
                      />
                    </div>
                    <div>
                      <Label htmlFor="cn-bank" className="text-sm font-medium text-white/80 mb-1.5 block">
                        Supplier bank name
                      </Label>
                      <Input
                        id="cn-bank"
                        type="text"
                        placeholder="e.g. ICBC, Bank of China"
                        value={supplierBankName}
                        onChange={(e) => setSupplierBankName(e.target.value)}
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus-visible:border-white focus-visible:ring-white/30 h-11"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="cn-account" className="text-sm font-medium text-white/80 mb-1.5 block">
                        Account number
                      </Label>
                      <Input
                        id="cn-account"
                        type="text"
                        placeholder="Chinese bank account number"
                        value={supplierAccountNumber}
                        onChange={(e) => setSupplierAccountNumber(e.target.value)}
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus-visible:border-white focus-visible:ring-white/30 h-11"
                      />
                    </div>
                    <div>
                      <Label htmlFor="cn-swift" className="text-sm font-medium text-white/80 mb-1.5 block">
                        SWIFT / routing code
                      </Label>
                      <Input
                        id="cn-swift"
                        type="text"
                        placeholder="e.g. ICBKCNBJ"
                        value={supplierBankCode}
                        onChange={(e) => setSupplierBankCode(e.target.value)}
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus-visible:border-white focus-visible:ring-white/30 h-11"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-white/80 mb-1.5 block">
                      Purpose of payment
                    </Label>
                    <Select value={purposeOfPayment} onValueChange={setPurposeOfPayment}>
                      <SelectTrigger className="w-full bg-white/10 border-white/20 text-white data-[placeholder]:text-white/40 h-11">
                        <SelectValue placeholder="Select purpose" />
                      </SelectTrigger>
                      <SelectContent>
                        {purposes.map((p) => (
                          <SelectItem key={p.value} value={p.value}>
                            {p.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    type="submit"
                    disabled={paySubmitting || numericAmount <= 0}
                    className="w-full mt-2 bg-white text-red-700 hover:bg-white/90 font-semibold h-12 text-base"
                  >
                    {paySubmitting ? (
                      <>
                        <Loader2 className="size-4 animate-spin mr-2" />
                        Processing\u2026
                      </>
                    ) : (
                      <>
                        <Banknote className="size-4 mr-2" />
                        Pay now securely
                        {totalCharged > 0 && (
                          <span className="ml-2 opacity-70">
                            ({formatNumber(totalCharged)} {payCurrency})
                          </span>
                        )}
                      </>
                    )}
                  </Button>

                  <p className="text-center text-xs text-white/50 pt-1">
                    Funds are delivered same day. Powered by XTransfer.{' '}
                    <button
                      type="button"
                      onClick={() => navigate('terms')}
                      className="underline hover:text-white/70"
                    >
                      Terms apply
                    </button>
                  </p>
                </form>
              )}
            </>
          )}
        </div>
      </section>

      {/* ===================== FOOTER ===================== */}
      <footer className="mt-auto border-t border-gray-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-400">
            &copy; {new Date().getFullYear()} AfriSpine. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm text-gray-400">
            <button
              onClick={() => navigate('terms')}
              className="hover:text-gray-600 transition-colors"
            >
              Terms
            </button>
            <button
              onClick={() => navigate('privacy')}
              className="hover:text-gray-600 transition-colors"
            >
              Privacy
            </button>
            <button
              onClick={() => navigate('contact')}
              className="hover:text-gray-600 transition-colors"
            >
              Contact
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}