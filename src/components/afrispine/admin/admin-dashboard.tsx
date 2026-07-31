'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Area, AreaChart, Bar, BarChart, Pie, PieChart, Cell } from 'recharts';
import {
  ArrowUpRight,
  ArrowDownRight,
  Users,
  Banknote,
  ArrowLeftRight,
  TrendingUp,
  AlertTriangle,
  Eye,
} from 'lucide-react';

// ─── Status badge colors (dark theme) ─────────────────────────
const statusColor: Record<string, string> = {
  delivered: 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/50',
  processing: 'bg-blue-900/60 text-blue-300 border border-blue-700/50',
  pending: 'bg-gray-700/60 text-gray-300 border border-gray-600/50',
  failed: 'bg-red-900/60 text-red-300 border border-red-700/50',
  refunded: 'bg-amber-900/60 text-amber-300 border border-amber-700/50',
};

// ─── KPI data ─────────────────────────────────────────────────
const kpis = [
  { label: 'Total volume (30d)', value: '£847,320', change: '+14%', icon: Banknote, positive: true },
  { label: 'Transfers (30d)', value: '3,241', change: '+8%', icon: ArrowLeftRight, positive: true },
  { label: 'Active senders', value: '1,847', change: '+22%', icon: Users, positive: true },
  { label: 'Revenue (30d)', value: '£12,710', change: '+16%', icon: TrendingUp, positive: true },
  { label: 'Avg delivery time', value: '4.2 min', change: '-12%', icon: ArrowUpRight, positive: true },
  { label: 'Failed rate', value: '1.8%', change: '+0.3%', icon: AlertTriangle, positive: false },
];

// ─── Chart data ───────────────────────────────────────────────
const revenueData = [
  { day: 'Mon', revenue: 3200 },
  { day: 'Tue', revenue: 4100 },
  { day: 'Wed', revenue: 3800 },
  { day: 'Thu', revenue: 4650 },
  { day: 'Fri', revenue: 4900 },
  { day: 'Sat', revenue: 2400 },
  { day: 'Sun', revenue: 2100 },
];

const volumeData = [
  { day: 'Mon', transfers: 142 },
  { day: 'Tue', transfers: 178 },
  { day: 'Wed', transfers: 156 },
  { day: 'Thu', transfers: 198 },
  { day: 'Fri', transfers: 185 },
  { day: 'Sat', transfers: 92 },
  { day: 'Sun', transfers: 84 },
];

const corridorData = [
  { name: 'Kenya', value: 45, fill: '#059669' },
  { name: 'Nigeria', value: 30, fill: '#10b981' },
  { name: 'Ghana', value: 15, fill: '#34d399' },
  { name: 'Others', value: 10, fill: '#a7f3d0' },
];

const revenueConfig = {
  revenue: { label: 'Revenue', color: '#10b981' },
};

const volumeConfig = {
  transfers: { label: 'Transfers', color: '#059669' },
};

const corridorConfig = {
  Kenya: { label: 'Kenya', color: '#059669' },
  Nigeria: { label: 'Nigeria', color: '#10b981' },
  Ghana: { label: 'Ghana', color: '#34d399' },
  Others: { label: 'Others', color: '#a7f3d0' },
};

// ─── Recent transactions ───────────────────────────────────────
const recentTxns = [
  { id: 'TXN-101', sender: 'John Doherty', recipient: 'Jane Wanjiru', amount: '£100.00', status: 'delivered', date: '30 Jun 2025' },
  { id: 'TXN-102', sender: 'Sarah Mitchell', recipient: 'Emeka Okonkwo', amount: '£250.00', status: 'processing', date: '30 Jun 2025' },
  { id: 'TXN-103', sender: 'David Kimani', recipient: 'Kwame Asante', amount: '£75.00', status: 'delivered', date: '30 Jun 2025' },
  { id: 'TXN-104', sender: 'Lisa Petersen', recipient: 'Amina Hassan', amount: '£50.00', status: 'failed', date: '29 Jun 2025' },
  { id: 'TXN-105', sender: 'Mark Thompson', recipient: 'Fatou Diallo', amount: '£300.00', status: 'pending', date: '29 Jun 2025' },
  { id: 'TXN-106', sender: 'Chidi Nwosu', recipient: 'Grace Muthoni', amount: '£150.00', status: 'delivered', date: '29 Jun 2025' },
  { id: 'TXN-107', sender: 'Amara Osei', recipient: 'Olusegun Adeyemi', amount: '£1,200.00', status: 'delivered', date: '28 Jun 2025' },
];

