'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { ShieldAlert, ShieldCheck, ShieldX, Clock, AlertTriangle, X, ChevronRight, CheckCircle, Ban, Banknote, FileText } from 'lucide-react';

type Flag = any;
type Txn = any;

const outcomeColor = (o: string) => o === 'cleared' ? 'bg-emerald-100 text-emerald-700' : o === 'blocked' ? 'bg-red-100 text-red-700' : o === 'refunded' ? 'bg-gray-100 text-gray-600' : 'bg-amber-100 text-amber-700';
const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

export function AdminCompliancePage() {
  const [flags, setFlags] = useState<Flag[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Flag | null>(null);
  const [txn, setTxn] = useState<Txn | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [noteInput, setNoteInput] = useState('');

  const fetchFlags = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/compliance');
      const data = await res.json();
      setFlags(data.flags || []);
    } catch { toast.error('Failed to load compliance data'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchFlags(); }, [fetchFlags]);

  const stats = React.useMemo(() => ({
    pending: flags.filter(f => !f.outcome || f.outcome === '').length,
    cleared: flags.filter(f => f.outcome === 'cleared').length,
    blocked: flags.filter(f => f.outcome === 'blocked').length,
    total: flags.length,
  }), [flags]);

  const openDetail = async (flag: Flag) => {
    setSelected(flag);
    setDrawerOpen(true);
    try {
      const res = await fetch('/api/admin/compliance/' + flag.transactionId);
      const data = await res.json();
      setTxn(data.transaction);
      if (data.flags?.length > 1) setSelected(data.flags[0]);
    } catch { toast.error('Failed to load detail'); }
  };

  const takeAction = async (action: string) => {
    if (!selected) return;
    try {
      const res = await fetch('/api/admin/compliance/' + selected.transactionId, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, adminName: 'Admin', notes: action === 'note' ? noteInput : undefined }),
      });
      if (!res.ok) throw new Error();
      toast.success('Action completed');
      setNoteInput('');
      fetchFlags();
      setDrawerOpen(false);
    } catch { toast.error('Action failed'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Compliance</h1>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: 'Pending review', val: stats.pending, icon: Clock, color: 'text-amber-600 bg-amber-50' },
          { label: 'Cleared', val: stats.cleared, icon: ShieldCheck, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Blocked', val: stats.blocked, icon: ShieldX, color: 'text-red-600 bg-red-50' },
          { label: 'Total flagged', val: stats.total, icon: ShieldAlert, color: 'text-orange-600 bg-orange-50' },
        ].map(c => {
          const Icon = c.icon;
          return (
            <Card key={c.label}>
              <CardContent className="flex items-center gap-4 pt-6">
                <div className={'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ' + c.color}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground truncate">{c.label}</p>
                  <p className="text-xl font-bold text-gray-900">{c.val}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {['Flagged', 'Reference', 'Sender', 'Recipient', 'Amount', 'Reason', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}><td colSpan={8} className="px-4 py-4"><Skeleton className="h-5 w-full" /></td></tr>
                )) : flags.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-16 text-center">
                    <ShieldAlert className="mx-auto h-10 w-10 text-muted-foreground/30" />
                    <p className="mt-3 text-sm font-medium text-muted-foreground">No flagged transactions</p>
                  </td></tr>
                ) : flags.map(f => (
                  <tr key={f.id} className="border-b border-border/50 hover:bg-muted/20 cursor-pointer" onClick={() => openDetail(f)}>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{fmtDate(f.createdAt)}</td>
                    <td className="px-4 py-3 font-mono text-xs">{f.transaction?.reference || '—'}</td>
                    <td className="px-4 py-3">{f.transaction?.sender ? (f.transaction.sender.firstName + ' ' + f.transaction.sender.lastName).trim() : f.sender?.email || '—'}</td>
                    <td className="px-4 py-3">{f.transaction?.recipient?.fullName || '—'}</td>
                    <td className="px-4 py-3">{f.transaction ? (f.transaction.currencySend || 'GBP') + ' ' + (f.transaction.totalCharged || f.transaction.amountSend).toFixed(2) : '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{f.flagReason}</td>
                    <td className="px-4 py-3"><span className={'inline-flex rounded-full px-2 py-0.5 text-xs font-medium ' + outcomeColor(f.outcome)}>{f.outcome || 'pending'}</span></td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <Button variant="ghost" size="sm" className="h-8" onClick={() => openDetail(f)}>View</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {drawerOpen && selected && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setDrawerOpen(false)}>
          <div className="fixed inset-0 bg-black/30" />
          <div className="relative z-10 w-full max-w-[480px] bg-white overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-4">
              <div>
                <h2 className="font-semibold text-gray-900">{txn?.reference || 'Transaction'}</h2>
                <p className="text-xs text-muted-foreground">{fmtDate(selected.createdAt)}</p>
              </div>
              <button className="p-1 hover:bg-muted rounded" onClick={() => setDrawerOpen(false)}><X className="h-5 w-5" /></button>
            </div>

            <div className="space-y-6 p-6">
              {txn && (
                <>
                  <div className="rounded-lg border p-4 space-y-2 text-sm">
                    <h3 className="font-semibold text-gray-900">Transaction Details</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <div><p className="text-xs text-muted-foreground">Send</p><p className="font-medium">{txn.currencySend} {txn.amountSend?.toFixed(2)}</p></div>
                      <div><p className="text-xs text-muted-foreground">Receive</p><p className="font-medium">{txn.currencyReceive} {txn.amountReceive?.toFixed(2)}</p></div>
                      <div><p className="text-xs text-muted-foreground">FX Rate</p><p className="font-medium">1 {txn.currencySend} = {txn.fxRate} {txn.currencyReceive}</p></div>
                      <div><p className="text-xs text-muted-foreground">Fee</p><p className="font-medium">{txn.feeAmount?.toFixed(2)}</p></div>
                      <div><p className="text-xs text-muted-foreground">Rail</p><p className="font-medium">{txn.rail}</p></div>
                      <div><p className="text-xs text-muted-foreground">Provider</p><p className="font-medium">{txn.provider?.displayName || '—'}</p></div>
                    </div>
                  </div>

                  <div className="rounded-lg border p-4 space-y-2 text-sm">
                    <h3 className="font-semibold text-gray-900">AML Details</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <div><p className="text-xs text-muted-foreground">Flag reason</p><p className="font-medium text-amber-600">{selected.flagReason}</p></div>
                      <div><p className="text-xs text-muted-foreground">Outcome</p><span className={'inline-flex rounded-full px-2 py-0.5 text-xs font-medium ' + outcomeColor(selected.outcome)}>{selected.outcome || 'pending'}</span></div>
                      <div><p className="text-xs text-muted-foreground">Reviewed by</p><p className="font-medium">{selected.reviewedByName || '—'}</p></div>
                      <div><p className="text-xs text-muted-foreground">Reviewed at</p><p className="font-medium">{fmtDate(selected.reviewedAt)}</p></div>
                    </div>
                  </div>

                  {txn.events && txn.events.length > 0 && (
                    <div>
                      <h3 className="mb-3 text-sm font-semibold text-gray-900">Status Timeline</h3>
                      <div className="space-y-0">
                        {txn.events.map((ev: any, i: number) => (
                          <div key={ev.id} className="flex gap-3">
                            <div className="flex flex-col items-center">
                              <div className={'flex h-6 w-6 items-center justify-center rounded-full ' + (ev.eventType.includes('fail') || ev.eventType.includes('error') ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600')}>
                                <CheckCircle className="h-3.5 w-3.5" />
                              </div>
                              {i < txn.events.length - 1 && <div className="w-0.5 h-8 bg-border" />}
                            </div>
                            <div className="pb-4">
                              <p className="text-sm font-medium">{ev.eventType.replace(/_/g, ' ')}</p>
                              <p className="text-xs text-muted-foreground">{fmtDate(ev.createdAt)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              <div>
                <h3 className="mb-3 text-sm font-semibold text-gray-900">Review Actions</h3>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" className="bg-emerald-600 text-white hover:bg-emerald-700" onClick={() => takeAction('clear')} disabled={selected.outcome === 'cleared'}>
                    <ShieldCheck className="mr-1.5 h-3.5 w-3.5" /> Clear
                  </Button>
                  <Button size="sm" variant="outline" className="text-red-600" onClick={() => takeAction('block')} disabled={selected.outcome === 'blocked'}>
                    <ShieldX className="mr-1.5 h-3.5 w-3.5" /> Block
                  </Button>
                  <Button size="sm" variant="outline" className="text-amber-600" onClick={() => takeAction('refund')} disabled={selected.outcome === 'refunded'}>
                    <Banknote className="mr-1.5 h-3.5 w-3.5" /> Refund
                  </Button>
                </div>
              </div>

              <div>
                <h3 className="mb-3 text-sm font-semibold text-gray-900">Add Note</h3>
                <div className="flex gap-2">
                  <Input value={noteInput} onChange={e => setNoteInput(e.target.value)} placeholder="Add a compliance note..." className="flex-1 h-9" />
                  <Button size="sm" variant="outline" className="h-9" disabled={!noteInput.trim()} onClick={() => takeAction('note')}>
                    <FileText className="mr-1.5 h-3.5 w-3.5" /> Add
                  </Button>
                </div>
                {selected.notes && (
                  <div className="mt-3 rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground whitespace-pre-wrap">{selected.notes}</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}