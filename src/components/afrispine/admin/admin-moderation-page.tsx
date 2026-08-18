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
  AlertTriangle,
  Shield,
  Ban,
  CheckCircle,
  Clock,
  Loader2,
  User,
  MessageSquare,
  Film,
} from 'lucide-react';
import { useAppStore } from '@/stores/app';

interface PendingReport {
  id: string;
  videoId: string;
  videoTitle: string;
  reporterPhone: string | null;
  reason: string;
  createdAt: string;
}

export function AdminModerationPage() {
  const logoutAdmin = useAppStore((s) => s.logoutAdmin);

  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<PendingReport[]>([]);

  // Takedown confirm dialog
  const [takedownTarget, setTakedownTarget] = useState<PendingReport | null>(null);
  const [takedownLoading, setTakedownLoading] = useState(false);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/content-takedown?status=pending');
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          logoutAdmin();
          return;
        }
        toast.error('Failed to load pending reports');
        return;
      }
      const data = await res.json();
      setReports(Array.isArray(data) ? data : data.reports ?? []);
    } catch {
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  }, [logoutAdmin]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleDismiss = async (reportId: string) => {
    try {
      const res = await fetch('/api/admin/content-takedown', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId, action: 'dismiss' }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || 'Failed to dismiss report');
        return;
      }
      setReports((prev) => prev.filter((r) => r.id !== reportId));
      toast.success('Report dismissed');
    } catch {
      toast.error('Network error');
    }
  };

  const handleTakedown = async () => {
    if (!takedownTarget) return;
    setTakedownLoading(true);
    try {
      const res = await fetch('/api/admin/content-takedown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId: takedownTarget.videoId, reportId: takedownTarget.id }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || 'Takedown failed');
        return;
      }
      toast.success('Video taken down successfully');
      setReports((prev) => prev.filter((r) => r.id !== takedownTarget.id));
      setTakedownTarget(null);
    } catch {
      toast.error('Network error');
    } finally {
      setTakedownLoading(false);
    }
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
        <h1 className="text-2xl font-bold text-white">Content Moderation</h1>
        <p className="text-gray-400">Review and action pending content reports</p>
      </div>

      {/* Pending reports list */}
      {reports.length === 0 ? (
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="flex flex-col items-center justify-center py-16 space-y-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-900/40">
              <CheckCircle className="h-7 w-7 text-emerald-400" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-white font-medium">No pending reports</p>
              <p className="text-sm text-gray-500">All clear — nothing to review right now.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-gray-400">Showing {reports.length} pending report{reports.length !== 1 ? 's' : ''}</p>
          {reports.map((report) => (
            <Card key={report.id} className="bg-gray-800 border-gray-700 hover:border-gray-600 transition-colors">
              <CardContent className="pt-5 space-y-3">
                {/* Top row: video info + time */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-700 text-gray-400 mt-0.5">
                      <Film className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 space-y-0.5">
                      <p className="text-sm font-medium text-white truncate">
                        {report.videoTitle || report.videoId}
                      </p>
                      <p className="text-xs font-mono text-gray-500 truncate">
                        ID: {report.videoId.length > 24 ? report.videoId.slice(0, 24) + '...' : report.videoId}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 shrink-0">
                    <Clock className="h-3.5 w-3.5" />
                    {formatTime(report.createdAt)}
                  </div>
                </div>

                <Separator className="bg-gray-700/50" />

                {/* Reason + reporter */}
                <div className="space-y-2 pl-12">
                  <div className="flex items-start gap-2">
                    <MessageSquare className="h-3.5 w-3.5 text-amber-400 mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-gray-400 font-medium">Reason</p>
                      <p className="text-sm text-gray-200">{report.reason}</p>
                    </div>
                  </div>
                  {report.reporterPhone && (
                    <div className="flex items-start gap-2">
                      <User className="h-3.5 w-3.5 text-gray-500 mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-gray-400 font-medium">Reporter</p>
                        <p className="text-sm text-gray-300 font-mono">{report.reporterPhone}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pl-12 pt-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDismiss(report.id)}
                    className="text-gray-400 hover:text-white hover:bg-gray-700 text-xs h-8"
                  >
                    Dismiss
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTakedownTarget(report)}
                    className="border-red-800 text-red-400 hover:bg-red-900/30 hover:text-red-300 text-xs h-8"
                  >
                    <Ban className="mr-1.5 h-3.5 w-3.5" />
                    Take Down
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Takedown confirmation dialog */}
      <Dialog open={!!takedownTarget} onOpenChange={(open) => !open && setTakedownTarget(null)}>
        <DialogContent className="bg-gray-900 border-gray-700 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              Confirm Video Takedown
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              This action will immediately remove the video from public access.
              This cannot be easily undone.
            </DialogDescription>
          </DialogHeader>
          {takedownTarget && (
            <div className="rounded-lg bg-gray-800 border border-gray-700 p-3 space-y-1">
              <p className="text-xs text-gray-500">Video</p>
              <p className="text-sm text-white font-medium truncate">
                {takedownTarget.videoTitle || takedownTarget.videoId}
              </p>
              <p className="text-xs text-gray-500 font-mono">{takedownTarget.videoId}</p>
              <Separator className="bg-gray-700 my-2" />
              <p className="text-xs text-gray-500">Report reason</p>
              <p className="text-sm text-gray-300">{takedownTarget.reason}</p>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setTakedownTarget(null)}
              className="text-gray-400 hover:text-white hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button
              onClick={handleTakedown}
              disabled={takedownLoading}
              className="bg-red-600 text-white hover:bg-red-500"
            >
              {takedownLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Ban className="mr-2 h-4 w-4" />
              Take Down Video
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
