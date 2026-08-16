'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useAppStore } from '@/stores/app';
import { toast } from 'sonner';
import {
  Building2,
  Rocket,
  BarChart3,
  Loader2,
  CheckCircle2,
  Eye,
  MousePointerClick,
  Wallet,
  ArrowLeft,
  Plus,
} from 'lucide-react';

/* ── Constants ────────────────────────────────────────────── */

const CATEGORIES = ['Music', 'Comedy', 'Film', 'Fashion', 'Sports', 'Education', 'Spirituality', 'Food', 'Beauty'];

const SLOT_TYPES = [
  { key: 'backdrop_banner', label: 'Backdrop Banner' },
  { key: 'smart_chyron', label: 'Smart Chyron' },
  { key: 'intro_splash', label: 'Intro Splash' },
  { key: 'feed_native_card', label: 'Feed Native Card' },
] as const;

const OBJECTIVES = [
  { value: 'awareness', label: 'Brand Awareness' },
  { value: 'category_takeover', label: 'Category Takeover' },
  { value: 'creator_boost', label: 'Creator Boost' },
] as const;

/* ── Types ───────────────────────────────────────────────── */

interface SponsorBrandData {
  id: string;
  companyName: string;
  contactEmail: string;
  contactName: string | null;
  kybStatus: string;
  createdAt: string;
}

interface CampaignData {
  id: string;
  name: string;
  objective: string;
  budgetKes: number;
  spentKes: number;
  status: string;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  slots: { id: string; slotType: string; currentImpressions: number; clickCount: number }[];
}

/* ── Component ───────────────────────────────────────────── */

