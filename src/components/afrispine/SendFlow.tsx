'use client';
import { useState, useEffect } from 'react';
import { useApp, navigate } from '@/stores/app';
import { ArrowLeft, ArrowRight, Check, Send, Shield, CreditCard, Smartphone, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/fx';

interface Corridor { id: string; sourceCountry: string; sourceCurrency: string; destCountry: string; destCurrency: string; destMethod: string; baseRate: number; feeFixed: number; feePercent: number; minAmount: number; maxAmount: number; estimatedMins: number; provider: { name: string } }

const STEPS = ['Amount', 'Quote', 'Recipient', 'KYC', 'Pay'];

export function SendFlow() {
  const { setRoute } = useApp();
  const [step, setStep] = useState(0);
  const [corridors, setCorridors] = useState<Corridor[]>([]);
  const [selectedCorridor, setSelectedCorridor] = useState<string>('');
  const [amount, setAmount] = useState('');
  const [quote, setQuote] = useState<any>(null);
  const [recipient, setRecipient] = useState({ firstName: '', lastName: '', phone: '' });
  const [kyc, setKyc] = useState({ dob: '', address: '', city: '', postcode: '', purpose: 'family' });
  const [payMethod, setPayMethod] = useState('card');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [txId, setTxId] = useState('');

  useEffect(() => {
    fetch('/api/corridors').then(r => r.json()).then(setCorridors);
  }, []);

  const corridor = corridors.find(c => c.id === selectedCorridor);
  const cur = corridor?.sourceCurrency || 'USD';

  async function getQuote() {
    if (!selectedCorridor || !amount) return;
    setLoading(true); setError('');
    const res = await fetch('/api/quote', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ corridorId: selectedCorridor, sourceAmount: parseFloat(amount) }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error || 'Quote failed'); return; }
    setQuote(data);
    setStep(1);
  }

  async function submitTransfer() {
    setLoading(true); setError('');
    const res = await fetch('/api/transfers', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        corridorId: selectedCorridor, sourceAmount: parseFloat(amount),
        destAmount: quote.destAmount, exchangeRate: quote.rate, feeAmount: quote.feeAmount,
        totalCharged: quote.totalCharged, recipientPhone: recipient.phone,
        recipientName: `${recipient.firstName} ${recipient.lastName}`,
        paymentMethod: payMethod,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error || 'Transfer failed'); return; }
    setTxId(data.id);
    // update KYC
    await fetch(`/api/transfers/${data.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(kyc),
    });
    // process the transfer
    await fetch(`/api/transfers/${data.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'processing' }),
    });
    setStep(4);
  }

  if (step === 4) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4"><Check className="w-8 h-8 text-emerald-600" /></div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Transfer Submitted!</h1>
          <p className="text-gray-500 mb-4">Your transfer is being processed. You&apos;ll receive a confirmation email shortly.</p>
          <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left space-y-2">
            <p className="text-sm text-gray-500">Amount sent</p>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(parseFloat(amount), cur)}</p>
            <p className="text-sm text-gray-500">Recipient receives</p>
            <p className="text-xl font-bold text-emerald-600">{formatCurrency(quote?.destAmount || 0, 'KES')}</p>
            <p className="text-sm text-gray-500">To: {recipient.firstName} {recipient.lastName}</p>
            <p className="text-sm text-gray-500">{recipient.phone}</p>
            <p className="text-sm text-gray-400 mt-2">Estimated: ~{corridor?.estimatedMins || 10} minutes</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setRoute('dashboard')} className="flex-1 py-2.5 border border-gray-200 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition">Dashboard</button>
            <button onClick={() => setRoute('transfers')} className="flex-1 py-2.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition">View Transfers</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center gap-4">
          <button onClick={() => step > 0 ? setStep(step - 1) : setRoute('dashboard')} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <span className="font-semibold text-gray-900">Send Money</span>
          <div className="flex-1" />
          <span className="text-sm text-gray-400">Step {step + 1} of 5</span>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 py-6 pb-24">
        {/* Progress */}
        <div className="flex items-center gap-1 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex-1 flex flex-col items-center gap-1">
              <div className={`h-1.5 w-full rounded-full ${i <= step ? 'bg-emerald-500' : 'bg-gray-200'}`} />
              <span className={`text-xs ${i <= step ? 'text-emerald-600 font-medium' : 'text-gray-400'}`}>{s}</span>
            </div>
          ))}
        </div>

        {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4">{error}</div>}

        {/* Step 0: Corridor + Amount */}
        {step === 0 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Choose corridor & amount</h2>
              <p className="text-gray-500">Select where you&apos;re sending from and how much</p>
            </div>
            <div className="space-y-3">
              {corridors.map(c => (
                <button key={c.id} onClick={() => setSelectedCorridor(c.id)}
                  className={`w-full p-4 rounded-xl border-2 text-left transition ${selectedCorridor === c.id ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">
                        {c.sourceCountry === 'GB' ? '🇬🇧 UK' : '🇺🇸 US'} → 🇰🇪 Kenya M-Pesa
                      </p>
                      <p className="text-sm text-gray-500">Rate: 1 {c.sourceCurrency} = {c.baseRate} KES · Fee: {c.sourceCurrency === 'GBP' ? '£' : c.sourceCurrency === 'EUR' ? '€' : c.sourceCurrency === 'CAD' ? 'C$' : '$'}{c.feeFixed.toFixed(2)}</p>
                    </div>
                    {selectedCorridor === c.id && <Check className="w-5 h-5 text-emerald-600" />}
                  </div>
                </button>
              ))}
            </div>
            {corridor && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">You send ({cur})</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">{cur === 'GBP' ? '£' : cur === 'EUR' ? '€' : cur === 'CAD' ? 'C$' : '$'}</span>
                  <input type="number" min={corridor.minAmount} max={corridor.maxAmount} step="0.01" value={amount}
                    onChange={e => setAmount(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-2xl font-bold focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                    placeholder="0.00" />
                </div>
                <p className="text-sm text-gray-400 mt-1">Min: {cur}{corridor.minAmount} · Max: {cur}{corridor.maxAmount}</p>
              </div>
            )}
            <button onClick={getQuote} disabled={!selectedCorridor || !amount || loading}
              className="w-full py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2 transition">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Get Quote <ArrowRight className="w-5 h-5" /></>}
            </button>
          </div>
        )}

        {/* Step 1: Quote Confirmation */}
        {step === 1 && quote && corridor && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Confirm your quote</h2>
              <p className="text-gray-500">Review the exchange rate and fees</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <p className="text-sm text-gray-500">You send</p>
                <p className="text-3xl font-bold text-gray-900">{formatCurrency(parseFloat(amount), cur)}</p>
              </div>
              <div className="px-6 py-4 space-y-3 bg-gray-50">
                <div className="flex justify-between text-sm"><span className="text-gray-500">Exchange rate</span><span className="font-medium">1 {cur} = {quote.rate.toFixed(2)} KES</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">Transfer fee</span><span className="font-medium">{formatCurrency(quote.feeAmount, cur)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">Provider</span><span className="font-medium">{corridor.provider?.name}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">Est. delivery</span><span className="font-medium">~{corridor.estimatedMins} mins</span></div>
              </div>
              <div className="p-6">
                <p className="text-sm text-gray-500">Recipient gets</p>
                <p className="text-3xl font-bold text-emerald-600">{formatCurrency(quote.destAmount, 'KES')}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(0)} className="flex-1 py-3 border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50">Back</button>
              <button onClick={() => setStep(2)} className="flex-1 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 flex items-center justify-center gap-2">Continue <ArrowRight className="w-5 h-5" /></button>
            </div>
          </div>
        )}

        {/* Step 2: Recipient */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Recipient details</h2>
              <p className="text-gray-500">Who is receiving the money?</p>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First name</label>
                  <input required value={recipient.firstName} onChange={e => setRecipient(r => ({ ...r, firstName: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last name</label>
                  <input required value={recipient.lastName} onChange={e => setRecipient(r => ({ ...r, lastName: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">M-Pesa phone number</label>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-2.5 bg-gray-100 rounded-lg text-sm font-medium text-gray-600">🇰🇪 +254</span>
                  <input required value={recipient.phone} onChange={e => setRecipient(r => ({ ...r, phone: e.target.value }))} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none" placeholder="712 345 678" />
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="flex-1 py-3 border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50">Back</button>
              <button onClick={() => { if (recipient.firstName && recipient.lastName && recipient.phone) setStep(3); else setError('Fill all recipient fields'); }} className="flex-1 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 flex items-center justify-center gap-2">Continue <ArrowRight className="w-5 h-5" /></button>
            </div>
          </div>
        )}

        {/* Step 3: KYC */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Your details (KYC)</h2>
              <p className="text-gray-500">Required by regulation for your first transfer</p>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
              <Shield className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">Your information is encrypted and only used for compliance verification.</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date of birth</label>
                <input type="text" value={kyc.dob} onChange={e => setKyc(k => ({ ...k, dob: e.target.value }))} placeholder="YYYY-MM-DD" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input value={kyc.address} onChange={e => setKyc(k => ({ ...k, address: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none" placeholder="123 Main Street" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input value={kyc.city} onChange={e => setKyc(k => ({ ...k, city: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Postcode</label>
                  <input value={kyc.postcode} onChange={e => setKyc(k => ({ ...k, postcode: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Purpose of transfer</label>
                <select value={kyc.purpose} onChange={e => setKyc(k => ({ ...k, purpose: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none">
                  <option value="family">Family support</option>
                  <option value="education">Education</option>
                  <option value="business">Business</option>
                  <option value="medical">Medical</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment method</label>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setPayMethod('card')} className={`p-4 rounded-xl border-2 text-left transition ${payMethod === 'card' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200'}`}>
                    <CreditCard className={`w-6 h-6 mb-2 ${payMethod === 'card' ? 'text-emerald-600' : 'text-gray-400'}`} />
                    <p className="font-medium text-sm text-gray-900">Card payment</p>
                    <p className="text-xs text-gray-500">Instant, 1.5% surcharge</p>
                  </button>
                  <button onClick={() => setPayMethod('bank_transfer')} className={`p-4 rounded-xl border-2 text-left transition ${payMethod === 'bank_transfer' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200'}`}>
                    <Smartphone className={`w-6 h-6 mb-2 ${payMethod === 'bank_transfer' ? 'text-emerald-600' : 'text-gray-400'}`} />
                    <p className="font-medium text-sm text-gray-900">Bank transfer</p>
                    <p className="text-xs text-gray-500">Free, 1-2 hours</p>
                  </button>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="flex-1 py-3 border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50">Back</button>
              <button onClick={submitTransfer} disabled={loading || !kyc.dob} className="flex-1 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2 transition">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-5 h-5" /> Confirm & Pay {formatCurrency(quote?.totalCharged || 0, cur)}</>}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}