'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Search, ArrowUpDown, Download, Eye, MoreHorizontal, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// ─── Status badge colors (dark theme) ─────────────────────────
const statusColor: Record<string, string> = {
  delivered: 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/50',
  processing: 'bg-blue-900/60 text-blue-300 border border-blue-700/50',
  pending: 'bg-gray-700/60 text-gray-300 border border-gray-600/50',
  failed: 'bg-red-900/60 text-red-300 border border-red-700/50',
  refunded: 'bg-amber-900/60 text-amber-300 border border-amber-700/50',
};

// ─── Transaction data (15+ records) ───────────────────────────
const transactions = [
  { id: 'TXN-20250630-001', sender: 'John Doherty', recipient: 'Jane Wanjiru', amount: '$100.00', fee: '$2.99', status: 'delivered', date: '30 Jun 2025, 14:23', corridor: 'UK → Kenya' },
  { id: 'TXN-20250630-002', sender: 'Sarah Mitchell', recipient: 'Emeka Okonkwo', amount: '$250.00', fee: '$5.99', status: 'processing', date: '30 Jun 2025, 13:51', corridor: 'UK → Nigeria' },
  { id: 'TXN-20250630-003', sender: 'David Kimani', recipient: 'Kwame Asante', amount: '$75.50', fee: '$2.49', status: 'delivered', date: '30 Jun 2025, 12:07', corridor: 'UK → Ghana' },
  { id: 'TXN-20250629-004', sender: 'Lisa Petersen', recipient: 'Amina Hassan', amount: '$500.00', fee: '$9.99', status: 'failed', date: '29 Jun 2025, 18:44', corridor: 'UK → Kenya' },
  { id: 'TXN-20250629-005', sender: 'Mark Thompson', recipient: 'Fatou Diallo', amount: '$300.00', fee: '$5.99', status: 'pending', date: '29 Jun 2025, 16:32', corridor: 'UK → Kenya' },
  { id: 'TXN-20250629-006', sender: 'Chidi Nwosu', recipient: 'Grace Muthoni', amount: '$150.00', fee: '$3.99', status: 'delivered', date: '29 Jun 2025, 11:15', corridor: 'UK → Nigeria' },
  { id: 'TXN-20250628-007', sender: 'Amara Osei', recipient: 'Olusegun Adeyemi', amount: '$1,200.00', fee: '$19.99', status: 'delivered', date: '28 Jun 2025, 09:48', corridor: 'UK → Nigeria' },
  { id: 'TXN-20250628-008', sender: 'Rachel Brown', recipient: 'Ibrahim Musa', amount: '$45.00', fee: '$1.99', status: 'processing', date: '28 Jun 2025, 08:12', corridor: 'UK → Ghana' },
  { id: 'TXN-20250627-009', sender: 'Paul Okafor', recipient: 'Nairobi Co-op', amount: '$800.00', fee: '$14.99', status: 'delivered', date: '27 Jun 2025, 17:55', corridor: 'UK → Kenya' },
  { id: 'TXN-20250627-010', sender: 'Elena Mwangi', recipient: 'Tunde Bakare', amount: '$200.00', fee: '$4.49', status: 'failed', date: '27 Jun 2025, 15:03', corridor: 'UK → Nigeria' },
  { id: 'TXN-20250626-011', sender: 'Yusuf Abubakar', recipient: 'Mary Njeri', amount: '$350.00', fee: '$6.99', status: 'delivered', date: '26 Jun 2025, 14:22', corridor: 'UK → Kenya' },
  { id: 'TXN-20250626-012', sender: 'Fatima Diallo', recipient: 'Kofi Mensah', amount: '$180.00', fee: '$3.99', status: 'refunded', date: '26 Jun 2025, 10:45', corridor: 'UK → Ghana' },
  { id: 'TXN-20250625-013', sender: 'Kwame Boateng', recipient: 'Chioma Eze', amount: '$420.00', fee: '$7.99', status: 'delivered', date: '25 Jun 2025, 16:18', corridor: 'UK → Nigeria' },
  { id: 'TXN-20250625-014', sender: 'Amina Osei', recipient: 'Hassan Ali', amount: '$90.00', fee: '$2.49', status: 'pending', date: '25 Jun 2025, 09:33', corridor: 'UK → Kenya' },
  { id: 'TXN-20250624-015', sender: 'Obinna Eze', recipient: 'Akosua Frimpong', amount: '$600.00', fee: '$11.49', status: 'delivered', date: '24 Jun 2025, 13:07', corridor: 'UK → Ghana' },
  { id: 'TXN-20250624-016', sender: 'Ngozi Adekunle', recipient: 'Peter Oduya', amount: '$275.00', fee: '$5.49', status: 'processing', date: '24 Jun 2025, 08:55', corridor: 'UK → Kenya' },
];

