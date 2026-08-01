'use client';

import React, { useState, useCallback } from 'react';
import { useAppStore } from '@/stores/app';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Store,
  Globe,
  Mail,
  Phone,
  Building2,
  CheckCircle2,
  Loader2,
  Shield,
  FileText,
  Plus,
  X,
} from 'lucide-react';

const COUNTRIES = [
  { code: 'KE', name: 'Kenya', flag: '🇰🇪' },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬' },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦' },
  { code: 'GH', name: 'Ghana', flag: '🇬🇭' },
  { code: 'UG', name: 'Uganda', flag: '🇺🇬' },
  { code: 'TZ', name: 'Tanzania', flag: '🇹🇿' },
];

const CATEGORIES = [
  'Supermarket', 'Electronics', 'Fashion', 'Airtime/Telecom', 'Travel',
  'Food & Dining', 'Healthcare', 'Entertainment', 'E-Commerce', 'Utilities',
];

export default function MerchantOnboardingPage() {
  const navigate = useAppStore((s) => s.navigate);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [brandName, setBrandName] = useState('');
  const [country, setCountry] = useState('');
  const [category, setCategory] = useState('');
  const [website, setWebsite] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [kycDocs, setKycDocs] = useState<string[]>([]);
  const [newDocUrl, setNewDocUrl] = useState('');

  const addDoc = () => {
    const url = newDocUrl.trim();
    if (!url) return;
    setKycDocs(prev => [...prev, url]);
    setNewDocUrl('');
  };

  const removeDoc = (idx: number) => {
    setKycDocs(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = useCallback(async () => {
    if (!brandName.trim() || !country) {
      toast.error('Brand name and country are required');
      return;
    }

    const selectedCountry = COUNTRIES.find(c => c.code === country);
    if (!selectedCountry) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/gift-cards/brand/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandName: brandName.trim(),
          country: selectedCountry.name,
          countryCode: selectedCountry.code,
          category: category || 'General',
          website: website.trim() || undefined,
          contactEmail: contactEmail.trim() || undefined,
          contactPhone: contactPhone.trim() || undefined,
          logoUrl: logoUrl.trim() || undefined,
          kycDocuments: kycDocs.length > 0 ? kycDocs : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Submission failed');
        return;
      }

      setSubmitted(true);
      toast.success('Brand application submitted successfully!');
    } catch {
      toast.error('Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [brandName, country, category, website, contactEmail, contactPhone, logoUrl, kycDocs]);

  if (submitted) {
    return (
      <main className="min-h-screen" style={{ backgroundColor: '#FAFAF8' }}>
        <div className="sticky top-0 z-10 flex items-center gap-3 bg-white/80 px-4 py-3 backdrop-blur-md border-b border-border/50">
          <button onClick={() => navigate('gifts')} className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-base font-bold text-gray-900">Brand Application</h1>
          </div>
        </div>

        <div className="mx-auto max-w-lg px-4 py-12 text-center space-y-6">
          <div className="inline-flex items-center justify-center size-20 rounded-full bg-emerald-100">
            <CheckCircle2 className="size-10 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Application Submitted!</h2>
          <p className="text-gray-600 leading-relaxed">
            Your brand <strong>{brandName}</strong> has been submitted for review.
            Our team will verify your KYC documents and you&apos;ll receive a confirmation within 2-3 business days.
          </p>
          <div className="rounded-xl border bg-amber-50 p-4 text-left space-y-3">
            <div className="flex items-center gap-2 text-amber-800 text-sm font-semibold">
              <Shield className="h-4 w-4" />
              What happens next?
            </div>
            <ol className="space-y-2 text-sm text-amber-700">
              <li className="flex gap-2"><span className="font-bold">1.</span> KYC documents reviewed by our compliance team</li>
              <li className="flex gap-2"><span className="font-bold">2.</span> Smart contract generated for your brand</li>
              <li className="flex gap-2"><span className="font-bold">3.</span> Gift card issuance enabled on AfriSpine</li>
            </ol>
          </div>
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => navigate('gifts')}>
            Back to Gifts Hub
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen" style={{ backgroundColor: '#FAFAF8' }}>
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-3 bg-white/80 px-4 py-3 backdrop-blur-md border-b border-border/50">
        <button onClick={() => navigate('gifts')} className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-base font-bold text-gray-900">Register Your Brand</h1>
        </div>
        <Store className="h-5 w-5 text-emerald-500" />
      </div>

      <div className="mx-auto max-w-lg px-4 py-6 space-y-6">
        {/* Intro */}
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/20">
            <Store className="h-7 w-7 text-white" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Join AfriSpine Gift Cards</h2>
          <p className="text-sm text-gray-500">Register your business to accept blockchain-backed gift cards.</p>
        </div>

        {/* Form */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6 space-y-4">
            {/* Brand Name */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">
                <Building2 className="mr-1.5 inline h-4 w-4" /> Brand Name *
              </Label>
              <Input placeholder="e.g. Naivas" value={brandName} onChange={e => setBrandName(e.target.value)} />
            </div>

            {/* Country */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">
                <Globe className="mr-1.5 inline h-4 w-4" /> Country *
              </Label>
              <div className="flex flex-wrap gap-2">
                {COUNTRIES.map(c => (
                  <button key={c.code} onClick={() => setCountry(c.code)}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${country === c.code ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                    {c.flag} {c.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Category</Label>
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES.map(c => (
                  <button key={c} onClick={() => setCategory(c)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${category === c ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Website */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">
                <Globe className="mr-1.5 inline h-4 w-4" /> Website
              </Label>
              <Input placeholder="https://example.com" value={website} onChange={e => setWebsite(e.target.value)} />
            </div>

            {/* Email & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm font-semibold">
                  <Mail className="mr-1.5 inline h-4 w-4" /> Contact Email
                </Label>
                <Input type="email" placeholder="info@brand.com" value={contactEmail} onChange={e => setContactEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold">
                  <Phone className="mr-1.5 inline h-4 w-4" /> Contact Phone
                </Label>
                <Input type="tel" placeholder="+254..." value={contactPhone} onChange={e => setContactPhone(e.target.value)} />
              </div>
            </div>

            {/* Logo URL */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Logo URL</Label>
              <Input placeholder="https://logo.clearbit.com/yourbrand.com" value={logoUrl} onChange={e => setLogoUrl(e.target.value)} />
              <p className="text-xs text-gray-400">We&apos;ll use your logo across all gift cards. Leave blank for a text-based fallback.</p>
            </div>

            {/* KYC Documents */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">
                <FileText className="mr-1.5 inline h-4 w-4" /> KYC Documents (URLs)
              </Label>
              <div className="flex gap-2">
                <Input placeholder="Document URL" value={newDocUrl} onChange={e => setNewDocUrl(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addDoc()} className="flex-1" />
                <Button size="sm" variant="outline" onClick={addDoc} disabled={!newDocUrl.trim()}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {kycDocs.length > 0 && (
                <div className="space-y-1.5">
                  {kycDocs.map((doc, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 text-xs">
                      <span className="flex-1 truncate text-gray-600">{doc}</span>
                      <button onClick={() => removeDoc(idx)} className="text-red-500 hover:text-red-700">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-gray-400">Add URLs for business registration, tax certificates, etc.</p>
            </div>

            {/* Submit */}
            <Button onClick={handleSubmit} disabled={submitting || !brandName.trim() || !country}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-12 font-bold mt-2">
              {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                <><Shield className="mr-2 h-4 w-4" /> Submit for Verification</>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
