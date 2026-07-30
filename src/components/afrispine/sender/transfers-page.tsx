'use client';

import React, { useEffect, useState } from 'react';
import { useAppStore } from '@/stores/app';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Search } from 'lucide-react';
import { toast } from 'sonner';

const statusColor: Record<string, string> = {
  delivered: 'bg-emerald-100 text-emerald-700',
  processing: 'bg-blue-100 text-blue-700',
  pending: 'bg-gray-100 text-gray-700',
  failed: 'bg-red-100 text-red-700',
  refunded: 'bg-amber-100 text-amber-700',
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
];

export function TransfersPage() {
  const navigate = useAppStore((s) => s.navigate);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const fetchTransfers = async () => {
      try {
        const res = await fetch('/api/transfers');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setTransfers(data);
          } else {
            setTransfers(fallbackTransfers);
          }
        } else {
          setTransfers(fallbackTransfers);
        }
      } catch {
        setTransfers(fallbackTransfers);
      } finally {
        setLoading(false);
      }
    };
    fetchTransfers();
  }, []);

  const filtered = transfers.filter((t) => {
    const matchSearch =
      t.recipient.toLowerCase().includes(search.toLowerCase()) ||
      t.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const statuses = ['all', 'delivered', 'processing', 'pending', 'failed', 'refunded'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Transfers</h1>
        <p className="text-muted-foreground">View and track all your transfers</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or reference..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={'rounded-full px-3 py-1 text-xs font-medium transition-colors ' + (
                statusFilter === s
                  ? 'bg-emerald-600 text-white'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-4 p-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              No transfers found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-6 py-3 font-medium text-muted-foreground">Reference</th>
                    <th className="px-6 py-3 font-medium text-muted-foreground">Recipient</th>
                    <th className="px-6 py-3 font-medium text-muted-foreground">You send</th>
                    <th className="px-6 py-3 font-medium text-muted-foreground">They receive</th>
                    <th className="px-6 py-3 font-medium text-muted-foreground">Status</th>
                    <th className="px-6 py-3 font-medium text-muted-foreground">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((t) => (
                    <tr
                      key={t.id}
                      className="cursor-pointer border-b border-border/50 last:border-0 hover:bg-muted/50 transition-colors"
                      onClick={() => navigate('transfer-detail', { id: t.id })}
                    >
                      <td className="px-6 py-3.5 font-mono text-xs">{t.id}</td>
                      <td className="px-6 py-3.5 font-medium">{t.recipient}</td>
                      <td className="px-6 py-3.5">{t.amount}</td>
                      <td className="px-6 py-3.5">{t.receiveAmount}</td>
                      <td className="px-6 py-3.5">
                        <Badge
                          variant="secondary"
                          className={statusColor[t.status] || ''}
                        >
                          {t.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-3.5 text-muted-foreground">{t.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
