'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/stores/app';
import {
  ArrowLeft,
  Eye,
  MousePointerClick,
  Wallet,
  BarChart3,
  Target,
  Loader2,
  ImageIcon,
} from 'lucide-react';

/* ── Demo Data (v1 fallback) ──────────────────────────────── */

const DEMO_CAMPAIGN = {
  id: 'demo-1',
  name: 'Summer Splash 2025',
  objective: 'awareness',
  budgetKes: 100000,
  spentKes: 37500,
  status: 'active',
  startDate: '2025-07-01T00:00:00.000Z',
  endDate: '2025-08-31T00:00:00.000Z',
  createdAt: '2025-06-28T10:00:00.000Z',
  slots: [
    { id: 'slot-1', slotType: 'backdrop_banner', creativeUrl: '', currentImpressions: 42000, clickCount: 840 },
    { id: 'slot-2', slotType: 'smart_chyron', creativeUrl: '', currentImpressions: 61500, clickCount: 1230 },
    { id: 'slot-3', slotType: 'feed_native_card', creativeUrl: '', currentImpressions: 28000, clickCount: 1120 },
  ],
};

/* ── Types ───────────────────────────────────────────────── */

interface SlotRow {
  id: string;
  slotType: string;
  creativeUrl: string;
  currentImpressions: number;
  clickCount: number;
  status?: string;
}

interface CampaignDetail {
  id: string;
  name: string;
  objective: string;
  budgetKes: number;
  spentKes: number;
  status: string;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  slots: SlotRow[];
}

/* ── Helpers ─────────────────────────────────────────────── */

function getStatusColor(status: string) {
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
}

function getObjectiveLabel(obj: string) {
  switch (obj) {
    case 'awareness':
      return 'Brand Awareness';
    case 'category_takeover':
      return 'Category Takeover';
    case 'creator_boost':
      return 'Creator Boost';
    default:
      return obj;
  }
}

function getSlotLabel(type: string) {
  switch (type) {
    case 'backdrop_banner':
      return 'Backdrop Banner';
    case 'smart_chyron':
      return 'Smart Chyron';
    case 'intro_splash':
      return 'Intro Splash';
    case 'feed_native_card':
      return 'Feed Native Card';
    default:
      return type;
  }
}

/* ── Component ───────────────────────────────────────────── */

