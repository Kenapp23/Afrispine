'use client';
import { useState, useEffect } from 'react';
import { useApp, nav } from '@/stores/app';
import { ArrowLeft, CheckCircle, Clock, XCircle, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/fx';

const evIcons: Record<string, any> = { quote_created: CheckCircle, payment_confirmed: CheckCircle, payment_initiated: Clock, provider_instructed: Clock, delivered: CheckCircle, failed: XCircle, refunded: XCircle, aml_flagged: XCircle };
const evColors: Record<string, string> = { quote_created: 'text-gray-500', payment_confirmed: 'text-emerald-600', delivered: 'text-emerald-600', failed: 'text-red-600', processing: 'text-amber-600', provider_instructed: 'text-blue-600', aml_flagged: 'text-red-600' };

export function TransferDetail() {
  const { transferId, setRoute } = useApp();
  const [tx, setTx] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (transferId) fetch(`/api/transfers/${transferId}`).then(r => r.json()).then(d => { setTx(d); setLoading(false); }); }, [transferId]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 text-emerald-500 animate-spin" /></div>;
  if (!tx) return <div className="min-h-screen flex items-center justify-center text-gray-400">Not found</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={() => nav('transfers')} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></button>
          <span className="font-semibold">{tx.reference}</span>
          <span className={`ml-auto text-xs font-medium px-2 py-0.5 rounded-full ${evColors[tx.status] || 'text-gray-500 bg-gray-50'}`}>{tx.status.replace('_', ' ')}</span>
        </div>
      </nav>
      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="grid grid-cols-2 gap-6">
            <div><p className="text-sm text-gray-500">You sent</p><p className="text-2xl font-bold">${tx.chargeAmountUsd?.toFixed(2)} USD</p><p className="text-xs text-gray-400">{formatCurrency(tx.amountSend, tx.currencySend)} equivalent</p></div>
            <div className="text-right"><p className="text-sm text-gray-500">They receive</p><p className="text-2xl font-bold text-emerald-600">{formatCurrency(tx.amountReceive, tx.currencyReceive)}</p></div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-900 mb-3">Timeline</h3>
          <div className="space-y-0">
            {tx.events?.map((ev: any, i: number) => {
              const Icon = evIcons[ev.eventType] || Clock;
              const color = evColors[ev.eventType] || 'text-gray-400';
              return (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center"><div className={`w-6 h-6 rounded-full flex items-center justify-center bg-gray-50 ${color}`}><Icon className="w-3.5 h-3.5" /></div>{i < tx.events.length - 1 && <div className="w-px h-8 bg-gray-200" />}</div>
                  <div className="pb-6"><p className="font-medium text-sm text-gray-900">{ev.eventType.replace(/_/g, ' ')}</p><p className="text-xs text-gray-400">{new Date(ev.createdAt).toLocaleString()} {ev.actor ? `· ${ev.actor}` : ''}</p></div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-2">
          <h3 className="font-semibold text-gray-900 mb-3">Details</h3>
          {[
            ['Recipient', tx.recipient?.fullName],
            ['Phone', tx.recipient?.phone],
            ['Rail', tx.rail?.replace('_', ' ')],
            ['Provider', tx.provider?.name || '—'],
            ['FX Rate', `1 ${tx.currencySend} = ${tx.fxRate} ${tx.currencyReceive}`],
            ['Fee', `${tx.feePct}% (${formatCurrency(tx.feeAmount, tx.currencySend)})`],
            ['Paystack Ref', tx.paystackRef || '—'],
            ['Created', new Date(tx.createdAt).toLocaleString()],
            ['Failure reason', tx.failureReason || '—'],
          ].map(([l, v]) => <div key={l as string} className="flex justify-between py-1.5 border-b border-gray-50 last:border-0"><span className="text-sm text-gray-500">{l}</span><span className="text-sm font-medium text-gray-900">{v as string}</span></div>)}
        </div>

        <button onClick={() => nav('send')} className="w-full py-3 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700">Send another</button>
      </main>
    </div>
  );
}