'use client';

import React, { useState, useMemo } from 'react';
import { useAppStore } from '@/stores/app';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Download, ChevronLeft, ChevronRight, X } from 'lucide-react';

const statusColor: Record<string, string> = {
  delivered: 'bg-emerald-100 text-emerald-700',
  processing: 'bg-blue-100 text-blue-700',
  pending: 'bg-gray-100 text-gray-700',
  failed: 'bg-red-100 text-red-700',
  refunded: 'bg-amber-100 text-amber-700',
};

const statusIcon: Record<string, string> = {
  delivered: '✅',
  processing: '⏳',
  pending: '⏳',
  failed: '❌',
  refunded: '↩',
};

interface Transfer {
  id: string;
  recipient: string;
  amount: string;
  receiveAmount: string;
  receiveCurrency: string;
  status: string;
  date: string;
  corridor: string;
}

const fallbackTransfers: Transfer[] = [
  { id: 'TXN-001', recipient: 'Jane Wanjiku', amount: '£100.00', receiveAmount: 'KES 19,342', receiveCurrency: 'KES', status: 'delivered', date: '28 Jun 2025', corridor: 'GB → KE' },
  { id: 'TXN-002', recipient: 'Emeka Okafor', amount: '£250.00', receiveAmount: 'NGN 496,875', receiveCurrency: 'NGN', status: 'processing', date: '29 Jun 2025', corridor: 'GB → NG' },
  { id: 'TXN-003', recipient: 'Kwame Asante', amount: '£75.00', receiveAmount: 'GHS 1,149', receiveCurrency: 'GHS', status: 'delivered', date: '25 Jun 2025', corridor: 'GB → GH' },
  { id: 'TXN-004', recipient: 'Amina Hassan', amount: '£50.00', receiveAmount: 'KES 9,671', receiveCurrency: 'KES', status: 'pending', date: '30 Jun 2025', corridor: 'GB → KE' },
  { id: 'TXN-005', recipient: 'Fatou Diallo', amount: '£200.00', receiveAmount: 'GHS 3,064', receiveCurrency: 'GHS', status: 'failed', date: '24 Jun 2025', corridor: 'GB → GH' },
  { id: 'TXN-006', recipient: 'John Ochieng', amount: '£150.00', receiveAmount: 'KES 29,013', receiveCurrency: 'KES', status: 'delivered', date: '22 Jun 2025', corridor: 'GB → KE' },
  { id: 'TXN-007', recipient: 'Chidi Nwosu', amount: '£300.00', receiveAmount: 'NGN 596,250', receiveCurrency: 'NGN', status: 'refunded', date: '20 Jun 2025', corridor: 'GB → NG' },
  { id: 'TXN-008', recipient: 'Mary Akinyi', amount: '£80.00', receiveAmount: 'KES 15,474', receiveCurrency: 'KES', status: 'delivered', date: '18 Jun 2025', corridor: 'GB → KE' },
  { id: 'TXN-009', recipient: 'Abubakar Yusuf', amount: '£120.00', receiveAmount: 'NGN 238,500', receiveCurrency: 'NGN', status: 'delivered', date: '15 Jun 2025', corridor: 'GB → NG' },
  { id: 'TXN-010', recipient: 'Esi Mensah', amount: '£90.00', receiveAmount: 'GHS 1,379', receiveCurrency: 'GHS', status: 'processing', date: '14 Jun 2025', corridor: 'GB → GH' },
  { id: 'TXN-011', recipient: 'Grace Muthoni', amount: '£500.00', receiveAmount: 'KES 96,710', receiveCurrency: 'KES', status: 'delivered', date: '12 Jun 2025', corridor: 'GB → KE' },
  { id: 'TXN-012', recipient: 'Obinna Eze', amount: '£175.00', receiveAmount: 'NGN 347,813', receiveCurrency: 'NGN', status: 'delivered', date: '10 Jun 2025', corridor: 'GB → NG' },
];

const PER_PAGE = 8;
const statuses = ['all', 'delivered', 'processing', 'pending', 'failed', 'refunded'];

