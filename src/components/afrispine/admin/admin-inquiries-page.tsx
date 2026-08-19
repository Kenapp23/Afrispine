'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  MessageSquare,
  Building2,
  Calendar,
  Clock,
  CheckCircle,
  Loader2,
  Mail,
  User,
  Inbox,
} from 'lucide-react';
import { useAppStore } from '@/stores/app';

type InquiryStatus = 'new' | 'responded' | 'closed';
type FilterTab = 'all' | 'new' | 'responded' | 'closed';

interface BaseInquiry {
  id: string;
  creatorId: string;
  contactEmail: string;
  message: string;
  status: string;
  createdAt: string;
}

interface BrandInquiry extends BaseInquiry {
 _type: 'brand';
  brandName: string;
}

interface BookingInquiry extends BaseInquiry {
  _type: 'booking';
  eventType: string | null;
  roughDate: string | null;
  contactName: string | null;
}

type Inquiry = BrandInquiry | BookingInquiry;

const STATUS_BADGE_MAP: Record<InquiryStatus, { label: string; className: string }> = {
  new: { label: 'New', className: 'bg-amber-900/50 text-amber-300 border-amber-700/50' },
  responded: { label: 'Responded', className: 'bg-sky-900/50 text-sky-300 border-sky-700/50' },
  closed: { label: 'Closed', className: 'bg-gray-700/50 text-gray-400 border-gray-600/50' },
};

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'new', label: 'New' },
  { key: 'responded', label: 'Responded' },
  { key: 'closed', label: 'Closed' },
];

function getStatusBadge(status: string) {
  const s = status as InquiryStatus;
  const entry = STATUS_BADGE_MAP[s] || STATUS_BADGE_MAP.new;
  return (
    <Badge variant="outline" className={entry.className}>
      {entry.label}
    </Badge>
  );
}

