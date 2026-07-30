'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { ShieldAlert, Clock, Flag, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface ComplianceData {
  stats: {
    pendingKyc: number;
    flagged: number;
    amlChecks: number;
  };
  pendingKyc: {
    id: string;
    name: string;
    email: string;
    country: string;
    submittedAt: string;
    documentType: string;
  }[];
  amlChecks: {
    id: string;
    entity: string;
    type: string;
    risk: string;
    checkedAt: string;
    status: string;
  }[];
}

const riskVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  high: 'destructive',
  medium: 'secondary',
  low: 'outline',
};

const riskColor: Record<string, string> = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-emerald-100 text-emerald-700',
};

const amlStatusColor: Record<string, string> = {
  cleared: 'bg-emerald-100 text-emerald-700',
  flagged: 'bg-red-100 text-red-700',
  reviewing: 'bg-amber-100 text-amber-700',
  pending: 'bg-gray-100 text-gray-700',
};

export default function AdminCompliancePage() {
  const [data, setData] = useState<ComplianceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCompliance() {
      try {
        const res = await fetch('/api/admin/compliance', {
          headers: { Authorization: 'Bearer ' + localStorage.getItem('afrispine_token') },
        });
        if (!res.ok) throw new Error('Failed to load compliance data');
        const json = await res.json();
        setData(json);
      } catch {
        toast.error('Failed to load compliance data');
      } finally {
        setLoading(false);
      }
    }
    fetchCompliance();
  }, []);

  const statCards = [
    {
      title: 'Pending KYC',
      value: data?.stats.pendingKyc ?? 0,
      icon: Clock,
      color: 'bg-amber-50 text-amber-600',
      borderColor: 'border-l-amber-500',
    },
    {
      title: 'Flagged Accounts',
      value: data?.stats.flagged ?? 0,
      icon: Flag,
      color: 'bg-red-50 text-red-600',
      borderColor: 'border-l-red-500',
    },
    {
      title: 'AML Checks',
      value: data?.stats.amlChecks ?? 0,
      icon: ShieldAlert,
      color: 'bg-emerald-50 text-emerald-600',
      borderColor: 'border-l-emerald-500',
    },
  ];

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Compliance</h1>
        <p className="text-sm text-gray-500 mt-1">KYC verification and AML monitoring</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
          >
            <Card className={`bg-white border-l-4 ${stat.borderColor}`}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">{stat.title}</p>
                    {loading ? (
                      <Skeleton className="h-8 w-16 mt-2" />
                    ) : (
                      <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                    )}
                  </div>
                  <div className={`h-10 w-10 rounded-lg ${stat.color} flex items-center justify-center`}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <Tabs defaultValue="kyc" className="w-full">
          <TabsList className="bg-gray-100">
            <TabsTrigger value="kyc">Pending KYC</TabsTrigger>
            <TabsTrigger value="aml">AML Checks</TabsTrigger>
          </TabsList>

          <TabsContent value="kyc" className="mt-4">
            <Card className="bg-white">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base font-semibold text-gray-900">
                  Pending KYC Verifications
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50/80">
                        <TableHead className="text-xs font-medium text-gray-500">Name</TableHead>
                        <TableHead className="text-xs font-medium text-gray-500">Email</TableHead>
                        <TableHead className="text-xs font-medium text-gray-500">Country</TableHead>
                        <TableHead className="text-xs font-medium text-gray-500">Document</TableHead>
                        <TableHead className="text-xs font-medium text-gray-500">Submitted</TableHead>
                        <TableHead className="text-xs font-medium text-gray-500">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                          <TableRow key={i}>
                            {Array.from({ length: 6 }).map((_, j) => (
                              <TableCell key={j}>
                                <Skeleton className="h-5 w-20" />
                              </TableCell>
                            ))}
                          </TableRow>
                        ))
                      ) : (data?.pendingKyc ?? []).length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-12 text-gray-400 text-sm">
                            No pending KYC verifications
                          </TableCell>
                        </TableRow>
                      ) : (
                        (data?.pendingKyc ?? []).map((k) => (
                          <TableRow key={k.id} className="hover:bg-gray-50 transition-colors">
                            <TableCell className="text-sm font-medium text-gray-900">{k.name}</TableCell>
                            <TableCell className="text-sm text-gray-600">{k.email}</TableCell>
                            <TableCell className="text-sm text-gray-700">{k.country}</TableCell>
                            <TableCell className="text-sm text-gray-600">{k.documentType}</TableCell>
                            <TableCell className="text-sm text-gray-500 whitespace-nowrap">{k.submittedAt}</TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button size="sm" variant="outline" className="text-xs h-7 text-emerald-600 border-emerald-200 hover:bg-emerald-50">
                                  Approve
                                </Button>
                                <Button size="sm" variant="outline" className="text-xs h-7 text-red-600 border-red-200 hover:bg-red-50">
                                  Reject
                                </Button>
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
          </TabsContent>

          <TabsContent value="aml" className="mt-4">
            <Card className="bg-white">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base font-semibold text-gray-900">
                  AML Monitoring Checks
                </CardTitle>
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50/80">
                        <TableHead className="text-xs font-medium text-gray-500">Entity</TableHead>
                        <TableHead className="text-xs font-medium text-gray-500">Check Type</TableHead>
                        <TableHead className="text-xs font-medium text-gray-500">Risk Level</TableHead>
                        <TableHead className="text-xs font-medium text-gray-500">Checked</TableHead>
                        <TableHead className="text-xs font-medium text-gray-500">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                          <TableRow key={i}>
                            {Array.from({ length: 5 }).map((_, j) => (
                              <TableCell key={j}>
                                <Skeleton className="h-5 w-20" />
                              </TableCell>
                            ))}
                          </TableRow>
                        ))
                      ) : (data?.amlChecks ?? []).length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-12 text-gray-400 text-sm">
                            No AML checks recorded
                          </TableCell>
                        </TableRow>
                      ) : (
                        (data?.amlChecks ?? []).map((a) => (
                          <TableRow key={a.id} className="hover:bg-gray-50 transition-colors">
                            <TableCell className="text-sm font-medium text-gray-900">{a.entity}</TableCell>
                            <TableCell className="text-sm text-gray-600">{a.type}</TableCell>
                            <TableCell>
                              <Badge
                                variant={riskVariant[a.risk] ?? 'outline'}
                                className={`capitalize text-xs ${riskColor[a.risk] ?? ''}`}
                              >
                                {a.risk}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-gray-500 whitespace-nowrap">{a.checkedAt}</TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={`capitalize text-xs ${amlStatusColor[a.status] ?? ''}`}
                              >
                                {a.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}