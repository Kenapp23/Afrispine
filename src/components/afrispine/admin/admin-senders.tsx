'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Users, ShieldCheck, ShieldX, Clock, Search, MoreHorizontal, X, ChevronLeft, ChevronRight, UserPlus, Ban, CheckCircle, AlertTriangle, FileText, Edit3, Save } from 'lucide-react';

type Sender = any;

export function AdminSendersPage() {
  const [senders, setSenders] = useState<Sender[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [kycFilter, setKycFilter] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Sender | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [editingLimit, setEditingLimit] = useState(false);
  const [limitVal, setLimitVal] = useState(0);
  const [saving, setSaving] = useState(false);
  const pages = Math.ceil(total / 25);

  const fetchSenders = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (kycFilter) p.set('kycStatus', kycFilter);
      if (search) p.set('search', search);
      p.set('page', String(page));
      p.set('limit', '25');
      const res = await fetch('/api/admin/senders?' + p.toString());
      const data = await res.json();
      setSenders(data.senders || []);
      setTotal(data.total || 0);
    } catch { toast.error('Failed to load senders'); }
    finally { setLoading(false); }
  }, [kycFilter, search, page]);

  useEffect(() => { fetchSenders(); }, [fetchSenders]);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const stats = React.useMemo(() => ({
    total: senders.length + (page > 1 ? (page - 1) * 25 : 0),
    approved: senders.filter(s => s.kycStatus === 'approved').length,
    pending: senders.filter(s => s.kycStatus === 'pending').length,
    suspended: senders.filter(s => s.accountStatus === 'suspended').length,
  }), [senders]);

  const kycColor = (s: string) => s === 'approved' ? 'bg-emerald-100 text-emerald-700' : s === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700';
  const statusColor = (s: string) => s === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700';
  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
  const initials = (s: Sender) => ((s.firstName?.[0] || '') + (s.lastName?.[0] || '')).toUpperCase() || s.email[0].toUpperCase();

  const updateSender = async (id: string, data: any) => {
    try {
      const res = await fetch('/api/admin/senders', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, ...data }) });
      if (!res.ok) throw new Error();
      toast.success('Updated');
      fetchSenders();
      if (selected?.id === id) {
        const r2 = await fetch('/api/admin/senders/' + id);
        const d2 = await r2.json();
        setSelected(d2.sender);
      }
    } catch { toast.error('Update failed'); }
  };

  const addNote = async () => {
    if (!selected || !noteText.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/senders/' + selected.id + '/notes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ note: noteText, adminName: 'Admin' }) });
      if (!res.ok) throw new Error();
      setNoteText('');
      const r2 = await fetch('/api/admin/senders/' + selected.id);
      const d2 = await r2.json();
      setSelected(d2.sender);
      toast.success('Note added');
    } catch { toast.error('Failed to add note'); }
    finally { setSaving(false); }
  };

  const openDrawer = (s: Sender) => { setSelected(s); setDrawerOpen(true); setEditingLimit(false); setLimitVal(s.dailyLimitGbp); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Senders</h1>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: 'Total senders', val: total, icon: Users },
          { label: 'KYC approved', val: stats.approved, icon: ShieldCheck, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'KYC pending', val: stats.pending, icon: Clock, color: 'text-amber-600 bg-amber-50' },
          { label: 'Suspended', val: stats.suspended, icon: Ban, color: 'text-red-600 bg-red-50' },
        ].map(c => {
          const Icon = c.icon;
          return (
            <Card key={c.label}>
              <CardContent className="flex items-center gap-4 pt-6">
                <div className={'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ' + (c.color || 'text-emerald-600 bg-emerald-50')}>
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

      <div className="flex flex-wrap items-center gap-3">
        <select className="h-9 rounded-md border border-border bg-background px-3 text-sm" value={kycFilter} onChange={e => { setKycFilter(e.target.value); setPage(1); }}>
          <option value="">All KYC</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9 h-9" placeholder="Search name, email, phone..." value={searchInput} onChange={e => { setSearchInput(e.target.value); setPage(1); }} />
        </div>
        {(kycFilter || search) && (
          <button className="text-xs text-muted-foreground hover:text-foreground" onClick={() => { setKycFilter(''); setSearchInput(''); setSearch(''); setPage(1); }}>
            Clear filters
          </button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {['Joined', 'Name', 'Email', 'Phone', 'KYC', 'Transfers', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}><td colSpan={8} className="px-4 py-4"><Skeleton className="h-5 w-full" /></td></tr>
                )) : senders.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-16 text-center">
                    <Users className="mx-auto h-10 w-10 text-muted-foreground/30" />
                    <p className="mt-3 text-sm font-medium text-muted-foreground">No senders found</p>
                  </td></tr>
                ) : senders.map(s => (
                  <tr key={s.id} className="border-b border-border/50 hover:bg-muted/20 cursor-pointer" onClick={() => openDrawer(s)}>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{fmtDate(s.createdAt)}</td>
                    <td className="px-4 py-3 font-medium">{(s.firstName + ' ' + s.lastName).trim() || '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{s.email}</td>
                    <td className="px-4 py-3 text-muted-foreground">{s.phone || '—'}</td>
                    <td className="px-4 py-3"><span className={'inline-flex rounded-full px-2 py-0.5 text-xs font-medium ' + kycColor(s.kycStatus)}>{s.kycStatus}</span></td>
                    <td className="px-4 py-3">{s._count?.transactions || 0}</td>
                    <td className="px-4 py-3"><span className={'inline-flex rounded-full px-2 py-0.5 text-xs font-medium ' + statusColor(s.accountStatus)}>{s.accountStatus}</span></td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <div className="relative">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setOpenMenuId(openMenuId === s.id ? null : s.id)}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                        {openMenuId === s.id && (
                          <div className="absolute right-0 z-50 mt-1 w-44 rounded-md border bg-white py-1 shadow-lg">
                            <button className="w-full px-3 py-1.5 text-left text-sm hover:bg-muted" onClick={() => { openDrawer(s); setOpenMenuId(null); }}>View profile</button>
                            {s.kycStatus === 'pending' && <>
                              <button className="w-full px-3 py-1.5 text-left text-sm text-emerald-600 hover:bg-muted" onClick={() => { updateSender(s.id, { kycStatus: 'approved' }); setOpenMenuId(null); }}>Approve KYC</button>
                              <button className="w-full px-3 py-1.5 text-left text-sm text-red-600 hover:bg-muted" onClick={() => { updateSender(s.id, { kycStatus: 'rejected' }); setOpenMenuId(null); }}>Reject KYC</button>
                            </>}
                            {s.accountStatus === 'active'
                              ? <button className="w-full px-3 py-1.5 text-left text-sm text-red-600 hover:bg-muted" onClick={() => { updateSender(s.id, { accountStatus: 'suspended' }); setOpenMenuId(null); }}>Suspend</button>
                              : <button className="w-full px-3 py-1.5 text-left text-sm text-emerald-600 hover:bg-muted" onClick={() => { updateSender(s.id, { accountStatus: 'active' }); setOpenMenuId(null); }}>Reinstate</button>
                            }
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {total > 25 && (
            <div className="flex items-center justify-between border-t px-4 py-3">
              <p className="text-xs text-muted-foreground">Showing {(page - 1) * 25 + 1}–{Math.min(page * 25, total)} of {total}</p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="h-8" disabled={page <= 1} onClick={() => setPage(p => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
                <span className="text-sm">{page} / {pages}</span>
                <Button variant="outline" size="sm" className="h-8" disabled={page >= pages} onClick={() => setPage(p => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {drawerOpen && selected && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setDrawerOpen(false)}>
          <div className="fixed inset-0 bg-black/30" />
          <div className="relative z-10 w-full max-w-[480px] bg-white overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-lg font-bold text-emerald-700">{initials(selected)}</div>
                <div>
                  <p className="font-semibold text-gray-900">{(selected.firstName + ' ' + selected.lastName).trim()}</p>
                  <p className="text-sm text-muted-foreground">{selected.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={'rounded-full px-2 py-0.5 text-xs font-medium ' + statusColor(selected.accountStatus)}>{selected.accountStatus}</span>
                <span className={'rounded-full px-2 py-0.5 text-xs font-medium ' + kycColor(selected.kycStatus)}>KYC: {selected.kycStatus}</span>
                <button className="ml-2 p-1 hover:bg-muted rounded" onClick={() => setDrawerOpen(false)}><X className="h-5 w-5" /></button>
              </div>
            </div>

            <div className="space-y-6 p-6">
              <div>
                <h3 className="mb-3 text-sm font-semibold text-gray-900">Personal Details</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {[['First name', selected.firstName], ['Last name', selected.lastName], ['Email', selected.email], ['Phone', selected.phone], ['Country', selected.countryOfResidence], ['DOB', selected.dob], ['Member since', fmtDate(selected.createdAt)], ['Last active', fmtDate(selected.lastActiveAt)]].map(([l, v]) => (
                    <div key={String(l)}><p className="text-xs text-muted-foreground">{l}</p><p className="font-medium">{v || '—'}</p></div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="mb-3 text-sm font-semibold text-gray-900">KYC Verification</h3>
                <div className="rounded-lg border p-4 space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Status</span><span className={'rounded-full px-2 py-0.5 text-xs font-medium ' + kycColor(selected.kycStatus)}>{selected.kycStatus}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">ID Type</span><span>{selected.kycIdType || '—'}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">ID Number</span><span>{selected.kycIdNumber ? '****' + selected.kycIdNumber.slice(-4) : '—'}</span></div>
                  {selected.kycStatus === 'pending' && (
                    <div className="flex gap-2 pt-2">
                      <Button size="sm" className="bg-emerald-600 text-white hover:bg-emerald-700" onClick={() => updateSender(selected.id, { kycStatus: 'approved' })}>Approve</Button>
                      <Button size="sm" variant="outline" className="text-red-600" onClick={() => updateSender(selected.id, { kycStatus: 'rejected' })}>Reject</Button>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="mb-3 text-sm font-semibold text-gray-900">Daily Limit</h3>
                {editingLimit ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">GBP</span>
                    <Input type="number" value={limitVal} onChange={e => setLimitVal(Number(e.target.value))} className="w-32 h-9" />
                    <Button size="sm" className="h-9 bg-emerald-600 text-white" onClick={() => { updateSender(selected.id, { dailyLimitGbp: limitVal }); setEditingLimit(false); }}>Save</Button>
                    <Button size="sm" variant="outline" className="h-9" onClick={() => setEditingLimit(false)}>Cancel</Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold">GBP {selected.dailyLimitGbp.toLocaleString()}</span>
                    <Button variant="ghost" size="sm" className="h-8" onClick={() => setEditingLimit(true)}><Edit3 className="h-3.5 w-3.5" /></Button>
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-900">Internal Notes</h3>
                </div>
                <div className="space-y-2">
                  {selected.notes?.map((n: any) => (
                    <div key={n.id} className="rounded-lg border p-3 text-sm">
                      <p className="text-gray-800">{n.note}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{n.createdByName} · {fmtDate(n.createdAt)}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex gap-2">
                  <Input value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Add an internal note..." className="flex-1 h-9" />
                  <Button size="sm" className="h-9 bg-emerald-600 text-white" disabled={saving || !noteText.trim()} onClick={addNote}>Add</Button>
                </div>
              </div>

              <div className="pt-2 border-t">
                <Button variant="outline" size="sm" className={selected.accountStatus === 'active' ? 'text-red-600' : 'text-emerald-600'} onClick={() => updateSender(selected.id, { accountStatus: selected.accountStatus === 'active' ? 'suspended' : 'active' })}>
                  {selected.accountStatus === 'active' ? <><Ban className="mr-2 h-4 w-4" />Suspend account</> : <><CheckCircle className="mr-2 h-4 w-4" />Reinstate account</>}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}