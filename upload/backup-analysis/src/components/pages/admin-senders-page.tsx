'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Search, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Sender {
  id: string;
  name: string;
  email: string;
  country: string;
  kycStatus: string;
  transferCount: number;
  joined: string;
}

const kycVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  verified: 'default',
  pending: 'secondary',
  rejected: 'destructive',
  unverified: 'outline',
};

const kycColor: Record<string, string> = {
  verified: 'bg-emerald-100 text-emerald-700',
  pending: 'bg-amber-100 text-amber-700',
  rejected: 'bg-red-100 text-red-700',
  unverified: 'bg-gray-100 text-gray-700',
};

export default function AdminSendersPage() {
  const [senders, setSenders] = useState<Sender[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchSenders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);

      const res = await fetch(`/api/admin/senders?${params}`, {
        headers: { Authorization: 'Bearer ' + localStorage.getItem('afrispine_token') },
      });
      if (!res.ok) throw new Error('Failed to load senders');
      const json = await res.json();
      setSenders(json.data ?? json.senders ?? []);
    } catch {
      toast.error('Failed to load senders');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchSenders();
  }, [fetchSenders]);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Senders</h1>
        <p className="text-sm text-gray-500 mt-1">Manage registered senders and KYC status</p>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Card className="bg-white">
          <CardContent className="p-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name, email, or country..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <Card className="bg-white">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/80">
                    <TableHead className="text-xs font-medium text-gray-500">Name</TableHead>
                    <TableHead className="text-xs font-medium text-gray-500">Email</TableHead>
                    <TableHead className="text-xs font-medium text-gray-500">Country</TableHead>
                    <TableHead className="text-xs font-medium text-gray-500">KYC Status</TableHead>
                    <TableHead className="text-xs font-medium text-gray-500">Transfers</TableHead>
                    <TableHead className="text-xs font-medium text-gray-500">Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 8 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 6 }).map((_, j) => (
                          <TableCell key={j}>
                            <Skeleton className="h-5 w-24" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : senders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-16">
                        <Users className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-400 text-sm">No senders found</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    senders.map((s) => (
                      <TableRow key={s.id} className="hover:bg-gray-50 transition-colors">
                        <TableCell className="text-sm font-medium text-gray-900">{s.name}</TableCell>
                        <TableCell className="text-sm text-gray-600">{s.email}</TableCell>
                        <TableCell className="text-sm text-gray-700">{s.country}</TableCell>
                        <TableCell>
                          <Badge
                            variant={kycVariant[s.kycStatus] ?? 'outline'}
                            className={`capitalize text-xs ${kycColor[s.kycStatus] ?? ''}`}
                          >
                            {s.kycStatus}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-700">{s.transferCount}</TableCell>
                        <TableCell className="text-sm text-gray-500 whitespace-nowrap">{s.joined}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}