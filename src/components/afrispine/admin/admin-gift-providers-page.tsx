'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  Search,
  CheckCircle2,
  XCircle,
  Trash2,
  Store,
  Globe,
  Percent,
  Clock,
  AlertTriangle,
} from 'lucide-react';

// ─── Status badge colors (dark theme) ─────────────────────────
const statusColor: Record<string, string> = {
  approved: 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/50',
  pending: 'bg-amber-900/60 text-amber-300 border border-amber-700/50',
  rejected: 'bg-red-900/60 text-red-300 border border-red-700/50',
};

// ─── Merchant data (hardcoded sample) ────────────────────────
type MerchantStatus = 'pending' | 'approved' | 'rejected';

interface Merchant {
  id: string;
  businessName: string;
  country: string;
  category: string;
  commissionRate: string;
  status: MerchantStatus;
  appliedOn: string;
  contactEmail: string;
}

const initialMerchants: Merchant[] = [
  {
    id: '1',
    businessName: 'M-Pesa Supermarket',
    country: '🇰🇪 Kenya',
    category: 'Utilities',
    commissionRate: '2%',
    status: 'approved',
    appliedOn: '12 Mar 2025',
    contactEmail: 'info@mpesa-supermarket.co.ke',
  },
  {
    id: '2',
    businessName: 'NollywoodHub',
    country: '🇳🇬 Nigeria',
    category: 'Entertainment',
    commissionRate: '1.5%',
    status: 'pending',
    appliedOn: '28 Jun 2025',
    contactEmail: 'partners@nollywoodhub.ng',
  },
  {
    id: '3',
    businessName: 'GhanaTech Store',
    country: '🇬🇭 Ghana',
    category: 'Electronics',
    commissionRate: '2.5%',
    status: 'pending',
    appliedOn: '01 Jul 2025',
    contactEmail: 'business@ghanatech.com.gh',
  },
  {
    id: '4',
    businessName: 'DStv Shop',
    country: '🇰🇪 Kenya',
    category: 'Pay TV',
    commissionRate: '3%',
    status: 'rejected',
    appliedOn: '15 May 2025',
    contactEmail: 'merchants@dstvshop.co.ke',
  },
];

export function AdminGiftProvidersPage() {
  const [merchants, setMerchants] = useState<Merchant[]>(initialMerchants);
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = useMemo(() => {
    return merchants.filter(
      (m) =>
        searchQuery === '' ||
        m.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [merchants, searchQuery]);

  const totalMerchants = merchants.length;
  const pendingCount = merchants.filter((m) => m.status === 'pending').length;
  const approvedCount = merchants.filter((m) => m.status === 'approved').length;
  const rejectedCount = merchants.filter((m) => m.status === 'rejected').length;

  const handleApprove = (id: string) => {
    setMerchants((prev) =>
      prev.map((m) => (m.id === id ? { ...m, status: 'approved' as MerchantStatus } : m))
    );
    const merchant = merchants.find((m) => m.id === id);
    toast.success(`${merchant?.businessName} has been approved`);
  };

  const handleReject = (id: string) => {
    setMerchants((prev) =>
      prev.map((m) => (m.id === id ? { ...m, status: 'rejected' as MerchantStatus } : m))
    );
    const merchant = merchants.find((m) => m.id === id);
    toast.warning(`${merchant?.businessName} has been rejected`);
  };

  const handleDelete = (id: string) => {
    const merchant = merchants.find((m) => m.id === id);
    setMerchants((prev) => prev.filter((m) => m.id !== id));
    toast.error(`${merchant?.businessName} has been removed`);
  };

  return (
    <div className="space-y-6 bg-gray-900 text-white min-h-screen -mx-4 -my-6 px-4 py-6 sm:-mx-6 sm:px-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Gift Providers</h1>
          <p className="text-gray-400">Review and manage merchant onboarding requests</p>
        </div>
      </div>

      {/* Summary stats row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-900/50 text-emerald-400">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Total Providers</p>
              <p className="text-lg font-bold text-white">{totalMerchants}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-900/50 text-amber-400">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Pending</p>
              <p className="text-lg font-bold text-white">{pendingCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-900/50 text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Approved</p>
              <p className="text-lg font-bold text-white">{approvedCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-900/50 text-red-400">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Rejected</p>
              <p className="text-lg font-bold text-white">{rejectedCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="pt-6">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search by name, country, or category…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-gray-900 border-gray-600 text-white placeholder:text-gray-500 focus-visible:ring-emerald-600"
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-base text-white">All Gift Providers</CardTitle>
          <CardDescription className="text-gray-400">
            Showing {filtered.length} of {merchants.length} merchants
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="pb-3 pr-4 font-medium text-gray-400">Business Name</th>
                  <th className="pb-3 pr-4 font-medium text-gray-400">Country</th>
                  <th className="pb-3 pr-4 font-medium text-gray-400">Category</th>
                  <th className="pb-3 pr-4 font-medium text-gray-400 text-right">Commission</th>
                  <th className="pb-3 pr-4 font-medium text-gray-400">Status</th>
                  <th className="pb-3 pr-4 font-medium text-gray-400">Applied</th>
                  <th className="pb-3 font-medium text-gray-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m) => (
                  <tr
                    key={m.id}
                    className="border-b border-gray-700/50 last:border-0 hover:bg-gray-700/40 transition-colors"
                  >
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-900/50 text-emerald-400 shrink-0">
                          <Store className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-200 whitespace-nowrap">{m.businessName}</p>
                          <p className="text-xs text-gray-500 truncate max-w-[200px]">{m.contactEmail}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-gray-300 whitespace-nowrap">{m.country}</td>
                    <td className="py-3 pr-4 text-gray-300 whitespace-nowrap">{m.category}</td>
                    <td className="py-3 pr-4 font-medium text-white text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <Percent className="h-3 w-3 text-gray-500" />
                        {m.commissionRate}
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <Badge variant="secondary" className={statusColor[m.status] || ''}>
                        {m.status.charAt(0).toUpperCase() + m.status.slice(1)}
                      </Badge>
                    </td>
                    <td className="py-3 pr-4 text-gray-400 whitespace-nowrap">{m.appliedOn}</td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {m.status === 'pending' && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-900/40"
                              onClick={() => handleApprove(m.id)}
                              title="Approve"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-amber-400 hover:text-amber-300 hover:bg-amber-900/40"
                              onClick={() => handleReject(m.id)}
                              title="Reject"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-900/40"
                          onClick={() => handleDelete(m.id)}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-400">
                      No merchants match your search.
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
