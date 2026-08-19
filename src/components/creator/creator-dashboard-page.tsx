'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAppStore } from '@/stores/app';
import {
  BarChart3,
  Eye,
  Heart,
  Wallet,
  Upload,
  ArrowLeft,
  LogOut,
  Video,
  MessageSquare,
  Building2,
  Calendar,
  Clock,
  Loader2,
  Inbox,
} from 'lucide-react';
import { toast } from 'sonner';
import { CreatorInvitePack } from '@/components/creator/creator-invite-pack';

/* -- Demo Data ----------------------------------------------- */

const DEMO_STATS = {
  totalViews: 284_930,
  totalLikes: 41_275,
  totalEarningsKes: 187_650,
  videosPosted: 23,
};

interface DemoVideo {
  id: string;
  title: string;
  category: string;
  views: number;
  likes: number;
  earningsKes: number;
  status: 'live' | 'processing' | 'draft' | 'under_review';
}

const DEMO_VIDEOS: DemoVideo[] = [
  { id: 'v1', title: 'Nairobi Street Food Tour', category: 'Food', views: 84_200, likes: 12_340, earningsKes: 56_700, status: 'live' },
  { id: 'v2', title: 'How to Style Kitenge for Work', category: 'Fashion', views: 62_100, likes: 9_800, earningsKes: 41_500, status: 'live' },
  { id: 'v3', title: 'Comedy Skit: Matatu Culture', category: 'Comedy', views: 53_400, likes: 8_210, earningsKes: 35_200, status: 'live' },
  { id: 'v4', title: 'Afrobeats Dance Challenge', category: 'Music', views: 41_800, likes: 6_530, earningsKes: 28_000, status: 'live' },
  { id: 'v5', title: 'DIY Natural Hair Routine', category: 'Beauty', views: 28_900, likes: 3_100, earningsKes: 19_200, status: 'processing' },
  { id: 'v6', title: 'Morning Workout in Nairobi', category: 'Sports', views: 14_530, likes: 1_295, earningsKes: 7_050, status: 'under_review' },
];

/* -- Helpers ----------------------------------------------- */

function getStatusStyle(status: DemoVideo['status']) {
  switch (status) {
    case 'live':
      return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'processing':
      return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'under_review':
      return 'bg-sky-100 text-sky-700 border-sky-200';
    case 'draft':
      return 'bg-gray-100 text-gray-600 border-gray-200';
    default:
      return 'bg-gray-100 text-gray-600 border-gray-200';
  }
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

function formatKes(n: number): string {
  return `KES ${n.toLocaleString()}`;
}

/* -- Stat Card ---------------------------------------------- */

interface StatCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  gradient: string;
  iconBg: string;
  iconColor: string;
}