export function AdminInquiriesPage() {
  const logoutAdmin = useAppStore((s) => s.logoutAdmin);

  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterTab>('new');
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Confirmation dialog
  const [confirmAction, setConfirmAction] = useState<{
    inquiry: Inquiry;
    newStatus: InquiryStatus;
  } | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const fetchInquiries = useCallback(async () => {
    setLoading(true);
    try {
      const query = filter === 'all' ? '' : `?status=${filter}`;

      const [brandRes, bookingRes] = await Promise.all([
        fetch(`/api/creator/brand-inquiry${query}`),
        fetch(`/api/creator/booking-inquiry${query}`),
      ]);

      if (brandRes.status === 401 || brandRes.status === 403 || bookingRes.status === 401 || bookingRes.status === 403) {
        logoutAdmin();
        return;
      }

      const brandData = brandRes.ok ? await brandRes.json().catch(() => []) : [];
      const bookingData = bookingRes.ok ? await bookingRes.json().catch(() => []) : [];

      const brandList: Inquiry[] = (Array.isArray(brandData) ? brandData : brandData.inquiries ?? []).map(
        (b: Record<string, unknown>) => ({ ...b, _type: 'brand' } as BrandInquiry),
      );
      const bookingList: Inquiry[] = (Array.isArray(bookingData) ? bookingData : bookingData.inquiries ?? []).map(
        (b: Record<string, unknown>) => ({ ...b, _type: 'booking' } as BookingInquiry),
      );

      const merged = [...brandList, ...bookingList].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

      setInquiries(merged);
    } catch {
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  }, [filter, logoutAdmin]);

  useEffect(() => {
    fetchInquiries();
  }, [fetchInquiries]);

  const handleStatusUpdate = async (id: string, type: 'brand' | 'booking', newStatus: InquiryStatus) => {
    setActionLoading(id);
    try {
      const endpoint =
        type === 'brand'
          ? '/api/creator/brand-inquiry'
          : '/api/creator/booking-inquiry';
      const res = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          logoutAdmin();
          return;
        }
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || 'Failed to update inquiry');
        return;
      }

      setInquiries((prev) =>
        prev.map((inq) =>
          inq.id === id ? { ...inq, status: newStatus } : inq,
        ),
      );
      toast.success(`Inquiry marked as ${newStatus}`);
    } catch {
      toast.error('Network error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleConfirmAction = async () => {
    if (!confirmAction) return;
    setConfirmLoading(true);
    try {
      const { inquiry, newStatus } = confirmAction;
      const endpoint =
        inquiry._type === 'brand'
          ? '/api/creator/brand-inquiry'
          : '/api/creator/booking-inquiry';
      const res = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: inquiry.id, status: newStatus }),
      });

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          logoutAdmin();
          return;
        }
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || 'Failed to update inquiry');
        return;
      }

      setInquiries((prev) =>
        prev.map((inq) =>
          inq.id === confirmAction.inquiry.id ? { ...inq, status: newStatus } : inq,
        ),
      );
      toast.success(`Inquiry marked as ${newStatus}`);
      setConfirmAction(null);
    } catch {
      toast.error('Network error');
    } finally {
      setConfirmLoading(false);
    }
  };

  const openConfirm = (inquiry: Inquiry, newStatus: InquiryStatus) => {
    setConfirmAction({ inquiry, newStatus });
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMs / 3600000);
    const diffDay = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    if (diffDay < 7) return `${diffDay}d ago`;
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  };

  const truncate = (text: string, maxLen: number) => {
    if (text.length <= maxLen) return text;
    return text.slice(0, maxLen) + '...';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-gray-900 text-white min-h-screen -mx-4 -my-6 px-4 py-6 sm:-mx-6 sm:px-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Inquiries</h1>
        <p className="text-gray-400">Manage brand and booking inquiries from creators</p>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 rounded-lg bg-gray-800 p-1 w-fit">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              filter === tab.key
                ? 'bg-gray-700 text-white'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Inquiries list */}
      {inquiries.length === 0 ? (
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="flex flex-col items-center justify-center py-16 space-y-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-900/40">
              <Inbox className="h-7 w-7 text-emerald-400" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-white font-medium">No inquiries found</p>
              <p className="text-sm text-gray-500">
                {filter === 'all'
                  ? 'There are no inquiries yet.'
                  : `No ${filter} inquiries at the moment.`}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-gray-400">
            Showing {inquiries.length} inquiry{inquiries.length !== 1 ? 'ies' : 'y'}
          </p>
          <div className="max-h-96 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
            {inquiries.map((inq) => {
              const isBrand = inq._type === 'brand';
              return (
                <Card
                  key={inq.id}
                  className="bg-gray-800 border-gray-700 hover:border-gray-600 transition-colors"
                >
                  <CardContent className="pt-5 space-y-3">
                    {/* Top row: type badge + name + time */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-700 text-gray-400 mt-0.5">
                          {isBrand ? (
                            <Building2 className="h-4 w-4" />
                          ) : (
                            <Calendar className="h-4 w-4" />
                          )}
                        </div>
                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className={
                                isBrand
                                  ? 'bg-emerald-900/40 text-emerald-300 border-emerald-700/50'
                                  : 'bg-violet-900/40 text-violet-300 border-violet-700/50'
                              }
                            >
                              {isBrand ? 'Brand' : 'Booking'}
                            </Badge>
                            {getStatusBadge(inq.status)}
                          </div>
                          <p className="text-sm font-medium text-white truncate">
                            {isBrand
                              ? (inq as BrandInquiry).brandName
                              : (inq as BookingInquiry).contactName || 'Unknown'}
                          </p>
                          <p className="text-xs font-mono text-gray-500 truncate">
                            Creator: {inq.creatorId.length > 24 ? inq.creatorId.slice(0, 24) + '...' : inq.creatorId}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 shrink-0">
                        <Clock className="h-3.5 w-3.5" />
                        {formatTime(inq.createdAt)}
                      </div>
                    </div>

                    <Separator className="bg-gray-700/50" />

                    {/* Details */}
                    <div className="space-y-2 pl-12">
                      <div className="flex items-start gap-2">
                        <Mail className="h-3.5 w-3.5 text-gray-500 mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs text-gray-400 font-medium">Contact</p>
                          <p className="text-sm text-gray-300">{inq.contactEmail}</p>
                        </div>
                      </div>
                      {!isBrand && (inq as BookingInquiry).eventType && (
                        <div className="flex items-start gap-2">
                          <Calendar className="h-3.5 w-3.5 text-gray-500 mt-0.5 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs text-gray-400 font-medium">Event</p>
                            <p className="text-sm text-gray-300">
                              {(inq as BookingInquiry).eventType}
                              {(inq as BookingInquiry).roughDate &&
                                ` · ${(inq as BookingInquiry).roughDate}`}
                            </p>
                          </div>
                        </div>
                      )}
                      <div className="flex items-start gap-2">
                        <MessageSquare className="h-3.5 w-3.5 text-amber-400 mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs text-gray-400 font-medium">Message</p>
                          <p className="text-sm text-gray-200">{truncate(inq.message, 180)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pl-12 pt-1">
                      {inq.status !== 'responded' && inq.status !== 'closed' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={actionLoading === inq.id}
                          onClick={() => handleStatusUpdate(inq.id, inq._type, 'responded')}
                          className="text-sky-400 hover:text-sky-300 hover:bg-sky-900/20 text-xs h-8"
                        >
                          {actionLoading === inq.id ? (
                            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <CheckCircle className="mr-1.5 h-3.5 w-3.5" />
                          )}
                          Mark Responded
                        </Button>
                      )}
                      {inq.status !== 'closed' && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={actionLoading === inq.id}
                          onClick={() => openConfirm(inq, 'closed')}
                          className="border-gray-600 text-gray-400 hover:bg-gray-700 hover:text-gray-200 text-xs h-8"
                        >
                          <CheckCircle className="mr-1.5 h-3.5 w-3.5" />
                          Mark Closed
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Close confirmation dialog */}
      <Dialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <DialogContent className="bg-gray-900 border-gray-700 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-gray-400" />
              Confirm Close Inquiry
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Are you sure you want to close this inquiry? This marks it as resolved and
              it will no longer appear in active lists.
            </DialogDescription>
          </DialogHeader>
          {confirmAction && (
            <div className="rounded-lg bg-gray-800 border border-gray-700 p-3 space-y-1">
              <p className="text-xs text-gray-500">Type</p>
              <p className="text-sm text-white font-medium">
                {confirmAction.inquiry._type === 'brand' ? 'Brand' : 'Booking'} Inquiry
              </p>
              <Separator className="bg-gray-700 my-2" />
              <p className="text-xs text-gray-500">From</p>
              <p className="text-sm text-gray-300">
                {confirmAction.inquiry._type === 'brand'
                  ? (confirmAction.inquiry as BrandInquiry).brandName
                  : (confirmAction.inquiry as BookingInquiry).contactName || 'Unknown'}
                {' · '}
                {confirmAction.inquiry.contactEmail}
              </p>
              <Separator className="bg-gray-700 my-2" />
              <p className="text-xs text-gray-500">Message</p>
              <p className="text-sm text-gray-300">{truncate(confirmAction.inquiry.message, 200)}</p>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setConfirmAction(null)}
              className="text-gray-400 hover:text-white hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmAction}
              disabled={confirmLoading}
              className="bg-gray-700 text-white hover:bg-gray-600"
            >
              {confirmLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <CheckCircle className="mr-2 h-4 w-4" />
              Close Inquiry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
