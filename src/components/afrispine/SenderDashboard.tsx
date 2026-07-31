'use client';
import { useState, useEffect } from 'react';
import { useApp, nav } from '@/stores/app';
import { ArrowRight, LogOut, User, Clock, CheckCircle, XCircle, CreditCard, Send } from 'lucide-react';

const statusColors: Record<string, string> = {
  delivered: 'text-emerald-600 bg-emerald-50', processing: 'text-amber-600 bg-amber-50',
  payment_pending: 'text-blue-600 bg-blue-50', failed: 'text-red-600 bg-red-50',
  flagged: 'text-red-600 bg-red-50', refunded: 'text-purple-600 bg-purple-50', quote: 'text-gray-600 bg-gray-50',
};

export function SenderDashboard() {
  const { sender, setRoute, logout } = useApp();
  const [stats, setStats] = useState({ total: 0, delivered: 0, pending: 0, volume: 0 });
  const [recipients, setRecipients] = useState<any[]>([]);
  const [transfers, setTransfers] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/transfers?limit=5').then(r => r.json()).then(d => {
      setTransfers(d.items || []);
      const all = d.items || [];
      setStats({ total: d.total, delivered: all.filter(t => t.status === 'delivered').length, pending: all.filter(t => t.status === 'payment_pending' || t.status === 'processing').length, volume: all.reduce((s: number, t: any) => s + t.chargeAmountUsd, 0) });
    });
    fetch('/api/recipients').then(r => r.json()).then(setRecipients);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">A</div>
            <span className="font-bold text-gray-900 hidden sm:inline">AfriSpine</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500 hidden sm:inline">{sender?.email}</span>
            <button onClick={() => setRoute('profile')} className="w-7 h-7 bg-emerald-100 rounded-full flex items-center justify-center"><User className="w-3.5 h-3.5 text-emerald-700" /></button>
            <button onClick={logout} className="text-gray-400 hover:text-red-500"><LogOut className="w-4 h-4" /></button>
          </div>
        </div>
      </nav>
      <main className="max-w-6xl mx-auto px-4 py-6 pb-20">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {sender?.firstName}</h1>
        {sender?.kycStatus !== 'verified' && <div className="mt-2 mb-4 bg-amber-50 border border-amber-200 text-amber-700 text-sm p-3 rounded-lg">Your identity verification is pending. <button onClick={() => setRoute('profile')} className="underline font-medium">Complete KYC</button></div>}

        <button onClick={() => nav('send')} className="w-full bg-emerald-600 text-white rounded-2xl p-5 flex items-center gap-4 hover:bg-emerald-700 transition mb-6 group">
          <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center"><Send className="w-5 h-5" /></div>
          <div className="text-left"><p className="text-lg font-bold">Transfer money</p><p className="text-emerald-100 text-sm">UK/US → 8 African countries</p></div>
          <ArrowRight className="w-5 h-5 ml-auto group-hover:translate-x-1 transition" />
        </button>

        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Total sent', value: `$${stats.volume.toFixed(0)}`, icon: CreditCard, color: 'text-blue-600 bg-blue-50' },
            { label: 'Delivered', value: stats.delivered, icon: CheckCircle, color: 'text-emerald-600 bg-emerald-50' },
            { label: 'In progress', value: stats.pending, icon: Clock, color: 'text-amber-600 bg-amber-50' },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-xl p-4 border border-gray-100">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${s.color} mb-2`}><s.icon className="w-4 h-4" /></div>
              <p className="text-lg font-bold text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>

        {recipients.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-2">Saved recipients</h2>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {recipients.slice(0, 5).map(r => (
                <button key={r.id} onClick={() => nav('send')} className="flex-shrink-0 bg-white border border-gray-100 rounded-xl px-3 py-2 flex items-center gap-2 hover:border-emerald-200 transition">
                  <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 text-sm font-bold">{r.fullName[0]}</div>
                  <div className="text-left"><p className="text-sm font-medium">{r.fullName}</p><p className="text-xs text-gray-400">{r.country}</p></div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-900">Recent transfers</h2>
          <button onClick={() => nav('transfers')} className="text-xs text-emerald-600 hover:underline">View all</button>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50">
          {transfers.length === 0 && <p className="p-6 text-center text-gray-400 text-sm">No transfers yet</p>}
          {transfers.map((t: any) => (
            <button key={t.id} onClick={() => { useApp.getState().setTransferId(t.id); nav('transfer-detail'); }} className="w-full p-3 flex items-center justify-between hover:bg-gray-50 transition text-left">
              <div><p className="font-medium text-sm text-gray-900">{t.recipient?.fullName || 'Transfer'}</p><p className="text-xs text-gray-400">{new Date(t.createdAt).toLocaleDateString()} · {t.currencySend} → {t.currencyReceive}</p></div>
              <div className="text-right"><p className="font-bold text-sm">${t.chargeAmountUsd?.toFixed(2)}</p><span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${statusColors[t.status] || ''}`}>{t.status.replace('_', ' ')}</span></div>
            </button>
          ))}
        </div>

        <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex justify-around py-2">
          <button onClick={() => nav('dashboard')} className="flex flex-col items-center gap-0.5 text-emerald-600"><CreditCard className="w-5 h-5" /><span className="text-[10px]">Home</span></button>
          <button onClick={() => nav('send')} className="flex flex-col items-center gap-0.5 text-gray-400"><Send className="w-5 h-5" /><span className="text-[10px]">Send</span></button>
          <button onClick={() => nav('transfers')} className="flex flex-col items-center gap-0.5 text-gray-400"><Clock className="w-5 h-5" /><span className="text-[10px]">History</span></button>
          <button onClick={() => nav('profile')} className="flex flex-col items-center gap-0.5 text-gray-400"><User className="w-5 h-5" /><span className="text-[10px]">Profile</span></button>
        </div>
      </main>
    </div>
  );
}