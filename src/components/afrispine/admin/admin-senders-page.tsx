'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Search,
  UserPlus,
  Users,
  UserCheck,
  UserRoundPlus,
  ShieldCheck,
  MoreHorizontal,
  Eye,
  Mail,
  Ban,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// ─── KYC badge colors (dark theme) ───────────────────────────
const kycColor: Record<string, string> = {
  Verified: 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/50',
  Pending: 'bg-amber-900/60 text-amber-300 border border-amber-700/50',
  'Not Started': 'bg-gray-700/60 text-gray-300 border border-gray-600/50',
};

// ─── Sender data (12+ African diaspora names) ─────────────────
const senders = [
  { name: 'John Doherty', email: 'john.doherty@email.com', country: '\u{1F1EC}\u{1F1E7} United Kingdom', totalSent: '£4,700', transfers: 47, kyc: 'Verified', joined: '12 Mar 2025' },
  { name: 'Sarah Mitchell', email: 'sarah.mitchell@email.com', country: '\u{1F1EC}\u{1F1E7} United Kingdom', totalSent: '£2,350', transfers: 23, kyc: 'Verified', joined: '28 Jan 2025' },
  { name: 'David Kimani', email: 'david.kimani@email.com', country: '\u{1F1EC}\u{1F1E7} United Kingdom', totalSent: '£11,200', transfers: 112, kyc: 'Verified', joined: '05 Aug 2024' },
  { name: 'Lisa Petersen', email: 'lisa.petersen@email.com', country: '\u{1F1FA}\u{1F1F8} United States', totalSent: '£800', transfers: 8, kyc: 'Pending', joined: '15 Jun 2025' },
  { name: 'Mark Thompson', email: 'mark.thompson@email.com', country: '\u{1F1EC}\u{1F1E7} United Kingdom', totalSent: '£6,400', transfers: 64, kyc: 'Verified', joined: '22 Sep 2024' },
  { name: 'Chidi Nwosu', email: 'chidi.nwosu@email.com', country: '\u{1F1EC}\u{1F1E7} United Kingdom', totalSent: '£0', transfers: 0, kyc: 'Not Started', joined: '01 Jul 2025' },
  { name: 'Amara Osei', email: 'amara.osei@email.com', country: '\u{1F1EC}\u{1F1E7} United Kingdom', totalSent: '£9,100', transfers: 91, kyc: 'Verified', joined: '17 May 2024' },
  { name: 'Rachel Brown', email: 'rachel.brown@email.com', country: '\u{1F1EC}\u{1F1E7} United Kingdom', totalSent: '£300', transfers: 3, kyc: 'Not Started', joined: '27 Jun 2025' },
  { name: 'Yusuf Abubakar', email: 'yusuf.abubakar@email.com', country: '\u{1F1EC}\u{1F1E7} United Kingdom', totalSent: '£5,250', transfers: 52, kyc: 'Verified', joined: '10 Apr 2025' },
  { name: 'Fatima Diallo', email: 'fatima.diallo@email.com', country: '\u{1F1EB}\u{1F1F7} France', totalSent: '£1,800', transfers: 18, kyc: 'Pending', joined: '03 May 2025' },
  { name: 'Kwame Boateng', email: 'kwame.boateng@email.com', country: '\u{1F1E8}\u{1F1E6} Canada', totalSent: '£3,600', transfers: 36, kyc: 'Verified', joined: '19 Feb 2025' },
  { name: 'Ngozi Adekunle', email: 'ngozi.adekunle@email.com', country: '\u{1F1EC}\u{1F1E7} United Kingdom', totalSent: '£7,800', transfers: 78, kyc: 'Verified', joined: '08 Nov 2024' },
  { name: 'Obinna Eze', email: 'obinna.eze@email.com', country: '\u{1F1FA}\u{1F1F8} United States', totalSent: '£2,100', transfers: 21, kyc: 'Pending', joined: '22 Jun 2025' },
];

