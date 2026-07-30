'use client';
import { useState, useEffect } from 'react';
import { useApp, nav } from '@/stores/app';
import { ArrowLeft, Loader2, CheckCircle, XCircle, Clock } from 'lucide-react';

const SC: Record<string, string> = { delivered: 'text-emerald-600 bg-emerald-50', processing: 'text-amber-600 bg-amber-50', payment_pending: 'text-blue-600 bg-blue-50', failed: 'text-red-600 bg-red-50', flagged: 'text-red-600 bg-red-50', refunded: 'text-purple-600 bg-purple-50', quote: 'text-gray-600 bg-gray-50' };

export function TransfersPage() {
  const { setRoute } = useApp();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetch('/api/transfers?limit=50').then(r => r.json()).then(d => { setItems(d.items || []); setLoading(false); }); }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={() => setRoute('dashboard')} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></button>
          <span className="font-semibold">Transfer History</span>
        </div>
      </nav>
      <main className="max-w-4xl mx-auto px-4 py-6">
        {loading ? <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-emerald-500 animate-spin" /></div> :
        items.length === 0 ? <p className="text-center py-20 text-gray-400">No transfers yet</p> :
        <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50">
          {items.map((t: any) => (
            <button key={t.id} onClick={() => { useApp.getState().setTransferId(t.id); nav('transfer-detail'); }} className="w-full p-4 flex items-center justify-between hover:bg-gray-50 text-left">
              <div><p className="font-medium text-sm">{t.recipient?.fullName || 'Transfer'}</p><p className="text-xs text-gray-400">{new Date(t.createdAt).toLocaleDateString()} · {t.currencySend} → {t.currencyReceive}</p></div>
              <div className="text-right"><p className="font-bold text-sm">${t.chargeAmountUsd?.toFixed(2)}</p><span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${SC[t.status]}`}>{t.status.replace('_', ' ')}</span></div>
            </button>
          ))}
        </div>}
      </main>
    </div>
  );
}