export function TransfersPage() {
  const navigate = useAppStore((s) => s.navigate);
  const [transfers, setTransfers] = React.useState<Transfer[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [page, setPage] = React.useState(1);
  const [sortDir, setSortDir] = React.useState<'asc' | 'desc'>('desc');

  React.useEffect(() => {
    const fetchT = async () => {
      try {
        const res = await fetch('/api/transfers');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) { setTransfers(data); return; }
        }
      } catch { /* silent */ }
      setTransfers(fallbackTransfers);
      setLoading(false);
    };
    fetchT();
  }, []);

  const filtered = useMemo(() => {
    let result = transfers.filter((t) => {
      const q = search.toLowerCase();
      const matchSearch = !q || t.recipient.toLowerCase().includes(q) || t.id.toLowerCase().includes(q) || t.corridor.toLowerCase().includes(q);
      const matchStatus = statusFilter === 'all' || t.status === statusFilter;
      return matchSearch && matchStatus;
    });
    result.sort((a, b) => {
      const da = new Date(a.date).getTime();
      const db = new Date(b.date).getTime();
      return sortDir === 'desc' ? db - da : da - db;
    });
    return result;
  }, [transfers, search, statusFilter, sortDir]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const startIdx = (page - 1) * PER_PAGE + 1;
  const endIdx = Math.min(page * PER_PAGE, filtered.length);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: transfers.length };
    transfers.forEach((t) => { counts[t.status] = (counts[t.status] || 0) + 1; });
    return counts;
  }, [transfers]);

  React.useEffect(() => { setPage(1); }, [search, statusFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transfers</h1>
          <p className="text-muted-foreground">View and track all your transfers</p>
        </div>
        <Button variant="outline" size="sm" className="w-fit">
          <Download className="mr-2 h-4 w-4" />Export
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          )}
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search name, reference, corridor..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 pr-9" />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {statuses.map((s) => {
            const count = statusCounts[s] || 0;
            return (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={'rounded-full px-3 py-1 text-xs font-medium transition-colors ' + (
                  statusFilter === s ? 'bg-emerald-600 text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'
                )}
              >
                {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                {count > 0 && <span className="ml-1 opacity-70">{count}</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-4 p-6">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-muted-foreground">{search ? 'No transfers match your search' : 'No transfers yet'}</p>
              {!search && (
                <Button onClick={() => navigate('send')} className="mt-4 bg-emerald-600 text-white hover:bg-emerald-700">
                  Send your first transfer
                </Button>
              )}
            </div>
          ) : (
            <>
              <p className="px-6 pt-4 text-xs text-muted-foreground">Showing {startIdx}–{endIdx} of {filtered.length} transfers</p>

              {/* Mobile cards */}
              <div className="space-y-2 p-3 sm:hidden">
                {paged.map((t) => (
                  <div key={t.id} onClick={() => navigate('transfer-detail', { id: t.id })} className="flex items-center gap-3 p-3 rounded-lg border border-border/60 cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">{t.recipient.split(' ').map(n => n[0]).join('')}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{t.recipient}</p>
                      <p className="text-xs text-muted-foreground">{t.corridor} · {t.date}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold">{t.amount}</p>
                      <p className="text-xs text-emerald-700">{t.receiveAmount}</p>
                    </div>
                    <span className="text-sm">{statusIcon[t.status]}</span>
                  </div>
                ))}
              </div>

              {/* Desktop table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-6 py-3 font-medium text-muted-foreground">Reference</th>
                      <th className="px-6 py-3 font-medium text-muted-foreground">Recipient</th>
                      <th className="px-6 py-3 font-medium text-muted-foreground">You send</th>
                      <th className="px-6 py-3 font-medium text-muted-foreground">They receive</th>
                      <th className="px-6 py-3 font-medium text-muted-foreground">Corridor</th>
                      <th className="px-6 py-3 font-medium text-muted-foreground">Status</th>
                      <th className="px-6 py-3 font-medium text-muted-foreground cursor-pointer select-none" onClick={() => setSortDir(d => d === 'desc' ? 'asc' : 'desc')}>Date {sortDir === 'desc' ? '↓' : '↑'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paged.map((t) => (
                      <tr key={t.id} className="cursor-pointer border-b border-border/50 last:border-0 hover:bg-muted/50 transition-colors" onClick={() => navigate('transfer-detail', { id: t.id })}>
                        <td className="px-6 py-3.5 font-mono text-xs text-muted-foreground">{t.id}</td>
                        <td className="px-6 py-3.5 font-medium">{t.recipient}</td>
                        <td className="px-6 py-3.5">{t.amount}</td>
                        <td className="px-6 py-3.5 text-emerald-700 font-medium">{t.receiveAmount}</td>
                        <td className="px-6 py-3.5"><Badge variant="outline" className="text-xs font-normal">{t.corridor}</Badge></td>
                        <td className="px-6 py-3.5">
                          <Badge variant="secondary" className={statusColor[t.status] || ''}>{statusIcon[t.status]} {t.status}</Badge>
                        </td>
                        <td className="px-6 py-3.5 text-muted-foreground">{t.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-border">
                  <p className="text-xs text-muted-foreground">Page {page} of {totalPages}</p>
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
                    {Array.from({ length: totalPages }).map((_, i) => (
                      <Button key={i} variant={page === i + 1 ? 'default' : 'outline'} size="sm" className={page === i + 1 ? 'bg-emerald-600 hover:bg-emerald-700' : ''} onClick={() => setPage(i + 1)}>{i + 1}</Button>
                    ))}
                    <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