export function AdminSendersPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = useMemo(() => {
    return senders.filter(
      (s) =>
        searchQuery === '' ||
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const totalSenders = senders.length;
  const active30d = senders.filter((s) => s.transfers >= 3).length;
  const new30d = senders.filter((s) => {
    const joined = new Date(s.joined);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return joined >= thirtyDaysAgo;
  }).length;
  const verifiedPct = Math.round((senders.filter((s) => s.kyc === 'Verified').length / totalSenders) * 100);

  return (
    <div className="space-y-6 bg-gray-900 text-white min-h-screen -mx-4 -my-6 px-4 py-6 sm:-mx-6 sm:px-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Senders</h1>
          <p className="text-gray-400">Manage registered senders and KYC verification</p>
        </div>
        <Button size="sm" className="w-fit bg-emerald-600 hover:bg-emerald-700 text-white">
          <UserPlus className="mr-2 h-4 w-4" />
          Add Sender
        </Button>
      </div>

      {/* Summary stats row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-900/50 text-emerald-400">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Total Senders</p>
              <p className="text-lg font-bold text-white">{totalSenders}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-900/50 text-emerald-400">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Active (30d)</p>
              <p className="text-lg font-bold text-white">{active30d}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-900/50 text-blue-400">
              <UserRoundPlus className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-gray-400">New (30d)</p>
              <p className="text-lg font-bold text-white">{new30d}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-900/50 text-emerald-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-gray-400">KYC Verified</p>
              <p className="text-lg font-bold text-white">{verifiedPct}%</p>
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
              placeholder="Search by name or email…"
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
          <CardTitle className="text-base text-white">All Senders</CardTitle>
          <CardDescription className="text-gray-400">
            Showing {filtered.length} of {senders.length} senders
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="pb-3 pr-4 font-medium text-gray-400">Name</th>
                  <th className="pb-3 pr-4 font-medium text-gray-400">Email</th>
                  <th className="pb-3 pr-4 font-medium text-gray-400">Country</th>
                  <th className="pb-3 pr-4 font-medium text-gray-400 text-right">Total Sent</th>
                  <th className="pb-3 pr-4 font-medium text-gray-400 text-right">Transfers</th>
                  <th className="pb-3 pr-4 font-medium text-gray-400">KYC Status</th>
                  <th className="pb-3 pr-4 font-medium text-gray-400">Joined</th>
                  <th className="pb-3 font-medium text-gray-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr
                    key={s.email}
                    className="border-b border-gray-700/50 last:border-0 hover:bg-gray-700/40 transition-colors"
                  >
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-900/50 text-emerald-400 text-xs font-bold shrink-0">
                          {s.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')}
                        </div>
                        <span className="font-medium text-gray-200 whitespace-nowrap">{s.name}</span>
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-gray-400 whitespace-nowrap">{s.email}</td>
                    <td className="py-3 pr-4 text-gray-300 whitespace-nowrap">{s.country}</td>
                    <td className="py-3 pr-4 font-medium text-white text-right whitespace-nowrap">{s.totalSent}</td>
                    <td className="py-3 pr-4 text-gray-200 text-right">{s.transfers}</td>
                    <td className="py-3 pr-4">
                      <Badge variant="secondary" className={kycColor[s.kyc] || ''}>
                        {s.kyc}
                      </Badge>
                    </td>
                    <td className="py-3 pr-4 text-gray-400 whitespace-nowrap">{s.joined}</td>
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
                            View Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-gray-200 hover:bg-gray-700 focus:bg-gray-700 focus:text-white">
                            <Mail className="mr-2 h-4 w-4" />
                            Send Email
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-400 hover:bg-gray-700 focus:bg-gray-700 focus:text-red-300">
                            <Ban className="mr-2 h-4 w-4" />
                            Suspend Sender
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-gray-400">
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
