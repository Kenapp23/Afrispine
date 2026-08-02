'use client';
import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/stores/app';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { toast } from 'sonner';

const ACCENT = '#0A4D2E';
const authHeader = () => ({
  headers: { Authorization: `Bearer ${document.cookie.match(/afrispine_admin_session=([^;]+)/)?.[1] || ''}` },
});

type Tab = 'issues' | 'stories' | 'advertisers' | 'subscribers' | 'settings';

const SECTION_COLORS: Record<string, string> = {
  cover_story: 'bg-[#C9981A] text-[#1A1008]',
  market_pulse: 'bg-[#1A1008] text-white',
  company_spotlight: 'bg-emerald-700 text-white',
  opportunity: 'bg-emerald-500 text-white',
  diaspora_story: 'bg-amber-500 text-white',
};

const STATUS_STYLE: Record<string, string> = {
  published: 'bg-green-100 text-green-700',
  draft: 'bg-yellow-100 text-yellow-700',
  archived: 'bg-gray-100 text-gray-500',
  approved: 'bg-green-100 text-green-700',
  pending_review: 'bg-yellow-100 text-yellow-700',
  rejected: 'bg-red-100 text-red-700',
};

function Spinner() {
  return <div className="flex items-center justify-center py-12"><div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: ACCENT, borderTopColor: 'transparent' }} /></div>;
}

