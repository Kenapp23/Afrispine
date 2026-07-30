'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { FileText, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Invoice {
  id: string;
  invoiceNumber: string;
  provider: string;
  period: string;
  volume: number;
  fee: number;
  status: string;
  details?: {
    transfers: number;
    successfulRate: number;
    totalFees: number;
    deductions: number;
    netPayable: number;
    items: { description: string; amount: number }[];
  };
}

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  paid: 'default',
  pending: 'secondary',
  overdue: 'destructive',
  draft: 'outline',
};

const statusColor: Record<string, string> = {
  paid: 'bg-emerald-100 text-emerald-700',
  pending: 'bg-amber-100 text-amber-700',
  overdue: 'bg-red-100 text-red-700',
  draft: 'bg-gray-100 text-gray-600',
};

export default function AdminInvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    async function fetchInvoices() {
      try {
        const res = await fetch('/api/admin/invoices', {
          headers: { Authorization: 'Bearer ' + localStorage.getItem('afrispine_token') },
        });
        if (!res.ok) throw new Error('Failed to load invoices');
        const json = await res.json();
        setInvoices(json.data ?? json.invoices ?? []);
      } catch {
        toast.error('Failed to load invoices');
      } finally {
        setLoading(false);
      }
    }
    fetchInvoices();
  }, []);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Invoices</h1>
        <p className="text-sm text-gray-500 mt-1">Provider billing and fee invoices</p>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="h-4 w-4 text-emerald-600" />
              All Invoices
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/80">
                    <TableHead className="text-xs font-medium text-gray-500">Invoice #</TableHead>
                    <TableHead className="text-xs font-medium text-gray-500">Provider</TableHead>
                    <TableHead className="text-xs font-medium text-gray-500">Period</TableHead>
                    <TableHead className="text-xs font-medium text-gray-500">Volume</TableHead>
                    <TableHead className="text-xs font-medium text-gray-500">Fee</TableHead>
                    <TableHead className="text-xs font-medium text-gray-500">Status</TableHead>
                    <TableHead className="text-xs font-medium text-gray-500">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 7 }).map((_, j) => (
                          <TableCell key={j}>
                            <Skeleton className="h-5 w-20" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : invoices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-16">
                        <FileText className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-400 text-sm">No invoices found</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    invoices.map((inv) => (
                      <TableRow key={inv.id} className="hover:bg-gray-50 transition-colors">
                        <TableCell className="text-sm font-medium text-gray-900">
                          {inv.invoiceNumber}
                        </TableCell>
                        <TableCell className="text-sm text-gray-700">{inv.provider}</TableCell>
                        <TableCell className="text-sm text-gray-600 whitespace-nowrap">{inv.period}</TableCell>
                        <TableCell className="text-sm text-gray-700">
                          ${inv.volume.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-sm font-semibold text-gray-900">
                          ${inv.fee.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={statusVariant[inv.status] ?? 'outline'}
                            className={`capitalize text-xs ${statusColor[inv.status] ?? ''}`}
                          >
                            {inv.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedInvoice(inv)}
                            className="text-emerald-600 hover:text-emerald-700"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
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

      {/* Invoice Detail Dialog */}
      <Dialog open={!!selectedInvoice} onOpenChange={(open) => !open && setSelectedInvoice(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-gray-900 flex items-center gap-2">
              <FileText className="h-5 w-5 text-emerald-600" />
              Invoice {selectedInvoice?.invoiceNumber}
            </DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Provider</p>
                  <p className="text-sm font-medium text-gray-900">{selectedInvoice.provider}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Period</p>
                  <p className="text-sm text-gray-700">{selectedInvoice.period}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Status</p>
                  <Badge
                    variant={statusVariant[selectedInvoice.status] ?? 'outline'}
                    className={`capitalize text-xs ${statusColor[selectedInvoice.status] ?? ''}`}
                  >
                    {selectedInvoice.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Volume</p>
                  <p className="text-sm text-gray-900 font-medium">
                    ${selectedInvoice.volume.toLocaleString()}
                  </p>
                </div>
              </div>

              {selectedInvoice.details && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-gray-900">Breakdown</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="text-gray-500">Transfers</div>
                      <div className="text-gray-900 text-right">{selectedInvoice.details.transfers}</div>
                      <div className="text-gray-500">Success Rate</div>
                      <div className="text-gray-900 text-right">{selectedInvoice.details.successfulRate}%</div>
                      <div className="text-gray-500">Total Fees</div>
                      <div className="text-gray-900 text-right">
                        ${selectedInvoice.details.totalFees.toLocaleString()}
                      </div>
                      <div className="text-gray-500">Deductions</div>
                      <div className="text-red-600 text-right">
                        -${selectedInvoice.details.deductions.toLocaleString()}
                      </div>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-sm font-semibold">
                      <span className="text-gray-900">Net Payable</span>
                      <span className="text-emerald-600">
                        ${selectedInvoice.details.netPayable.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {selectedInvoice.details.items && selectedInvoice.details.items.length > 0 && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold text-gray-900">Line Items</h4>
                        {selectedInvoice.details.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span className="text-gray-600">{item.description}</span>
                            <span className="text-gray-900">${item.amount.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}