export function SponsorDashboardPage() {
  const navigate = useAppStore((s) => s.navigate);
  const viewParams = useAppStore((s) => s.viewParams);

  // Step tracking
  const [step, setStep] = useState(1);
  const [brandId, setBrandId] = useState<string | null>(viewParams.brandId || null);
  const [brandData, setBrandData] = useState<SponsorBrandData | null>(null);
  const [campaigns, setCampaigns] = useState<CampaignData[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);

  // Brand form state
  const [companyName, setCompanyName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactName, setContactName] = useState('');
  const [website, setWebsite] = useState('');
  const [billingPhone, setBillingPhone] = useState('');
  const [submittingBrand, setSubmittingBrand] = useState(false);

  // Campaign form state
  const [campaignName, setCampaignName] = useState('');
  const [objective, setObjective] = useState('');
  const [budgetKes, setBudgetKes] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [creativeUrl, setCreativeUrl] = useState('');
  const [submittingCampaign, setSubmittingCampaign] = useState(false);

  /* ── Fetch campaigns on brand change ─── */

  const fetchCampaigns = useCallback(async () => {
    if (!brandId) return;
    setLoadingCampaigns(true);
    try {
      const res = await fetch(`/api/sponsor/campaigns?brandId=${brandId}`);
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data.campaigns || []);
      }
    } catch {
      // Silently fail — show empty state
    } finally {
      setLoadingCampaigns(false);
    }
  }, [brandId]);

  useEffect(() => {
    if (brandId) {
      setStep(2);
      fetchCampaigns();
    }
  }, [brandId, fetchCampaigns]);

  /* ── Handlers ─── */

  const handleBrandSubmit = async () => {
    if (!companyName.trim() || !contactEmail.trim()) {
      toast.error('Please fill in Company Name and Contact Email.');
      return;
    }
    setSubmittingBrand(true);
    try {
      const res = await fetch('/api/sponsor/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: companyName.trim(),
          contactEmail: contactEmail.trim(),
          contactName: contactName.trim() || null,
          website: website.trim() || null,
          billingPhone: billingPhone.trim() || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to create brand.');
      }
      const data = await res.json();
      setBrandId(data.brand.id);
      setBrandData(data.brand);
      toast.success('Brand registered! You can now create campaigns.');
      setStep(2);
    } catch (e: any) {
      toast.error(e.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmittingBrand(false);
    }
  };

  const handleCampaignSubmit = async () => {
    if (!campaignName.trim() || !objective || !budgetKes) {
      toast.error('Please fill in Campaign Name, Objective, and Budget.');
      return;
    }
    if (!brandId) return;
    setSubmittingCampaign(true);
    try {
      const res = await fetch('/api/sponsor/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandId,
          name: campaignName.trim(),
          objective,
          budgetKes: parseFloat(budgetKes),
          startDate: startDate || null,
          endDate: endDate || null,
          categories: selectedCategories,
          slotTypes: selectedSlots,
          creativeUrl: creativeUrl.trim() || '',
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to launch campaign.');
      }
      toast.success('Campaign submitted for review!');
      setCampaignName('');
      setObjective('');
      setBudgetKes('');
      setStartDate('');
      setEndDate('');
      setSelectedCategories([]);
      setSelectedSlots([]);
      setCreativeUrl('');
      fetchCampaigns();
    } catch (e: any) {
      toast.error(e.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmittingCampaign(false);
    }
  };

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const toggleSlot = (slotKey: string) => {
    setSelectedSlots((prev) =>
      prev.includes(slotKey) ? prev.filter((s) => s !== slotKey) : [...prev, slotKey]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'pending_review':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'paused':
        return 'bg-gray-100 text-gray-600 border-gray-200';
      case 'completed':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'rejected':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  /* ── Render ─── */

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => navigate('sponsor-landing')}
            className="text-2xl font-extrabold tracking-tight text-emerald-600 hover:text-emerald-700 transition-colors"
          >
            AfriSpine
          </button>

          <div className="flex items-center gap-3">
            {brandData && (
              <span className="hidden sm:inline-flex items-center gap-1.5 text-sm text-gray-500">
                <Building2 className="h-4 w-4" />
                {brandData.companyName}
              </span>
            )}
            <Badge
              variant="outline"
              className={`font-semibold text-xs ${
                brandData?.kybStatus === 'verified'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-amber-200 bg-amber-50 text-amber-700'
              }`}
            >
              {brandData?.kybStatus === 'verified' ? '✓ Verified' : brandData?.kybStatus || 'Not Registered'}
            </Badge>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          {/* Back button */}
          <button
            onClick={() => navigate('sponsor-landing')}
            className="mb-6 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-emerald-600 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Advertise
          </button>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2">
            Brand Dashboard
          </h1>
          <p className="text-gray-500 mb-8">
            {brandId
              ? 'Create and manage your advertising campaigns.'
              : 'Register your brand to start advertising on AfriSpine.'}
          </p>

          {/* ── Step 1: Brand Registration ── */}
          {!brandId && (
            <Card className="max-w-2xl border-gray-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Building2 className="h-5 w-5 text-emerald-600" />
                  Brand Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name *</Label>
                    <Input
                      id="companyName"
                      placeholder="Acme Ltd"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactEmail">Contact Email *</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      placeholder="ads@acme.co.ke"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactName">Contact Name</Label>
                    <Input
                      id="contactName"
                      placeholder="Jane Wanjiku"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      placeholder="https://acme.co.ke"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="billingPhone">Billing Phone (M-Pesa)</Label>
                  <Input
                    id="billingPhone"
                    placeholder="+254 7XX XXX XXX"
                    value={billingPhone}
                    onChange={(e) => setBillingPhone(e.target.value)}
                  />
                </div>
                <Button
                  onClick={handleBrandSubmit}
                  disabled={submittingBrand}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold mt-2"
                >
                  {submittingBrand ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting…
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Submit for Verification
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* ── Step 2+: Campaign Builder + Campaign List ── */}
          {brandId && (
            <div className="grid gap-8 lg:grid-cols-5">
              {/* Campaign Builder (left 3 cols) */}
              <div className="lg:col-span-3 space-y-6">
                <Card className="border-gray-100">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Rocket className="h-5 w-5 text-emerald-600" />
                      Create Campaign
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="campaignName">Campaign Name</Label>
                      <Input
                        id="campaignName"
                        placeholder="e.g. Summer Splash 2025"
                        value={campaignName}
                        onChange={(e) => setCampaignName(e.target.value)}
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Objective</Label>
                        <Select value={objective} onValueChange={setObjective}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select objective" />
                          </SelectTrigger>
                          <SelectContent>
                            {OBJECTIVES.map((obj) => (
                              <SelectItem key={obj.value} value={obj.value}>
                                {obj.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="budget">Budget (KES)</Label>
                        <Input
                          id="budget"
                          type="number"
                          placeholder="50000"
                          value={budgetKes}
                          onChange={(e) => setBudgetKes(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="startDate">Start Date</Label>
                        <Input
                          id="startDate"
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="endDate">End Date</Label>
                        <Input
                          id="endDate"
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Categories */}
                    <div className="space-y-2">
                      <Label>Target Categories</Label>
                      <div className="flex flex-wrap gap-2">
                        {CATEGORIES.map((cat) => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => toggleCategory(cat)}
                            className={`rounded-full px-3 py-1 text-xs font-semibold transition-all duration-200 ${
                              selectedCategories.includes(cat)
                                ? 'bg-emerald-600 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Slot Types */}
                    <div className="space-y-2">
                      <Label>Ad Slot Types</Label>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {SLOT_TYPES.map((slot) => (
                          <label
                            key={slot.key}
                            className="flex items-center gap-2.5 rounded-lg border border-gray-100 p-3 cursor-pointer hover:bg-gray-50 transition-colors"
                          >
                            <Checkbox
                              checked={selectedSlots.includes(slot.key)}
                              onCheckedChange={() => toggleSlot(slot.key)}
                            />
                            <span className="text-sm font-medium text-gray-700">{slot.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Creative URL */}
                    <div className="space-y-2">
                      <Label htmlFor="creativeUrl">Creative URL</Label>
                      <Input
                        id="creativeUrl"
                        placeholder="https://your-cdn.com/banner.jpg"
                        value={creativeUrl}
                        onChange={(e) => setCreativeUrl(e.target.value)}
                      />
                    </div>

                    <Button
                      onClick={handleCampaignSubmit}
                      disabled={submittingCampaign}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold mt-2 w-full sm:w-auto"
                    >
                      {submittingCampaign ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Launching…
                        </>
                      ) : (
                        <>
                          <Plus className="mr-2 h-4 w-4" />
                          Launch Campaign
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Campaign List (right 2 cols) */}
              <div className="lg:col-span-2">
                <Card className="border-gray-100">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <BarChart3 className="h-5 w-5 text-emerald-600" />
                      Your Campaigns
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loadingCampaigns ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
                      </div>
                    ) : campaigns.length === 0 ? (
                      <div className="text-center py-8">
                        <BarChart3 className="h-10 w-10 mx-auto text-gray-300 mb-3" />
                        <p className="text-sm text-gray-500">No campaigns yet.</p>
                        <p className="text-xs text-gray-400 mt-1">Create your first campaign to get started.</p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {campaigns.map((c) => (
                          <div
                            key={c.id}
                            className="rounded-lg border border-gray-100 p-3 space-y-2 hover:bg-gray-50 transition-colors cursor-pointer"
                            onClick={() => navigate('sponsor-campaign-detail', { campaignId: c.id })}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <h4 className="text-sm font-semibold text-gray-900 truncate">{c.name}</h4>
                              <Badge variant="outline" className={`text-[10px] shrink-0 ${getStatusColor(c.status)}`}>
                                {c.status.replace(/_/g, ' ')}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-center">
                              <div>
                                <p className="text-[10px] uppercase tracking-wide text-gray-400">Budget</p>
                                <p className="text-xs font-bold text-gray-700">KES {c.budgetKes.toLocaleString()}</p>
                              </div>
                              <div>
                                <p className="text-[10px] uppercase tracking-wide text-gray-400">Impressions</p>
                                <p className="text-xs font-bold text-gray-700">
                                  {c.slots.reduce((a, s) => a + s.currentImpressions, 0).toLocaleString()}
                                </p>
                              </div>
                              <div>
                                <p className="text-[10px] uppercase tracking-wide text-gray-400">Clicks</p>
                                <p className="text-xs font-bold text-gray-700">
                                  {c.slots.reduce((a, s) => a + s.clickCount, 0).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