export function SponsorCampaignDetailPage() {
  const navigate = useAppStore((s) => s.navigate);
  const viewParams = useAppStore((s) => s.viewParams);
  const campaignId = viewParams.campaignId;

  const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [usingDemo, setUsingDemo] = useState(false);

  useEffect(() => {
    if (!campaignId) {
      // Show demo data if no campaignId
      setCampaign(DEMO_CAMPAIGN as unknown as CampaignDetail);
      setUsingDemo(true);
      setLoading(false);
      return;
    }

    const fetchCampaign = async () => {
      try {
        const res = await fetch(`/api/sponsor/campaigns?brandId=all&campaignId=${campaignId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.campaign) {
            setCampaign(data.campaign);
            setLoading(false);
            return;
          }
        }
        // Fallback to demo data
        setCampaign(DEMO_CAMPAIGN as unknown as CampaignDetail);
        setUsingDemo(true);
      } catch {
        setCampaign(DEMO_CAMPAIGN as unknown as CampaignDetail);
        setUsingDemo(true);
      } finally {
        setLoading(false);
      }
    };
    fetchCampaign();
  }, [campaignId]);

  const totalImpressions = campaign?.slots.reduce((a, s) => a + s.currentImpressions, 0) || 0;
  const totalClicks = campaign?.slots.reduce((a, s) => a + s.clickCount, 0) || 0;
  const ctr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0.00';
  const budgetPct = campaign?.budgetKes ? Math.min((campaign.spentKes / campaign.budgetKes) * 100, 100) : 0;
  const remaining = campaign ? campaign.budgetKes - campaign.spentKes : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          <span className="text-sm text-gray-400">Loading campaign…</span>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Campaign not found.</p>
          <Button
            variant="outline"
            onClick={() => navigate('sponsor-dashboard')}
            className="mt-4 border-emerald-600 text-emerald-600"
          >
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

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
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          {/* Back */}
          <button
            onClick={() => navigate('sponsor-dashboard')}
            className="mb-6 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-emerald-600 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </button>

          {/* Demo banner */}
          {usingDemo && (
            <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              Showing demo data — connect to the database for live metrics.
            </div>
          )}

          {/* Campaign Header */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">{campaign.name}</h1>
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <Badge variant="outline" className={`text-xs font-semibold ${getStatusColor(campaign.status)}`}>
                  {campaign.status.replace(/_/g, ' ')}
                </Badge>
                <span className="text-sm text-gray-500">
                  <Target className="inline h-3.5 w-3.5 mr-1" />
                  {getObjectiveLabel(campaign.objective)}
                </span>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate('sponsor-dashboard')}
              className="border-emerald-600 text-emerald-600 hover:bg-emerald-50 shrink-0"
            >
              Manage Campaigns
            </Button>
          </div>

          {/* Budget Progress */}
          <Card className="border-gray-100 mb-8">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Wallet className="h-5 w-5 text-emerald-600" />
                Budget Utilisation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Spent</span>
                  <span className="font-bold text-gray-900">
                    KES {campaign.spentKes.toLocaleString()} <span className="font-normal text-gray-400">/ KES {campaign.budgetKes.toLocaleString()}</span>
                  </span>
                </div>
                <div className="w-full h-3 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${budgetPct}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400">
                  {budgetPct.toFixed(1)}% used &middot; KES {remaining.toLocaleString()} remaining
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Metric Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card className="border-gray-100 bg-gradient-to-br from-emerald-50 to-white">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 shrink-0">
                  <Eye className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Total Impressions</p>
                  <p className="text-xl font-extrabold text-gray-900">{totalImpressions.toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-gray-100 bg-gradient-to-br from-amber-50 to-white">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600 shrink-0">
                  <MousePointerClick className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Total Clicks</p>
                  <p className="text-xl font-extrabold text-gray-900">{totalClicks.toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-gray-100 bg-gradient-to-br from-emerald-50 to-white">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 shrink-0">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">CTR</p>
                  <p className="text-xl font-extrabold text-gray-900">{ctr}%</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-gray-100 bg-gradient-to-br from-amber-50 to-white">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600 shrink-0">
                  <Wallet className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Remaining Budget</p>
                  <p className="text-xl font-extrabold text-gray-900">KES {remaining.toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Ad Slots */}
          <Card className="border-gray-100">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-emerald-600" />
                Ad Slots
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {campaign.slots.map((slot) => {
                  const slotCtr = slot.currentImpressions > 0
                    ? ((slot.clickCount / slot.currentImpressions) * 100).toFixed(2)
                    : '0.00';
                  return (
                    <div
                      key={slot.id}
                      className="rounded-lg border border-gray-100 p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-500 shrink-0">
                            <ImageIcon className="h-5 w-5" />
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-gray-900">
                              {getSlotLabel(slot.slotType)}
                            </h4>
                            {slot.creativeUrl && (
                              <p className="text-xs text-gray-400 truncate max-w-xs">{slot.creativeUrl}</p>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-center sm:text-right">
                          <div>
                            <p className="text-[10px] uppercase tracking-wide text-gray-400">Impressions</p>
                            <p className="text-sm font-bold text-gray-700">{slot.currentImpressions.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase tracking-wide text-gray-400">Clicks</p>
                            <p className="text-sm font-bold text-gray-700">{slot.clickCount.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase tracking-wide text-gray-400">CTR</p>
                            <p className="text-sm font-bold text-gray-700">{slotCtr}%</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