// ─── Custom label for pie chart ───────────────────────────────
const RADIAN = Math.PI / 180;
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={13} fontWeight={600}>
      {(percent * 100).toFixed(0)}%
    </text>
  );
};

export function AdminDashboard() {
  return (
    <div className="space-y-6 bg-gray-900 text-white min-h-screen -mx-4 -my-6 px-4 py-6 sm:-mx-6 sm:px-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400">Platform overview and key metrics</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.label} className="bg-gray-800 border-gray-700">
              <CardContent className="flex items-center gap-4 pt-6">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-900/50 text-emerald-400">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400 truncate">{kpi.label}</p>
                  <p className="text-xl font-bold text-white">{kpi.value}</p>
                  <p className={`text-xs font-medium ${kpi.positive ? 'text-emerald-400' : 'text-red-400'}`}>
                    {kpi.positive ? <ArrowUpRight className="inline h-3 w-3" /> : <ArrowDownRight className="inline h-3 w-3" />}
                    {' '}{kpi.change} vs last month
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts row: Revenue + Transfer Volume + Corridor */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Revenue Area Chart */}
        <Card className="bg-gray-800 border-gray-700 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base text-white">Daily Revenue (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={revenueConfig} className="h-[240px] w-full">
              <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10b981"
                  strokeWidth={2}
                  fill="url(#revenueGradient)"
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Corridor Breakdown Donut */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-base text-white">Corridor Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={corridorConfig} className="h-[200px] w-full">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent />} />
                <Pie
                  data={corridorData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  labelLine={false}
                  label={renderCustomLabel}
                >
                  {corridorData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
            {/* Legend */}
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2">
              {corridorData.map((item) => (
                <div key={item.name} className="flex items-center gap-1.5 text-xs text-gray-300">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.fill }} />
                  {item.name}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transfer Volume Bar Chart */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-base text-white">Transfer Volume (Last 7 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={volumeConfig} className="h-[200px] w-full">
            <BarChart data={volumeData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="transfers" fill="#059669" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Recent transactions */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-base text-white">Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="pb-3 pr-4 font-medium text-gray-400">Reference</th>
                  <th className="pb-3 pr-4 font-medium text-gray-400">Sender</th>
                  <th className="pb-3 pr-4 font-medium text-gray-400">Recipient</th>
                  <th className="pb-3 pr-4 font-medium text-gray-400 text-right">Amount</th>
                  <th className="pb-3 pr-4 font-medium text-gray-400">Status</th>
                  <th className="pb-3 font-medium text-gray-400">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentTxns.map((t) => (
                  <tr
                    key={t.id}
                    className="border-b border-gray-700/50 last:border-0 hover:bg-gray-700/40 transition-colors group"
                  >
                    <td className="py-3 pr-4 font-mono text-xs text-emerald-400">{t.id}</td>
                    <td className="py-3 pr-4 text-gray-200">{t.sender}</td>
                    <td className="py-3 pr-4 text-gray-200">{t.recipient}</td>
                    <td className="py-3 pr-4 font-medium text-white text-right">{t.amount}</td>
                    <td className="py-3 pr-4">
                      <Badge variant="secondary" className={statusColor[t.status] || ''}>
                        {t.status}
                      </Badge>
                    </td>
                    <td className="py-3 text-gray-400">{t.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