export function AdminDigestPage() {
  const nav = useAppStore(s => s.navigate);
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>('issues');
  const [stats, setStats] = useState<any>(null);
  const [issues, setIssues] = useState<any[]>([]);
  const [stories, setStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Settings state
  const [settings, setSettings] = useState({
    aiProvider: 'Anthropic Claude', contentTone: 'Warm', publishDay: 'Saturday',
    publishHour: 8, maxStories: 5, autoPublish: false, adAutoApprove: false,
  });

  // Fetch all data on mount (avoids per-tab effects and cascading renders)
  useEffect(() => {
    Promise.all([
      fetch('/api/digest/admin/stats', authHeader()).then(r => r.json()),
      fetch('/api/digest/issues?status=all&limit=50', authHeader()).then(r => r.json()),
      fetch('/api/digest/stories?limit=50', authHeader()).then(r => r.json()),
    ]).then(([s, i, st]) => {
      setStats(s);
      setIssues(Array.isArray(i) ? i : i.data ?? []);
      setStories(Array.isArray(st) ? st : st.data ?? []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const statCards = [
    { label: 'Total Subscribers', value: stats?.totalSubscribers ?? '—' },
    { label: 'Active Subscribers', value: stats?.activeSubscribers ?? '—' },
    { label: 'Issues Published', value: stats?.totalIssues ?? '—' },
    { label: 'Total Stories', value: stats?.totalStories ?? '—' },
    { label: 'Ad Revenue', value: stats?.totalAdRevenue != null ? `$${Number(stats.totalAdRevenue).toLocaleString()}` : '—' },
    { label: 'Avg Open Rate', value: stats?.avgOpenRate != null ? `${Number(stats.avgOpenRate).toFixed(1)}%` : '—' },
  ];

  const tabs: { key: Tab; label: string }[] = [
    { key: 'issues', label: 'Issues' }, { key: 'stories', label: 'Stories' },
    { key: 'advertisers', label: 'Advertisers' }, { key: 'subscribers', label: 'Subscribers' },
    { key: 'settings', label: 'Settings' },
  ];

  if (loading) return <div className="p-6"><Spinner /></div>;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: ACCENT }}>Digest Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">AfriSpine Digest editorial control room</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => nav('digest-current')}>View Digest →</Button>
      </div>

      {/* Stats Cards — always visible */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map(s => (
          <Card key={s.label} className="py-4 px-4 gap-0">
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className="text-lg font-bold mt-1">{s.value}</p>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b overflow-x-auto">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${tab === t.key ? 'border-b-2' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            style={tab === t.key ? { borderColor: ACCENT, color: ACCENT } : {}}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'issues' && (
        <div>
          <p className="text-sm text-gray-500 mb-3">{issues.length} issue{issues.length !== 1 ? 's' : ''}</p>
          {issues.length === 0 ? <p className="text-sm text-gray-400 py-8 text-center">No data yet</p> : (
            <Card className="py-0 gap-0 overflow-hidden">
              <div className="overflow-x-auto max-h-96 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="text-left p-3 font-medium w-16">#</th>
                      <th className="text-left p-3 font-medium">Headline</th>
                      <th className="text-left p-3 font-medium hidden md:table-cell">Date</th>
                      <th className="text-left p-3 font-medium text-center w-20">Stories</th>
                      <th className="text-left p-3 font-medium w-24">Status</th>
                      <th className="text-left p-3 font-medium w-20">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {issues.map((iss: any, i: number) => (
                      <tr key={iss.id ?? i} className="border-t hover:bg-gray-50/50">
                        <td className="p-3 text-gray-500">{iss.issueNumber ?? i + 1}</td>
                        <td className="p-3 max-w-xs truncate font-medium">{iss.headline ?? iss.title ?? ''}</td>
                        <td className="p-3 text-gray-500 hidden md:table-cell">{iss.publishedAt ? new Date(iss.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</td>
                        <td className="p-3 text-center">{iss.storyCount ?? iss.storiesCount ?? iss.stories?.length ?? '—'}</td>
                        <td className="p-3"><Badge className={STATUS_STYLE[iss.status] ?? ''}>{iss.status ?? 'draft'}</Badge></td>
                        <td className="p-3">
                          <Button size="sm" variant="ghost" onClick={() => nav('digest-issue', { slug: iss.slug })}>View</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}

      {tab === 'stories' && (
        <div>
          <p className="text-sm text-gray-500 mb-3">{stories.length} stor{stories.length !== 1 ? 'ies' : 'y'}</p>
          {stories.length === 0 ? <p className="text-sm text-gray-400 py-8 text-center">No data yet</p> : (
            <Card className="py-0 gap-0 overflow-hidden">
              <div className="overflow-x-auto max-h-96 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="text-left p-3 font-medium">Title</th>
                      <th className="text-left p-3 font-medium w-36">Section</th>
                      <th className="text-left p-3 font-medium w-20 text-center">Issue</th>
                      <th className="text-left p-3 font-medium w-24 hidden sm:table-cell">Read Time</th>
                      <th className="text-left p-3 font-medium w-28 hidden md:table-cell">Author</th>
                      <th className="text-left p-3 font-medium w-20">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stories.map((st: any, i: number) => (
                      <tr key={st.id ?? i} className="border-t hover:bg-gray-50/50">
                        <td className="p-3 max-w-sm truncate font-medium">{st.title ?? ''}</td>
                        <td className="p-3"><Badge className={SECTION_COLORS[st.section] ?? 'bg-gray-100 text-gray-600'}>{st.section?.replace(/_/g, ' ') ?? '—'}</Badge></td>
                        <td className="p-3 text-center text-gray-500">#{st.issueNumber ?? '—'}</td>
                        <td className="p-3 text-gray-500 hidden sm:table-cell">{st.readTime ?? st.readMinutes ? `${st.readTime ?? st.readMinutes}m` : '—'}</td>
                        <td className="p-3 text-gray-500 hidden md:table-cell max-w-[120px] truncate">{st.author ?? '—'}</td>
                        <td className="p-3">
                          <Button size="sm" variant="ghost" onClick={() => nav('digest-story', { slug: st.slug, issueSlug: st.issueSlug })}>View</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}

      {tab === 'advertisers' && (
        <div className="space-y-4">
          <Card className="py-4 px-4 gap-0">
            <p className="text-xs text-gray-500">Total Ad Revenue</p>
            <p className="text-2xl font-bold mt-1" style={{ color: ACCENT }}>${stats?.totalAdRevenue != null ? Number(stats.totalAdRevenue).toLocaleString() : '0'}</p>
          </Card>
          {(!stats?.recentAds || stats.recentAds.length === 0) ? (
            <p className="text-sm text-gray-400 py-8 text-center">No data yet</p>
          ) : (
            <Card className="py-0 gap-0 overflow-hidden">
              <div className="overflow-x-auto max-h-96 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="text-left p-3 font-medium">Advertiser</th>
                      <th className="text-left p-3 font-medium">Headline</th>
                      <th className="text-left p-3 font-medium w-28">Amount</th>
                      <th className="text-left p-3 font-medium w-32">Status</th>
                      <th className="text-left p-3 font-medium">AI Review</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentAds.map((ad: any, i: number) => (
                      <tr key={ad.id ?? i} className="border-t hover:bg-gray-50/50">
                        <td className="p-3 font-medium">{ad.advertiser ?? ad.company ?? '—'}</td>
                        <td className="p-3 max-w-xs truncate text-gray-600">{ad.headline ?? ad.title ?? '—'}</td>
                        <td className="p-3">${ad.amount != null ? Number(ad.amount).toLocaleString() : '—'}</td>
                        <td className="p-3"><Badge className={STATUS_STYLE[ad.status] ?? ''}>{ad.status?.replace(/_/g, ' ') ?? '—'}</Badge></td>
                        <td className="p-3 text-xs text-gray-500 max-w-[200px] truncate">
                          {ad.aiReview ? (
                            <Tooltip><TooltipTrigger asChild><span className="cursor-help underline decoration-dotted">{ad.aiReview.slice(0, 40)}…</span></TooltipTrigger><TooltipContent side="left" className="max-w-xs">{ad.aiReview}</TooltipContent></Tooltip>
                          ) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}

      {tab === 'subscribers' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="py-4 px-4 gap-0">
              <p className="text-xs text-gray-500">Total Subscribers</p>
              <p className="text-3xl font-bold mt-1" style={{ color: ACCENT }}>{stats?.totalSubscribers ?? 0}</p>
            </Card>
            <Card className="py-4 px-4 gap-0">
              <p className="text-xs text-gray-500">Active Subscribers</p>
              <div className="flex items-baseline gap-2 mt-1">
                <p className="text-3xl font-bold">{stats?.activeSubscribers ?? 0}</p>
                {stats?.totalSubscribers > 0 && (
                  <span className="text-xs text-green-600 font-medium">↑ {Math.round((stats.activeSubscribers / stats.totalSubscribers) * 100)}%</span>
                )}
              </div>
            </Card>
            <Card className="py-4 px-4 gap-0">
              <p className="text-xs text-gray-500">Pro Subscribers</p>
              <div className="flex items-baseline gap-2 mt-1">
                <p className="text-3xl font-bold">{stats?.proSubscribers ?? 0}</p>
                {stats?.totalSubscribers > 0 && (
                  <span className="text-xs text-emerald-600 font-medium">{Math.round((stats.proSubscribers / stats.totalSubscribers) * 100)}% of total</span>
                )}
              </div>
            </Card>
          </div>
          <Card className="py-6 gap-0"><CardContent className="px-6 text-center text-sm text-gray-400">Subscriber list available via API export</CardContent></Card>
        </div>
      )}

      {tab === 'settings' && (
        <Card className="py-0 gap-0">
          <CardContent className="p-6 space-y-5">
            <h3 className="font-semibold text-sm" style={{ color: ACCENT }}>AI & Publishing Configuration</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-500">AI Provider</Label>
                <Select value={settings.aiProvider} onValueChange={v => setSettings(s => ({ ...s, aiProvider: v }))}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="Anthropic Claude">Anthropic Claude</SelectItem><SelectItem value="OpenAI GPT">OpenAI GPT</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-500">Content Tone</Label>
                <Select value={settings.contentTone} onValueChange={v => setSettings(s => ({ ...s, contentTone: v }))}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="Professional">Professional</SelectItem><SelectItem value="Warm">Warm</SelectItem><SelectItem value="Academic">Academic</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-500">Publish Day</Label>
                <Select value={settings.publishDay} onValueChange={v => setSettings(s => ({ ...s, publishDay: v }))}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="Saturday">Saturday</SelectItem><SelectItem value="Sunday">Sunday</SelectItem><SelectItem value="Monday">Monday</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-500">Publish Hour (UTC)</Label>
                <Input type="number" min={0} max={23} value={settings.publishHour} onChange={e => setSettings(s => ({ ...s, publishHour: Math.max(0, Math.min(23, Number(e.target.value))) }))} className="w-full" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-500">Max Stories Per Issue</Label>
                <Input type="number" min={1} max={20} value={settings.maxStories} onChange={e => setSettings(s => ({ ...s, maxStories: Math.max(1, Number(e.target.value)) }))} className="w-full" />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 pt-2">
              <div className="flex items-center gap-3">
                <Switch checked={settings.autoPublish} onCheckedChange={v => setSettings(s => ({ ...s, autoPublish: v }))} />
                <Label className="text-sm">Auto-publish</Label>
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={settings.adAutoApprove} onCheckedChange={v => setSettings(s => ({ ...s, adAutoApprove: v }))} />
                <Label className="text-sm">Ad Auto-approve</Label>
              </div>
            </div>
            <div className="pt-2">
              <Button onClick={() => toast.success('Settings saved')} style={{ backgroundColor: ACCENT }} className="text-white hover:opacity-90">Save Settings</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}