function StatCard({ label, value, icon, gradient, iconBg, iconColor }: StatCardProps) {
  return (
    <Card className={`border-gray-100 ${gradient}`}>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconBg} ${iconColor} shrink-0`}>
          {icon}
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
          <p className="text-xl font-extrabold text-gray-900">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

/* -- Inquiries Section --------------------------------------------- */

interface InquiryItem {
  id: string;
  _type: 'brand' | 'booking';
  brandName?: string;
  contactName?: string;
  contactEmail: string;
  message: string;
  eventType?: string | null;
  roughDate?: string | null;
  status: string;
  createdAt: string;
}

function InquiriesSection({ creatorId }: { creatorId: string }) {
  const [inquiries, setInquiries] = useState<InquiryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'new' | 'responded' | 'closed'>('all');

  const fetchInquiries = useCallback(async () => {
    if (!creatorId) { setLoading(false); return; }
    try {
      const res = await fetch(`/api/creator/inquiries?creatorId=${encodeURIComponent(creatorId)}`);
      if (res.ok) setInquiries(await res.json());
    } catch {}
    setLoading(false);
  }, [creatorId]);

  useEffect(() => { fetchInquiries(); }, [fetchInquiries]);

  const filtered = filter === 'all' ? inquiries : inquiries.filter(i => i.status === filter);
  const newCount = inquiries.filter(i => i.status === 'new').length;

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffHr = Math.floor(diffMs / 3600000);
    const diffDay = Math.floor(diffMs / 86400000);
    if (diffHr < 1) return 'Just now';
    if (diffHr < 24) return `${diffHr}h ago`;
    if (diffDay < 7) return `${diffDay}d ago`;
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  };

  if (!creatorId) return null;

  return (
    <Card className="border-gray-100 mt-8">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-emerald-600" />
          Inquiries
          {newCount > 0 && (
            <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[10px] font-semibold">
              {newCount} new
            </Badge>
          )}
        </CardTitle>
        <div className="flex items-center gap-1">
          {(['all', 'new', 'responded', 'closed'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors capitalize ${
                filter === f ? 'bg-emerald-100 text-emerald-700' : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-emerald-400" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <Inbox className="h-8 w-8 mb-2" />
            <p className="text-sm">No inquiries yet</p>
            <p className="text-xs mt-1">Brands and fans will reach out here</p>
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
            {filtered.map((inq) => (
              <div key={inq.id} className="px-4 py-3 hover:bg-gray-50/50 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 min-w-0">
                    <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${
                      inq._type === 'brand' ? 'bg-emerald-100 text-emerald-600' : 'bg-violet-100 text-violet-600'
                    }`}>
                      {inq._type === 'brand' ? <Building2 className="h-3.5 w-3.5" /> : <Calendar className="h-3.5 w-3.5" />}
                    </div>
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold text-gray-900 truncate">
                          {inq._type === 'brand' ? inq.brandName : inq.eventType || 'Event'}
                        </span>
                        <Badge variant="outline" className={`text-[10px] font-semibold shrink-0 ${
                          inq.status === 'new' ? 'border-amber-200 bg-amber-50 text-amber-700' :
                          inq.status === 'responded' ? 'border-sky-200 bg-sky-50 text-sky-700' :
                          'border-gray-200 bg-gray-50 text-gray-500'
                        }`}>
                          {inq.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 truncate">
                        {inq._type === 'booking' && inq.contactName ? `${inq.contactName} · ` : ''}
                        {inq.contactEmail}
                        {inq._type === 'booking' && inq.roughDate ? ` · ${inq.roughDate}` : ''}
                      </p>
                      <p className="text-xs text-gray-600 line-clamp-2 mt-1">{inq.message}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-400 shrink-0">
                    <Clock className="h-3 w-3" />
                    {formatTime(inq.createdAt)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* -- Component --------------------------------------------- */

export function CreatorDashboardPage() {
  const navigate = useAppStore((s) => s.navigate);
  const viewParams = useAppStore((s) => s.viewParams);
  const logout = useAppStore((s) => s.logout);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Nav Bar */}
      <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6">
            <button
              onClick={() => navigate('landing')}
              className="text-2xl font-extrabold tracking-tight text-emerald-600 hover:text-emerald-700 transition-colors"
            >
              AfriSpine
            </button>
            <nav className="hidden sm:flex items-center gap-1">
              <button
                onClick={() => navigate('watch')}
                className="px-3 py-1.5 rounded-md text-sm font-medium text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
              >
                Watch
              </button>
              <span className="px-3 py-1.5 rounded-md text-sm font-semibold text-emerald-600 bg-emerald-50">
                Dashboard
              </span>
            </nav>
          </div>
          <button
            onClick={() => logout()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Exit</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          {/* Back + Upload row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <button
                onClick={() => navigate('watch')}
                className="mb-2 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-emerald-600 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Watch
              </button>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 flex items-center gap-2">
                <BarChart3 className="h-7 w-7 text-emerald-600" />
                Creator Dashboard
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Track your content performance and earnings
              </p>
            </div>

            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex">
                  <Button
                    disabled
                    className="bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 shrink-0 cursor-not-allowed"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload New Video
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>Coming soon</TooltipContent>
            </Tooltip>
          </div>

          {/* Stat Cards (2x2 grid) */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 mb-8">
            <StatCard
              label="Total Views"
              value={formatNumber(DEMO_STATS.totalViews)}
              icon={<Eye className="h-5 w-5" />}
              gradient="bg-gradient-to-br from-emerald-50 to-white"
              iconBg="bg-emerald-100"
              iconColor="text-emerald-600"
            />
            <StatCard
              label="Total Likes"
              value={formatNumber(DEMO_STATS.totalLikes)}
              icon={<Heart className="h-5 w-5" />}
              gradient="bg-gradient-to-br from-rose-50 to-white"
              iconBg="bg-rose-100"
              iconColor="text-rose-500"
            />
            <StatCard
              label="Total Earnings"
              value={formatKes(DEMO_STATS.totalEarningsKes)}
              icon={<Wallet className="h-5 w-5" />}
              gradient="bg-gradient-to-br from-amber-50 to-white"
              iconBg="bg-amber-100"
              iconColor="text-amber-600"
            />
            <StatCard
              label="Videos Posted"
              value={DEMO_STATS.videosPosted.toString()}
              icon={<Video className="h-5 w-5" />}
              gradient="bg-gradient-to-br from-emerald-50 to-white"
              iconBg="bg-emerald-100"
              iconColor="text-emerald-600"
            />
          </div>

          {/* My Videos Table */}
          <Card className="border-gray-100">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Video className="h-5 w-5 text-emerald-600" />
                My Videos
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {/* Mobile: card list, Desktop: table */}
              {/* Mobile Cards */}
              <div className="sm:hidden max-h-96 overflow-y-auto">
                <div className="divide-y divide-gray-100">
                  {DEMO_VIDEOS.map((v) => (
                    <div key={v.id} className="px-4 py-3 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{v.title}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{v.category}</p>
                        </div>
                        <Badge variant="outline" className={`text-[10px] font-semibold shrink-0 ${getStatusStyle(v.status)}`}>
                          {v.status.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        <div>
                          <p className="text-[10px] uppercase tracking-wide text-gray-400">Views</p>
                          <p className="text-xs font-bold text-gray-700">{formatNumber(v.views)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wide text-gray-400">Likes</p>
                          <p className="text-xs font-bold text-gray-700">{formatNumber(v.likes)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wide text-gray-400">Earnings</p>
                          <p className="text-xs font-bold text-gray-700">{formatKes(v.earningsKes)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Desktop Table */}
              <div className="hidden sm:block max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-100 hover:bg-transparent">
                      <TableHead className="text-xs text-gray-500 uppercase tracking-wide">Title</TableHead>
                      <TableHead className="text-xs text-gray-500 uppercase tracking-wide">Category</TableHead>
                      <TableHead className="text-xs text-gray-500 uppercase tracking-wide text-right">Views</TableHead>
                      <TableHead className="text-xs text-gray-500 uppercase tracking-wide text-right">Likes</TableHead>
                      <TableHead className="text-xs text-gray-500 uppercase tracking-wide text-right">Earnings</TableHead>
                      <TableHead className="text-xs text-gray-500 uppercase tracking-wide text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {DEMO_VIDEOS.map((v) => (
                      <TableRow key={v.id} className="border-gray-100">
                        <TableCell className="font-semibold text-sm text-gray-900 max-w-[220px] truncate">
                          {v.title}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">{v.category}</TableCell>
                        <TableCell className="text-sm text-right font-medium text-gray-700">
                          {formatNumber(v.views)}
                        </TableCell>
                        <TableCell className="text-sm text-right font-medium text-gray-700">
                          {formatNumber(v.likes)}
                        </TableCell>
                        <TableCell className="text-sm text-right font-medium text-gray-700">
                          {formatKes(v.earningsKes)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline" className={`text-[10px] font-semibold ${getStatusStyle(v.status)}`}>
                            {v.status.replace(/_/g, ' ')}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Share Your Profile — Invite Pack */}
          <div className="mt-8">
            <CreatorInvitePack
              creatorHandle={viewParams.creatorHandle || 'creator'}
              creatorName={viewParams.creatorName || 'AfriSpine Creator'}
              referralCode={viewParams.referralCode}
            />
          </div>

          {/* Inquiries Section */}
          <InquiriesSection creatorId={viewParams.creatorId || ''} />

          {/* Demo note */}
          <p className="mt-6 text-center text-xs text-gray-400">
            Showing demo data — connect your creator account for live metrics.
          </p>
        </div>
      </main>
    </div>
  );
}