const statusTabs = ['All', 'Pending', 'Processing', 'Delivered', 'Failed', 'Refunded'];
const dateRanges = ['Last 7 days', 'Last 30 days', 'All time'];

export function AdminTransactionsPage() {
  const [activeStatus, setActiveStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState('Last 30 days');

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      const matchesStatus = activeStatus === 'All' || t.status.toLowerCase() === activeStatus.toLowerCase();
      const matchesSearch =
        searchQuery === '' ||
        t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.sender.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.recipient.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [activeStatus, searchQuery]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { All: transactions.length };
    for (const t of transactions) {
      counts[t.status] = (counts[t.status] || 0) + 1;
    }
    return counts;
  }, []);

  return (
    <div className="space-y-6 bg-gray-900 text-white min-h-screen -mx-4 -my-6 px-4 py-6 sm:-mx-6 sm:px-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Transactions</h1>
          <p className="text-gray-400">Monitor and search all platform transactions</p>
        </div>
        <Button variant="outline" size="sm" className="w-fit border-gray-600 text-gray-200 hover:bg-gray-800 hover:text-white">
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Status filter tabs + search + date range */}
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            {/* Tabs */}
            <Tabs value={activeStatus} onValueChange={setActiveStatus}>
              <TabsList className="bg-gray-900 border-gray-700">
                {statusTabs.map((tab) => (
                  <TabsTrigger
                    key={tab}
                    value={tab}
                    className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-gray-400"
                  >
                    {tab}
                    <span className="ml-1.5 text-xs opacity-70">{statusCounts[tab] || 0}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            {/* Search + Date range */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search by ID, sender, recipient…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-gray-900 border-gray-600 text-white placeholder:text-gray-500 focus-visible:ring-emerald-600"
                />
              </div>
              <div className="flex gap-2">
                {dateRanges.map((range) => (
                  <Button
                    key={range}
                    variant={dateRange === range ? 'default' : 'outline'}
                    size="sm"
                    className={
                      dateRange === range
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'border-gray-600 text-gray-400 hover:bg-gray-700 hover:text-white'
                    }
                    onClick={() => setDateRange(range)}
                  >
                    {range}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-base text-white">Transaction History</CardTitle>
          <CardDescription className="text-gray-400">
            Showing {filtered.length} of {transactions.length} transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="pb-3 pr-4 font-medium text-gray-400">ID</th>
                  <th className="pb-3 pr-4 font-medium text-gray-400">Sender</th>
                  <th className="pb-3 pr-4 font-medium text-gray-400">Recipient</th>
                  <th className="pb-3 pr-4 font-medium text-gray-400 text-right">Amount</th>
                  <th className="pb-3 pr-4 font-medium text-gray-400 text-right">Fee</th>
                  <th className="pb-3 pr-4 font-medium text-gray-400">Status</th>
                  <th className="pb-3 pr-4 font-medium text-gray-400">Date</th>
                  <th className="pb-3 font-medium text-gray-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr
                    key={t.id}
                    className="border-b border-gray-700/50 last:border-0 hover:bg-gray-700/40 transition-colors"
                  >
                    <td className="py-3 pr-4 font-mono text-xs text-emerald-400">{t.id}</td>
                    <td className="py-3 pr-4 text-gray-200 whitespace-nowrap">{t.sender}</td>
                    <td className="py-3 pr-4 text-gray-200 whitespace-nowrap">{t.recipient}</td>
                    <td className="py-3 pr-4 font-medium text-white text-right whitespace-nowrap">{t.amount}</td>
                    <td className="py-3 pr-4 text-gray-400 text-right whitespace-nowrap">{t.fee}</td>
                    <td className="py-3 pr-4">
                      <Badge variant="secondary" className={statusColor[t.status] || ''}>
                        {t.status}
                      </Badge>
                    </td>
                    <td className="py-3 pr-4 text-gray-400 whitespace-nowrap">{t.date}</td>
                    <td className="py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white hover:bg-gray-700">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700 text-gray-200">
                          <DropdownMenuItem className="text-gray-200 hover:bg-gray-700 focus:bg-gray-700 focus:text-white">
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-gray-200 hover:bg-gray-700 focus:bg-gray-700 focus:text-white">
                            <ArrowUpDown className="mr-2 h-4 w-4" />
                            Refund
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-gray-400">
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
