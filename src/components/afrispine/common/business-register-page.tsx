'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/stores/app';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const businessRegisterSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  registrationNumber: z.string().min(1, 'Registration number is required'),
  countryOfIncorporation: z.string().min(1, 'Country of incorporation is required'),
  industry: z.string().min(1, 'Industry is required'),
  signatoryName: z.string().min(1, 'Authorised signatory name is required'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().optional().default(''),
  monthlyVolume: z.coerce.number().min(0).optional().default(0),
  useCase: z.string().min(1, 'Primary use case is required'),
});

type BusinessRegisterForm = z.infer<typeof businessRegisterSchema>;

const countryOptions = [
  'Kenya',
  'Nigeria',
  'Ghana',
  'UK',
  'US',
  'Other',
];

const industryOptions = [
  'Technology',
  'Import/Export',
  'Manufacturing',
  'Agriculture',
  'NGO/Non-profit',
  'Financial Services',
  'Consulting',
  'Other',
];

const useCaseOptions = [
  'Profit repatriation',
  'Supplier payments',
  'Payroll',
  'Import payments',
  'NGO disbursements',
  'Other',
];

export function BusinessRegisterPage() {
  const navigate = useAppStore((s) => s.navigate);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<BusinessRegisterForm>({
    resolver: zodResolver(businessRegisterSchema),
    defaultValues: {
      companyName: '',
      registrationNumber: '',
      countryOfIncorporation: '',
      industry: '',
      signatoryName: '',
      email: '',
      phone: '',
      monthlyVolume: 0,
      useCase: '',
    },
  });

  const onSubmit = async (data: BusinessRegisterForm) => {
    setLoading(true);
    try {
      const res = await fetch('/api/business/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          companyRegNumber: data.registrationNumber,
          monthlyVolumeUsd: data.monthlyVolume,
        }),
      });
      const result = await res.json();
      if (!res.ok) {
        toast.error(result.error || 'Registration failed. Please try again.');
        return;
      }
      setSubmitted(true);
    } catch {
      toast.error('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('business')}
          className="mb-6 -ml-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Business
        </Button>

        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-7 w-7 text-emerald-600" />
          </div>
          <h2 className="mt-4 text-xl font-bold text-gray-900">
            Application Submitted
          </h2>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            Your application is under review. We&apos;ll respond within 1 business day.
          </p>
          <Button
            onClick={() => navigate('business')}
            variant="outline"
            className="mt-6 border-emerald-600 text-emerald-700 hover:bg-emerald-50"
          >
            Back to AfriSpine Business
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 py-10 sm:py-16">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('business')}
        className="mb-6 -ml-2 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        Back
      </Button>

      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
        Open a Business Account
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Complete the form below to apply for an AfriSpine Business account.
      </p>

      <div className="mt-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {/* Company Name */}
            <FormField
              control={form.control}
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Acme Ltd" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Registration Number */}
            <FormField
              control={form.control}
              name="registrationNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company registration number *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. PVT-ABC123" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Country of Incorporation */}
            <FormField
              control={form.control}
              name="countryOfIncorporation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Country of incorporation *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {countryOptions.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Industry */}
            <FormField
              control={form.control}
              name="industry"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Industry *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select industry" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {industryOptions.map((i) => (
                        <SelectItem key={i} value={i}>
                          {i}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Authorised Signatory Name */}
            <FormField
              control={form.control}
              name="signatoryName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Authorised signatory name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Jane Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Email */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email *</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="jane@company.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Phone */}
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input placeholder="+254 700 000 000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Monthly Volume */}
            <FormField
              control={form.control}
              name="monthlyVolume"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estimated monthly volume ($)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      placeholder="e.g. 50000"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Primary Use Case */}
            <FormField
              control={form.control}
              name="useCase"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Primary use case *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select use case" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {useCaseOptions.map((u) => (
                        <SelectItem key={u} value={u}>
                          {u}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Application
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}