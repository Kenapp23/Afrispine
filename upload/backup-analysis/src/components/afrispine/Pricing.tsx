'use client';
import { useState, useEffect } from 'react';
import { nav } from '@/stores/app';
import { ArrowLeft } from 'lucide-react';

export function Pricing() {
  const [corridors, setCorridors] = useState<any[]>([]);
  useEffect(() => { fetch('/api/corridors').then(r => r.json()).then(setCorridors); }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-4">
          <button onClick={() => nav('landing')} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></button>
          <span className="font-semibold text-gray-900">Live Rates</span>
        </div>
      </nav>
      <main className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Corridor Rates</h1>
        <p className="text-gray-500 mb-8">1.5% fee on most corridors. Charged in USD via Paystack.</p>
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-100 bg-gray-50">
              <th className="p-3 text-left font-medium text-gray-500">Route</th>
              <th className="p-3 text-left font-medium text-gray-500">Method</th>
              <th className="p-3 text-left font-medium text-gray-500">Fee</th>
              <th className="p-3 text-left font-medium text-gray-500">ETA</th>
              <th className="p-3"></th>
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {corridors.map(c => (
                <tr key={c.id}>
                  <td className="p-3 font-medium">{c.sendCountry === 'GB' ? '🇬🇧' : '🇺🇸'} {c.sendCurrency} → {c.receiveCurrency === 'KES' ? '🇰🇪' : c.receiveCurrency === 'NGN' ? '🇳🇬' : '🌍'} {c.receiveCurrency}</td>
                  <td className="p-3 text-gray-500">{c.receiveMethod.replace('_', ' ')}</td>
                  <td className="p-3 text-gray-500">{c.feePctDefault}%</td>
                  <td className="p-3 text-gray-500">~{c.estimatedMins} min</td>
                  <td className="p-3"><button onClick={() => nav('send')} className="text-emerald-600 text-sm font-medium hover:underline">Send →</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}