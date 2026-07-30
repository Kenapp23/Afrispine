'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, UserPlus, Users } from 'lucide-react';
import { useAppStore } from '@/stores/app';

const kycColor: Record<string, string> = {
  verified: 'bg-emerald-100 text-emerald-700',
  pending: 'bg-amber-100 text-amber-700',
  rejected: 'bg-red-100 text-red-700',
  unsubmitted: 'bg-gray-100 text-gray-600',
};

const senders = [
  { name: 'John Doherty', email: 'john.d@email.com', country: '🇬🇧 United Kingdom', kyc: 'verified', transfers: 47, joined: '12 Mar 2025' },
  { name: 'Sarah Mitchell', email: 'sarah.m@email.com', country: '🇬🇧 United Kingdom', kyc: 'verified', transfers: 23, joined: '28 Jan 2025' },
  { name: 'David Kimani', email: 'd.kimani@email.com', country: '🇬🇧 United Kingdom', kyc: 'verified', transfers: 112, joined: '05 Aug 2024' },
  { name: 'Lisa Petersen', email: 'lisa.p@email.com', country: '🇺🇸 United States', kyc: 'pending', transfers: 8, joined: '15 Jun 2025' },
  { name: 'Mark Thompson', email: 'mark.t@email.com', country: '🇬🇧 United Kingdom', kyc: 'verified', transfers: 64, joined: '22 Sep 2024' },
  { name: 'Chidi Nwosu', email: 'chidi.n@email.com', country: '🇬🇧 United Kingdom', kyc: 'rejected', transfers: 0, joined: '01 Jul 2025' },
  { name: 'Amara Osei', email: 'amara.o@email.com', country: '🇬🇧 United Kingdom', kyc: 'verified', transfers: 91, joined: '17 May 2024' },
  { name: 'Rachel Brown', email: 'rachel.b@email.com', country: '🇬🇧 United Kingdom', kyc: 'unsubmitted', transfers: 3, joined: '27 Jun 2025' },
];

export function AdminSendersPage() {
  const { navigate } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = senders.filter(
    (s) =>
      searchQuery === '' ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.country.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Senders</h1>
          <p className="text-muted-foreground">Manage registered senders and KYC verification</p>
        </div>
        <Button size="sm" className="w-fit bg-emerald-600 hover:bg-emerald-700">
          <UserPlus className="mr-2 h-4 w-4" />
          Add Sender
        </Button>
      </div>

      {/* KPI summary */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Senders</p>
              <p className="text-lg font-bold text-gray-900">{senders.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
              <span className="text-sm font-bold">✓</span>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">KYC Verified</p>
              <p className="text-lg font-bold text-gray-900">{senders.filter((s) => s.kyc === 'verified').length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
              <span className="text-sm font-bold">⏳</span>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Pending KYC</p>
              <p className="text-lg font-bold text-gray-900">{senders.filter((s) => s.kyc === 'pending').length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
              <span className="text-sm font-bold">✕</span>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Rejected</p>
              <p className="text-lg font-bold text-gray-900">{senders.filter((s) => s.kyc === 'rejected').length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, country…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">All Senders</CardTitle>
          <CardDescription>
            Showing {filtered.length} of {senders.length} senders
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="pb-3 font-medium text-muted-foreground">Name</th>
                  <th className="pb-3 font-medium text-muted-foreground">Email</th>
                  <th className="pb-3 font-medium text-muted-foreground">Country</th>
                  <th className="pb-3 font-medium text-muted-foreground">KYC Status</th>
                  <th className="pb-3 font-medium text-muted-foreground">Transfers</th>
                  <th className="pb-3 font-medium text-muted-foreground">Joined</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr
                    key={s.email}
                    className="border-b border-border/50 last:border-0 hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-xs font-bold">
                          {s.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')}
                        </div>
                        <span className="font-medium">{s.name}</span>
                      </div>
                    </td>
                    <td className="py-3 text-muted-foreground">{s.email}</td>
                    <td className="py-3">{s.country}</td>
                    <td className="py-3">
                      <Badge variant="secondary" className={kycColor[s.kyc] || ''}>
                        {s.kyc}
                      </Badge>
                    </td>
                    <td className="py-3 font-medium">{s.transfers}</td>
                    <td className="py-3 text-muted-foreground whitespace-nowrap">{s.joined}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted-foreground">
                      No senders match your search.
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