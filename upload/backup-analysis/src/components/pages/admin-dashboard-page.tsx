'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  ArrowUpRight,
  DollarSign,
  Users,
  TrendingUp,
  Activity,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
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
import { useAppStore } from '@/stores/app';

interface DashboardData {
  stats: {
    totalTransfers: number;
    volume: number;
    revenue: number;
    activeUsers: number;
  };
  volumeChart: { date: string; volume: number }[];
  statusBreakdown: { name: string; value: number; color: string }[];
  recentTransfers: {
    id: string;
    date: string;
    sender: string;
    recipient: string;
    amount: number;
    currency: string;
    status: string;
  }[];
}

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  completed: 'default',
  pending: 'secondary',
  failed: 'destructive',
  processing: 'outline',
};

export default function AdminDashboardPage() {
  const navigate = useAppStore((s) => s.navigate);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch('/api/admin/dashboard', {
          headers: { Authorization: 'Bearer ' + localStorage.getItem('afrispine_token') },
        });
        if (!res.ok) throw new Error('Failed to load dashboard');
        const json = await res.json();
        setData(json);
      } catch {
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  const stats = [
    {
      title: 'Total Transfers',
      value: data?.stats.totalTransfers.toLocaleString() ?? '—',
      icon: Activity,
      change: '+12.5%',
    },
    {
      title: 'Volume',
      value: data ? `$${data.stats.volume.toLocaleString()}` : '—',
      icon: DollarSign,
      change: '+8.2%',
    },
    {
      title: 'Revenue',
      value: data ? `$${data.stats.revenue.toLocaleString()}` : '—',
      icon: TrendingUp,
      change: '+15.3%',
    },
    {
      title: 'Active Users',
      value: data?.stats.activeUsers.toLocaleString() ?? '—',
      icon: Users,
      change: '+5.1%',
    },
  ];

  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4 },
  };

  return (
    <div className="space-y-6">
      <motion.div {...fadeIn} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Overview of AfriSpine operations</p>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
          >
            <Card className="bg-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                    {loading ? (
                      <Skeleton className="h-8 w-24 mt-2" />
                    ) : (
                      <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                    )}
                  </div>
                  <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center">
                    <stat.icon className="h-6 w-6 text-emerald-600" />
                  </div>
                </div>
                {!loading && (
                  <div className="flex items-center mt-3 text-xs">
                    <ArrowUpRight className="h-3 w-3 text-emerald-500 mr-1" />
                    <span className="text-emerald-600 font-medium">{stat.change}</span>
                    <span className="text-gray-400 ml-1">vs last month</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Volume Chart */}
        <motion.div
          className="lg:col-span-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-gray-900">
                Transfer Volume (30 days)
              </CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              {loading ? (
                <Skeleton className="h-full w-full" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data?.volumeChart ?? []}>
                    <defs>
                      <linearGradient id="emeraldGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#059669" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
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
                      tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e2e8f0',
                        borderRadius: 8,
                        fontSize: 13,
                      }}
                      formatter={(value: number) => [`$${value.toLocaleString()}`, 'Volume']}
                    />
                    <Area
                      type="monotone"
                      dataKey="volume"
                      stroke="#059669"
                      strokeWidth={2}
                      fill="url(#emeraldGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Status Pie Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-gray-900">
                Transfer Status
              </CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              {loading ? (
                <Skeleton className="h-full w-full" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data?.statusBreakdown ?? []}
                      cx="50%"
                      cy="45%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {(data?.statusBreakdown ?? []).map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Legend
                      verticalAlign="bottom"
                      iconType="circle"
                      formatter={(value: string) => (
                        <span className="text-xs text-gray-600">{value}</span>
                      )}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e2e8f0',
                        borderRadius: 8,
                        fontSize: 13,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Transfers */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.5 }}
      >
        <Card className="bg-white">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold text-gray-900">
              Recent Transfers
            </CardTitle>
            <button
              onClick={() => navigate('admin-transactions')}
              className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
            >
              View all
            </button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs font-medium text-gray-500">Date</TableHead>
                      <TableHead className="text-xs font-medium text-gray-500">Sender</TableHead>
                      <TableHead className="text-xs font-medium text-gray-500">Recipient</TableHead>
                      <TableHead className="text-xs font-medium text-gray-500">Amount</TableHead>
                      <TableHead className="text-xs font-medium text-gray-500">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(data?.recentTransfers ?? []).map((t) => (
                      <TableRow
                        key={t.id}
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => navigate('sender-transfer-detail', { id: t.id })}
                      >
                        <TableCell className="text-sm text-gray-700">{t.date}</TableCell>
                        <TableCell className="text-sm font-medium text-gray-900">{t.sender}</TableCell>
                        <TableCell className="text-sm text-gray-700">{t.recipient}</TableCell>
                        <TableCell className="text-sm font-medium text-gray-900">
                          ${t.amount.toLocaleString()} {t.currency}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={statusVariant[t.status] ?? 'outline'}
                            className="capitalize text-xs"
                          >
                            {t.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}