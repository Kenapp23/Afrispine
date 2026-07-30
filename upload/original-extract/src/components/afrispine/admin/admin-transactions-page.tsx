'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, ArrowUpDown, Download, Filter } from 'lucide-react';
import { useAppStore } from '@/stores/app';

const statusColor: Record<string, string> = {
  delivered: 'bg-emerald-100 text-emerald-700',
  processing: 'bg-amber-100 text-amber-700',
  pending: 'bg-blue-100 text-blue-700',
  failed: 'bg-red-100 text-red-700',
};

const railColor: Record<string, string> = {
  'M-Pesa': 'bg-emerald-50 text-emerald-600',
  'Bank Transfer': 'bg-sky-50 text-sky-600',
  'Mobile Money': 'bg-violet-50 text-violet-600',
  'PAPSS': 'bg-orange-50 text-orange-600',
};

const transactions = [
  { ref: 'TXN-20250630-001', sender: 'John Doherty', recipient: 'Jane Wanjiru', amount: '£100.00', status: 'delivered', date: '30 Jun 2025, 14:23', rail: 'M-Pesa' },
  { ref: 'TXN-20250630-002', sender: 'Sarah Mitchell', recipient: 'Emeka Okonkwo', amount: '£250.00', status: 'processing', date: '30 Jun 2025, 13:51', rail: 'Bank Transfer' },
  { ref: 'TXN-20250630-003', sender: 'David Kimani', recipient: 'Kwame Asante', amount: '£75.50', status: 'delivered', date: '30 Jun 2025, 12:07', rail: 'Mobile Money' },
  { ref: 'TXN-20250629-004', sender: 'Lisa Petersen', recipient: 'Amina Hassan', amount: '£500.00', status: 'failed', date: '29 Jun 2025, 18:44', rail: 'PAPSS' },
  { ref: 'TXN-20250629-005', sender: 'Mark Thompson', recipient: 'Fatou Diallo', amount: '£300.00', status: 'pending', date: '29 Jun 2025, 16:32', rail: 'M-Pesa' },
  { ref: 'TXN-20250629-006', sender: 'Chidi Nwosu', recipient: 'Grace Muthoni', amount: '£150.00', status: 'delivered', date: '29 Jun 2025, 11:15', rail: 'Mobile Money' },
  { ref: 'TXN-20250628-007', sender: 'Amara Osei', recipient: 'Olusegun Adeyemi', amount: '£1,200.00', status: 'delivered', date: '28 Jun 2025, 09:48', rail: 'Bank Transfer' },
  { ref: 'TXN-20250628-008', sender: 'Rachel Brown', recipient: 'Ibrahim Musa', amount: '£45.00', status: 'processing', date: '28 Jun 2025, 08:12', rail: 'M-Pesa' },
  { ref: 'TXN-20250627-009', sender: 'Paul Okafor', recipient: 'Nairobi Co-op', amount: '£800.00', status: 'delivered', date: '27 Jun 2025, 17:55', rail: 'Bank Transfer' },
  { ref: 'TXN-20250627-010', sender: 'Elena Mwangi', recipient: 'Tunde Bakare', amount: '£200.00', status: 'failed', date: '27 Jun 2025, 15:03', rail: 'PAPSS' },
];

const statusFilters = ['All', 'Processing', 'Delivered', 'Failed'];

export function AdminTransactionsPage() {
  const { navigate } = useAppStore();
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = transactions.filter((t) => {
    const matchesFilter = activeFilter === 'All' || t.status.toLowerCase() === activeFilter.toLowerCase();
    const matchesSearch =
      searchQuery === '' ||
      t.ref.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.sender.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.recipient.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
          <p className="text-muted-foreground">Monitor and search all platform transactions</p>
        </div>
        <Button variant="outline" size="sm" className="w-fit">
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Filters & Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              {statusFilters.map((filter) => (
                <Button
                  key={filter}
                  variant={activeFilter === filter ? 'default' : 'outline'}
                  size="sm"
                  className={
                    activeFilter === filter
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : ''
                  }
                  onClick={() => setActiveFilter(filter)}
                >
                  {filter}
                  {filter !== 'All' && (
                    <Badge variant="secondary" className="ml-2 bg-white/20 text-inherit">
                      {transactions.filter((t) => t.status.toLowerCase() === filter.toLowerCase()).length}
                    </Badge>
                  )}
                </Button>
              ))}
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by ref, sender, recipient…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Transaction History</CardTitle>
          <CardDescription>
            Showing {filtered.length} of {transactions.length} transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="pb-3 font-medium text-muted-foreground">Reference</th>
                  <th className="pb-3 font-medium text-muted-foreground">Sender</th>
                  <th className="pb-3 font-medium text-muted-foreground">Recipient</th>
                  <th className="pb-3 font-medium text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      Amount <ArrowUpDown className="h-3 w-3" />
                    </span>
                  </th>
                  <th className="pb-3 font-medium text-muted-foreground">Status</th>
                  <th className="pb-3 font-medium text-muted-foreground">Rail</th>
                  <th className="pb-3 font-medium text-muted-foreground">Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr
                    key={t.ref}
                    className="border-b border-border/50 last:border-0 hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <td className="py-3 font-mono text-xs text-emerald-600">{t.ref}</td>
                    <td className="py-3">{t.sender}</td>
                    <td className="py-3">{t.recipient}</td>
                    <td className="py-3 font-medium">{t.amount}</td>
                    <td className="py-3">
                      <Badge variant="secondary" className={statusColor[t.status] || ''}>
                        {t.status}
                      </Badge>
                    </td>
                    <td className="py-3">
                      <Badge variant="secondary" className={railColor[t.rail] || ''}>
                        {t.rail}
                      </Badge>
                    </td>
                    <td className="py-3 text-muted-foreground whitespace-nowrap">{t.date}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-muted-foreground">
                      No transactions match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}