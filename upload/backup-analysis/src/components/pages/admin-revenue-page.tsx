'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { DollarSign, TrendingUp, ArrowUpRight } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface RevenueData {
  totalRevenue: number;
  dailyRevenue: { date: string; revenue: number }[];
  byCorridor: {
    corridor: string;
    revenue: number;
    volume: number;
    transfers: number;
    change: string;
  }[];
  byProvider: {
    provider: string;
    revenue: number;
    volume: number;
    share: number;
  }[];
}

export default function AdminRevenuePage() {
  const [data, setData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRevenue() {
      try {
        const res = await fetch('/api/admin/revenue', {
          headers: { Authorization: 'Bearer ' + localStorage.getItem('afrispine_token') },
        });
        if (!res.ok) throw new Error('Failed to load revenue data');
        const json = await res.json();
        setData(json);
      } catch {
        toast.error('Failed to load revenue data');
      } finally {
        setLoading(false);
      }
    }
    fetchRevenue();
  }, []);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Revenue</h1>
        <p className="text-sm text-gray-500 mt-1">Track platform earnings and financial performance</p>
      </motion.div>

      {/* Total Revenue Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Card className="bg-gradient-to-br from-emerald-600 to-emerald-700 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm font-medium">Total Revenue</p>
                {loading ? (
                  <Skeleton className="h-10 w-48 mt-2 bg-emerald-500/30" />
                ) : (
                  <p className="text-3xl font-bold mt-1">${data?.totalRevenue.toLocaleString() ?? '0'}</p>
                )}
                <div className="flex items-center mt-2 text-xs text-emerald-200">
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  <span>+18.4% vs last month</span>
                </div>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-white/10 flex items-center justify-center">
                <DollarSign className="h-7 w-7" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Daily Revenue Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-gray-900">
              Daily Revenue (30 days)
            </CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {loading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.dailyRevenue ?? []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v: number) => `$${v}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e2e8f0',
                      borderRadius: 8,
                      fontSize: 13,
                    }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
                  />
                  <Bar dataKey="revenue" fill="#059669" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* By Corridor Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Revenue by Corridor</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading
            ? Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="bg-white">
                  <CardContent className="p-5 space-y-3">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-7 w-24" />
                    <Skeleton className="h-4 w-40" />
                  </CardContent>
                </Card>
              ))
            : (data?.byCorridor ?? []).map((c) => (
                <Card key={c.corridor} className="bg-white border-gray-100">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-500">{c.corridor}</p>
                      <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-200">
                        {c.change}
                      </Badge>
                    </div>
                    <p className="text-xl font-bold text-gray-900 mt-2">${c.revenue.toLocaleString()}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>Vol: ${c.volume.toLocaleString()}</span>
                      <span>{c.transfers} transfers</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
        </div>
      </motion.div>

      {/* By Provider Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
      >
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
              Revenue by Provider
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/80">
                    <TableHead className="text-xs font-medium text-gray-500">Provider</TableHead>
                    <TableHead className="text-xs font-medium text-gray-500">Revenue</TableHead>
                    <TableHead className="text-xs font-medium text-gray-500">Volume</TableHead>
                    <TableHead className="text-xs font-medium text-gray-500">Market Share</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 4 }).map((_, j) => (
                          <TableCell key={j}>
                            <Skeleton className="h-5 w-20" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    (data?.byProvider ?? []).map((p) => (
                      <TableRow key={p.provider} className="hover:bg-gray-50 transition-colors">
                        <TableCell className="text-sm font-medium text-gray-900">{p.provider}</TableCell>
                        <TableCell className="text-sm font-semibold text-gray-900">
                          ${p.revenue.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-sm text-gray-700">
                          ${p.volume.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-emerald-500 rounded-full"
                                style={{ width: `${p.share}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-600">{p.share}%</span>
                          </div>
                        </TableCell>
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