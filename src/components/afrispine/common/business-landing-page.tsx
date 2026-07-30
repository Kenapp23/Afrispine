'use client';

import React from 'react';
import { useAppStore } from '@/stores/app';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowLeft, ArrowRight, DollarSign, Globe2, Users, Truck, FileText, Heart, Landmark } from 'lucide-react';

const useCases = [
  {
    icon: DollarSign,
    headline: 'Profit Repatriation',
    description: 'Convert KES/NGN profits to USD',
  },
  {
    icon: Globe2,
    headline: 'Supplier Payments',
    description: 'Pay international invoices in USD/EUR',
  },
  {
    icon: Users,
    headline: 'Payroll',
    description: 'Pay international staff in their currency',
  },
  {
    icon: Truck,
    headline: 'Import Payments',
    description: 'Fund goods from China, Europe, USA',
  },
  {
    icon: Heart,
    headline: 'NGO Disbursements',
    description: 'Move grants from USD to local currency',
  },
  {
    icon: Landmark,
    headline: 'Government Agencies',
    description: 'Disburse funds to ministries, counties, and state entities across Africa',
  },
];

const comparisonRows = [
  { feature: 'FX Margin', bank: '3–5%', afrispine: '0.5–1%' },
  { feature: 'Speed', bank: '3–7 days', afrispine: 'Same day – next day' },
  { feature: 'Min amount', bank: 'Any', afrispine: '$5,000' },
  { feature: 'Reporting', bank: 'Manual', afrispine: 'Automated' },
  { feature: 'API access', bank: 'No', afrispine: 'Coming soon' },
];

export function BusinessLandingPage() {
  const navigate = useAppStore((s) => s.navigate);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('landing')}
        className="mb-6 -ml-2 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        Back
      </Button>

      {/* Hero */}
      <section className="text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 mb-6">
          <FileText className="h-3.5 w-3.5" />
          AfriSpine Business
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">
          Move large amounts between currencies. No bank delays. No hidden charges.
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          From $5,000. Same-day settlement. 0.3–1% transparent margin.
        </p>
        <Button
          onClick={() => navigate('business-register')}
          size="lg"
          className="mt-8 bg-emerald-600 text-white hover:bg-emerald-700"
        >
          Open a Business Account
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </section>

      {/* Who It's For */}
      <section className="mt-16 text-center max-w-2xl mx-auto">
        <h2 className="text-xl font-bold text-gray-900">Who It&apos;s For</h2>
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
          Built for African businesses, multinationals, NGOs, government agencies, and importers who move money internationally.
        </p>
      </section>

      {/* Use Cases */}
      <section className="mt-14">
        <h2 className="text-xl font-bold text-gray-900 text-center mb-8">
          Use Cases
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {useCases.map((uc) => {
            const Icon = uc.icon;
            return (
              <div
                key={uc.headline}
                className="rounded-xl border border-border/60 p-5 transition-colors hover:border-emerald-200 hover:bg-emerald-50/30"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
                  <Icon className="h-5 w-5 text-emerald-600" />
                </div>
                <h3 className="mt-3 text-sm font-semibold text-gray-900">
                  {uc.headline}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {uc.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Comparison Table */}
      <section className="mt-16">
        <h2 className="text-xl font-bold text-gray-900 text-center mb-8">
          How We Compare
        </h2>
        <div className="rounded-xl border border-border/60 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/80">
                <TableHead className="w-[40%] font-semibold text-gray-700">
                  Feature
                </TableHead>
                <TableHead className="font-semibold text-gray-700">
                  Commercial Bank
                </TableHead>
                <TableHead className="font-semibold text-emerald-700">
                  AfriSpine Business
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {comparisonRows.map((row) => (
                <TableRow key={row.feature}>
                  <TableCell className="font-medium text-gray-900">
                    {row.feature}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {row.bank}
                  </TableCell>
                  <TableCell className="text-emerald-700 font-medium">
                    {row.afrispine}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      {/* CTA */}
      <section className="mt-16 rounded-xl bg-emerald-600 p-8 sm:p-10 text-center text-white">
        <h2 className="text-2xl font-bold">Ready to move money smarter?</h2>
        <p className="mt-2 text-emerald-100 text-sm">
          Open your business account today. No setup fees. No minimum balance required.
        </p>
        <Button
          onClick={() => navigate('business-register')}
          size="lg"
          className="mt-6 bg-white text-emerald-700 hover:bg-emerald-50 font-semibold"
        >
          Open Business Account
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </section>
    </div>
  );
}