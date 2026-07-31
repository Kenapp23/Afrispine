'use client';
import { nav } from '@/stores/app';
import { ArrowRight, Zap, Clock, Shield, Globe, Smartphone, ChevronRight } from 'lucide-react';

export function Landing() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => nav('landing')}>
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">A</div>
            <span className="text-xl font-bold text-gray-900">AfriSpine</span>
          </div>
          <div className="hidden sm:flex items-center gap-6 text-sm text-gray-600">
            <button onClick={() => nav('pricing')} className="hover:text-emerald-600 transition">Pricing</button>
            <button onClick={() => nav('login')} className="hover:text-emerald-600 transition">Log in</button>
            <button onClick={() => nav('signup')} className="px-5 py-2 text-sm font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition">Get Started</button>
          </div>
          <div className="sm:hidden flex gap-2">
            <button onClick={() => nav('login')} className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg">Log in</button>
            <button onClick={() => nav('signup')} className="px-3 py-1.5 text-sm bg-emerald-600 text-white rounded-lg">Sign up</button>
          </div>
        </div>
      </nav>

      <main className="flex-1">
        <section className="max-w-6xl mx-auto px-4 pt-16 sm:pt-24 pb-12 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-sm font-medium mb-6">
            <Shield className="w-4 h-4" /> Secure payments · CBK licensed
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
            Send money to Africa.<br />
            <span className="text-emerald-600">More arrives. Less hassle.</span>
          </h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-8">
            AfriSpine matches your transfer to the best rail — M-Pesa, bank, PAPSS, or Ripple —
            so more money reaches your family, faster.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={() => nav('signup')} className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition text-lg">Start Sending <ArrowRight className="w-5 h-5" /></button>
            <button onClick={() => nav('pricing')} className="px-8 py-3.5 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:border-emerald-300 transition text-lg">See rates</button>
          </div>
        </section>

        {/* How it works */}
        <section className="bg-gray-50 py-16">
          <div className="max-w-5xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-10">How it works</h2>
            <div className="grid sm:grid-cols-3 gap-8">
              {[
                { step: '1', title: 'Enter amount', desc: 'Choose your corridor, enter how much to send. We lock the rate for 15 minutes.' },
                { step: '2', title: 'Pay securely', desc: 'Enter your card details securely through our payment processor. Charged in USD, settles to Kenya.' },
                { step: '3', title: 'Money delivered', desc: 'We route to the best provider. Recipient gets money on M-Pesa or bank in minutes.' },
              ].map(s => (
                <div key={s.step} className="text-center">
                  <div className="w-12 h-12 mx-auto bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-xl font-bold mb-4">{s.step}</div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{s.title}</h3>
                  <p className="text-gray-500">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Corridors */}
        <section className="py-16 max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-3">Where you can send</h2>
          <p className="text-gray-500 text-center mb-8">8 receive countries. Multiple rails per corridor.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { flag: '🇬🇧→🇰🇪', label: 'UK → Kenya', rate: '£1 = KES 169.3' },
              { flag: '🇺🇸→🇰🇪', label: 'US → Kenya', rate: '$1 = KES 133.3' },
              { flag: '🇬🇧→🇳🇬', label: 'UK → Nigeria', rate: '£1 = NGN 1,920' },
              { flag: '🇬🇧→🇬🇭', label: 'UK → Ghana', rate: '£1 = GHS 15.2' },
              { flag: '🇺🇸→🇳🇬', label: 'US → Nigeria', rate: '$1 = NGN 1,512' },
              { flag: '🇺🇸→🇬🇭', label: 'US → Ghana', rate: '$1 = GHS 12.0' },
              { flag: '🇬🇧→🇿🇦', label: 'UK → South Africa', rate: 'Bank transfer' },
              { flag: '🇺🇸→🇺🇬', label: 'US → Uganda', rate: '$1 = UGX 3,680' },
            ].map(c => (
              <button key={c.label} onClick={() => nav('send')} className="bg-white rounded-xl p-4 border border-gray-100 hover:shadow-lg hover:border-emerald-200 transition text-left group">
                <div className="text-2xl mb-2">{c.flag}</div>
                <p className="font-semibold text-gray-900 text-sm">{c.label}</p>
                <p className="text-xs text-gray-500 mt-1">{c.rate}</p>
                <ChevronRight className="w-4 h-4 text-emerald-500 mt-2 group-hover:translate-x-1 transition" />
              </button>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="bg-gray-50 py-16">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-10">Why AfriSpine?</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { icon: Zap, t: 'Best rates always', d: 'We score multiple rails in real-time so your money takes the fastest, cheapest path.' },
                { icon: Globe, t: 'Non-custodial', d: 'We never hold your funds. Our payment processor collects, provider delivers. Zero balance sheet risk.' },
                { icon: Clock, t: 'Minutes, not days', d: 'M-Pesa delivery in ~15 minutes. Bank transfers same day. Ripple in seconds.' },
                { icon: Shield, t: 'Licensed & regulated', d: 'Our payment processor is licensed by the Central Bank of Kenya. Your money is in safe hands.' },
                { icon: Smartphone, t: 'M-Pesa, banks & more', d: 'Mobile money, bank transfer, PAPSS, or Ripple — choose what works for your recipient.' },
                { icon: ArrowRight, t: '1–3% transparent fees', d: 'Flat percentage fee. What you see is what you pay. No hidden markups.' },
              ].map((f, i) => (
                <div key={i} className="bg-white rounded-xl p-6 border border-gray-100">
                  <f.icon className="w-8 h-8 text-emerald-600 mb-3" />
                  <h3 className="font-bold text-gray-900 mb-1">{f.t}</h3>
                  <p className="text-sm text-gray-500">{f.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-100 py-8 mt-auto">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-400">
          <div className="flex items-center gap-2"><div className="w-6 h-6 bg-emerald-600 rounded flex items-center justify-center text-white font-bold text-xs">A</div>AfriSpine &copy; 2025 · Nairobi, Kenya</div>
          <p>Smart cross-border payments to Africa</p>
        </div>
      </footer>
    </div>
  );
}